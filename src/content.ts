import { h, render } from 'preact'; // Added Preact imports
import { MessageType, Conversation, ConversationLine, Character, ConversationMode, DEFAULT_SETTINGS } from './types'; // Import DEFAULT_SETTINGS
import { extractPageContent } from './utils/extractPageContent';
import { ConversationUI } from './ui/content/ConversationUI'; // Import the actual component
import { loadSettings } from './utils/storage';

// --- State Management ---
let conversation: Conversation | null = null;
let currentAudio: HTMLAudioElement | null = null; // Audio playback still needs direct control
let currentLineIndex = 0;
let isPlaying = false;
let isLoading = false; // Added loading state
let error: { code: string; message: string } | null = null; // Added error state
let isUIVisible = false; // Track UI visibility
let autoPlayOnReady = false; // For auto-play after generation
let currentMode = ConversationMode.CASUAL; // Default mode
let enableVoice = true; // Added state for voice setting
let pageTitle = ''; // Added state for page title
let pageUrl = ''; // Added state for page url
let generatedAt: Date | null = null; // Added state for generation timestamp

// Preact root element references
let rootElement: HTMLElement | null = null; // The element where Preact renders UI components
let containerElement: HTMLElement | null = null; // The container element with shadow DOM
const ROOT_ELEMENT_ID = 'zunda-metan-content-root';

// --- Core Logic ---

// BFCache handling
window.addEventListener('pageshow', (event: PageTransitionEvent) => { // Use window for pageshow
  if (event.persisted) {
    console.log('Page was restored from BFCache.');
    if (isUIVisible && rootElement) {
      renderConversationUI(); // Re-render if UI was visible
    }
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type) {
    console.log('Content script received message from background:', message.type);
    switch (message.type) {
      case MessageType.GENERATED_CONVERSATION:
        handleGeneratedConversation(message.payload);
        sendResponse({ status: 'ok' });
        break;
      case MessageType.SPEECH_SYNTHESIZED:
        handleSpeechSynthesized(message.payload);
        sendResponse({ status: 'ok' });
        break;
      case MessageType.ERROR:
        handleError(message.payload);
        sendResponse({ status: 'ok' });
        break;
      default:
        sendResponse({ status: 'unknown_message_type' });
        return false; 
    }
    return false; // Indicate sync response not needed or handled
  } else if (message.action === 'startConversation') {
    console.log('Content script received startConversation command from popup');
    // Check if mode is specified in the message
    const mode = message.mode ? message.mode : ConversationMode.CASUAL;
    startConversation(mode);
    sendResponse({ status: 'processing' }); // Acknowledge popup
    return false;
  } else if (message.action === 'startProfessionalConversation') {
    console.log('Content script received startProfessionalConversation command from popup');
    startConversation(ConversationMode.PROFESSIONAL);
    sendResponse({ status: 'processing' }); // Acknowledge popup
    return false;
  }
  return false;
});

/**
 * Initializes or restarts the conversation process.
 * @param mode Conversation mode (casual or professional)
 */
async function startConversation(mode: ConversationMode = ConversationMode.CASUAL) {
  console.log(`Starting conversation process in ${mode} mode...`);
  
  currentMode = mode;
  
  // Reset state
  conversation = null;
  stopAndResetPlayback(); // Stop any existing audio
  isLoading = true;
  error = null;
  autoPlayOnReady = true; // Reset auto-play flag
  isUIVisible = true;
  pageTitle = document.title; // Get page title
  pageUrl = location.href; // Get page URL
  generatedAt = null; // Reset timestamp

  // Load settings first
  try {
    const settings = await loadSettings();
    enableVoice = settings.enableVoice; // Update voice setting state
    // Use default mode from settings if not explicitly passed
    if (mode === undefined) {
      mode = settings.defaultConversationMode || ConversationMode.CASUAL;
    }
    currentMode = mode; // Update current mode state
  } catch (err) {
    console.error('Error loading settings in startConversation:', err);
    // Use defaults if loading fails
    enableVoice = DEFAULT_SETTINGS.enableVoice;
    currentMode = mode || DEFAULT_SETTINGS.defaultConversationMode;
  }

  // Ensure root element exists and render initial UI (now with potentially updated enableVoice)
  ensureRootElement();
  renderConversationUI();


  // Extract content and send to background
  const pageContent = extractPageContent();
  chrome.runtime.sendMessage({
    type: MessageType.START_CONVERSATION,
    payload: {
      content: pageContent,
      mode: mode
    }
  });
}

/**
 * Handles the generated conversation data from the background.
 * Also triggers speech synthesis if enabled.
 */
async function handleGeneratedConversation(generatedConversation: Conversation) {
  conversation = generatedConversation;
  isLoading = false; // Turn off loading state
  error = null; // Clear any previous error
  generatedAt = new Date(); // Set generation timestamp

  // Update current mode if available from conversation
  if (conversation.mode) {
    currentMode = conversation.mode;
  }

  // Load settings again to ensure we have the latest value for enableVoice
  try {
    const settings = await loadSettings();
    enableVoice = settings.enableVoice;
  } catch (err) {
    console.error('Error loading settings in handleGeneratedConversation:', err);
    enableVoice = DEFAULT_SETTINGS.enableVoice; // Fallback to default
  }

  // Re-render the UI with the new conversation data (before synthesis starts)
  renderConversationUI();

  // Trigger speech synthesis for each line IF voice is enabled
  if (enableVoice && conversation && conversation.lines) {
    console.log('Voice enabled, requesting synthesis...');
    conversation.lines.forEach((line, index) => {
      // Send message to background to synthesize speech for this line
      chrome.runtime.sendMessage({
        type: MessageType.SYNTHESIZE_SPEECH,
        payload: {
          text: line.text,
          character: line.character,
          index: index // Pass index to map audio back correctly
        }
      });
    });
  } else {
    console.log('Voice disabled, skipping synthesis.');
    // If voice is disabled, we might want to trigger "playback" completion immediately
    // or handle the UI state differently. For now, playback controls rely on audioUrl.
    if (autoPlayOnReady) {
        // If auto-play was intended but voice is off, reset the flag
        // and potentially update UI to show it won't play.
        autoPlayOnReady = false;
        // Optionally update UI state here if needed
        renderConversationUI();
    }
  }
}

/**
 * Handles synthesized speech data for a specific line.
 */
function handleSpeechSynthesized(payload: { index: number; audioUrl: string }) {
  // Only process if voice is still considered enabled and conversation exists
  if (!enableVoice || !conversation || !conversation.lines[payload.index]) return;

  console.log(`Received speech synthesis for line ${payload.index}`);
  conversation.lines[payload.index].audioUrl = payload.audioUrl;

  // Start playback automatically if it's the first line and auto-play is enabled
  // Ensure isPlaying is false before starting automatically
  if (payload.index === 0 && autoPlayOnReady && !isPlaying) {
    console.log('Auto-playing conversation...');
    autoPlayOnReady = false; // Disable auto-play after starting once
    startPlayback(); 
  }
  
  // If we're currently waiting for this specific line's audio while playing (retry mechanism active)
  // and the current line doesn't have audio yet, this update might be for the line we're waiting on
  if (isPlaying && currentLineIndex < conversation.lines.length) {
    const currentLine = conversation.lines[currentLineIndex];
    if (!currentLine.audioUrl && payload.index === currentLineIndex) {
      console.log(`Audio became available for current playing line ${currentLineIndex}, resuming playback`);
      // Trigger playback of this line immediately, reset retry counter
      playCurrentLine(0, 2000);
    }
  }
  
  renderConversationUI(); // Re-render to update UI state (e.g., enable play button)
}

/**
 * Handles error messages from the background.
 */
function handleError(errorPayload: { code: string; message: string }) {
  console.error('Received error from background:', errorPayload);
  error = errorPayload;
  isLoading = false;
  conversation = null; // Clear conversation on error
  stopAndResetPlayback();
  renderConversationUI(); 
}

// --- UI Rendering ---

/**
 * Ensures the root element for the Preact app exists in the DOM.
 */
/**
 * Ensures the root element exists and properly sets up Shadow DOM if needed.
 * This handles both initial creation and subsequent reuse scenarios.
 */
function ensureRootElement() {
  // First check if container element exists and is still in document
  if (!containerElement || !document.body.contains(containerElement)) {
    // We need to create a new container and shadow DOM structure
    containerElement = document.getElementById(ROOT_ELEMENT_ID) as HTMLElement | null;
    
    // If it doesn't exist or has been removed, recreate it
    if (!containerElement) {
      console.log('Creating new container and shadow DOM structure');
      // Create the container element
      containerElement = document.createElement('div');
      containerElement.id = ROOT_ELEMENT_ID;
      containerElement.style.position = 'fixed';
      containerElement.style.zIndex = '2147483647';
      
      // Create a shadow DOM for style isolation
      const shadowRoot = containerElement.attachShadow({ mode: 'closed' });
      
      // Create a container within the shadow DOM for Preact to render into
      const shadowContainer = document.createElement('div');
      shadowContainer.id = 'shadow-container';
      shadowRoot.appendChild(shadowContainer);
      
      // Append the container element to the document body
      document.body.appendChild(containerElement);
      
      // Set rootElement to be the shadow container where Preact will render
      rootElement = shadowContainer;
    } else {
      // Container exists but we need to make sure we have the correct Shadow DOM reference
      console.log('Container exists, retrieving shadow DOM references');
      const shadowRoot = containerElement.shadowRoot;
      if (shadowRoot) {
        rootElement = shadowRoot.getElementById('shadow-container');
      } else {
        // This shouldn't happen, but just in case shadow DOM was detached somehow
        console.error('Shadow DOM is missing, recreating it');
        const newShadowRoot = containerElement.attachShadow({ mode: 'closed' });
        rootElement = document.createElement('div');
        rootElement.id = 'shadow-container';
        newShadowRoot.appendChild(rootElement);
      }
    }
  }
  
  // If for some reason containerElement exists but rootElement doesn't, reconnect them
  if (containerElement && !rootElement) {
    console.warn('Container exists but rootElement missing, reconnecting');
    if (containerElement.shadowRoot) {
      rootElement = containerElement.shadowRoot.getElementById('shadow-container');
      if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'shadow-container';
        containerElement.shadowRoot.appendChild(rootElement);
      }
    } else {
      const newShadowRoot = containerElement.attachShadow({ mode: 'closed' });
      rootElement = document.createElement('div');
      rootElement.id = 'shadow-container';
      newShadowRoot.appendChild(rootElement);
    }
  }
  
  if (containerElement) {
    containerElement.style.display = 'block'; // Ensure container is visible
  }
  
  if (!rootElement) {
    console.error('Failed to create or find root element for rendering');
    return;
  }
}

/**
 * Renders the Preact ConversationUI component with the current state.
 */
function renderConversationUI() {
  if (!rootElement) {
    console.error('Cannot render UI: Root element not found.');
    return;
  }
  
  // Create a style element to inject CSS inside the shadow DOM
  // This style will be isolated from the host page's styles
  if (!rootElement.querySelector('#shadow-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'shadow-styles';
    styleElement.textContent = `
      /*
       * Base and Reset Styles
       * Ensure all elements start with a clean slate
       */
      * {
        box-sizing: border-box;
        font-family: "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Noto Sans JP", "Meiryo", sans-serif;
        margin: 0;
        padding: 0;
        color: initial;
        font-size: initial;
        line-height: normal;
      }
      
      /*
       * Container Styles
       * Main wrapper for the chat UI
       */
      .conversation-container {
        all: initial; /* Reset all inherited properties */
        font-family: "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Noto Sans JP", "Meiryo", sans-serif;
        color: #333;
        box-sizing: border-box;
        line-height: 1.4;
      }
      
      /*
       * Conversation Message Styles
       * Ensure text is properly aligned in messages
       */
      .conversation-bubble div {
        text-align: left !important;
      }
      
      /*
       * Button Styles
       * Consistent styling for all buttons
       */
      button {
        position: relative !important;
        display: inline-block !important;
        font-family: inherit !important;
        text-align: center !important;
        vertical-align: middle !important;
        border: none;
        cursor: pointer;
      }
      
      /*
       * Header Styles
       * Ensure text in header is always white
       */
      .conversation-container [ref=headerRef],
      .conversation-container [ref=headerRef] * {
        color: #fff !important;
      }
      
      /* Mode indicator always white */
      .conversation-container [ref=headerRef] span[style*="modeIndicator"] {
        color: #fff !important;
        background: rgba(255, 255, 255, 0.3) !important;
      }
      
      /*
       * Control Button Styles
       * Make sure play/pause/stop buttons have proper spacing
       */
      .controls button {
        padding: 8px 15px !important;
        line-height: normal !important;
        font-weight: bold !important;
        border-radius: 20px !important;
      }
      
      /*
       * Animation for loading spinner
       */
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /*
       * Scrollbar Styles
       * Customized scrollbars for better aesthetics
       */
      .conversation-container *::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .conversation-container *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
      }
      
      .conversation-container *::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }
      
      .conversation-container *::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    `;
    rootElement.appendChild(styleElement);
  }

  // Render the actual ConversationUI component with current state and handlers
  const uiComponent = h(ConversationUI, {
      isLoading: isLoading,
      conversation: conversation,
      error: error,
      isPlaying: isPlaying,
      currentLineIndex: currentLineIndex,
      onPlayPause: handlePlayPause,
      onStop: handleStop,
      onClose: handleClose,
      mode: currentMode,
      enableVoice: enableVoice, // Pass voice setting to UI
      // Pass metadata to UI
      pageTitle: pageTitle,
      pageUrl: pageUrl,
      generatedAt: generatedAt
  });

  render(uiComponent, rootElement);
}

// --- Playback Control ---

/**
 * Starts or resumes audio playback from the current line.
 */
function startPlayback() {
  if (isPlaying || !conversation) return;
  
  isPlaying = true;
  playCurrentLine(); // Start playing the sequence
  renderConversationUI(); // Update UI to show playing state
}

/**
 * Pauses audio playback.
 */
function pausePlayback() {
  if (!isPlaying) return;
  
  if (currentAudio) {
    currentAudio.pause();
  }
  isPlaying = false;
  renderConversationUI(); // Update UI to show paused state
}

/**
 * Stops audio playback and resets the index.
 */
function stopAndResetPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null; // Remove listener
    currentAudio = null;
  }
  isPlaying = false;
  currentLineIndex = 0;
  if (isUIVisible) { // Only re-render if UI is supposed to be visible
      renderConversationUI(); // Update UI to show stopped state
  }
}

/**
 * Plays the audio for the current line index.
 * Includes retry mechanism for when audio isn't ready yet.
 */
function playCurrentLine(retryCount = 0, retryDelay = 2000) {
  if (!isPlaying || !conversation || currentLineIndex >= conversation.lines.length) {
    stopAndResetPlayback(); // Stop if end is reached or state is invalid
    return;
  }

  const line = conversation.lines[currentLineIndex];

  if (!line.audioUrl) {
    // Audio not ready yet, implement retry logic with exponential backoff
    const maxRetries = 8; // 増加：より多くのリトライ回数
    if (retryCount < maxRetries) {
      console.log(`Audio not ready for line ${currentLineIndex}, retrying in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        // Only retry if we're still in playing state
        if (isPlaying) {
          playCurrentLine(retryCount + 1, retryDelay * 2); // 増加：リトライごとに2倍の待ち時間
        }
      }, retryDelay);
      return;
    } else {
      // Max retries reached, log error and move to next line
      console.warn(`Audio not available for line ${currentLineIndex} after ${maxRetries} retries, skipping to next line`);
      currentLineIndex++;
      playCurrentLine(0, 2000); // Reset retry count for next line
      return;
    }
  }

  // Stop previous audio if any (shouldn't happen with proper onended handling)
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
  }

  // Create and play new audio
  currentAudio = new Audio(line.audioUrl);
  currentAudio.onended = () => {
    // Automatically move to the next line when audio finishes
    currentLineIndex++;
    playCurrentLine(0, 2000); // Reset retry count for next line
  };

  currentAudio.play().catch(err => {
    console.error('Error playing audio:', err);
    error = { code: 'audio_playback_error', message: `音声の再生に失敗しました: ${err instanceof Error ? err.message : String(err)}` };
    stopAndResetPlayback(); // Stop playback on error
  });

  renderConversationUI(); // Update UI to highlight the current line
}

// --- UI Event Handlers (Passed as props to Preact component) ---

function handlePlayPause() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function handleStop() {
  stopAndResetPlayback();
}

/**
 * Handles the close action for the conversation window.
 * Properly cleans up resources and hides the UI.
 */
function handleClose() {
  // First stop any audio playback
  stopAndResetPlayback();
  
  // Set UI visibility flag to false
  isUIVisible = false;
  
  // Unmount Preact components if rootElement exists
  if (rootElement) {
    render(null, rootElement); // Unmount the component
  }
  
  // Hide the container element if it exists
  if (containerElement) {
    containerElement.style.display = 'none'; // Hide the container element
  }
  
  // Complete reset of UI state to ensure clean reopening
  // Don't reset these values as they persist between sessions
  // currentMode = ConversationMode.CASUAL; // Don't reset mode preference
  // enableVoice = true; // Don't reset voice preference
  
  // Reset all UI-specific states
  conversation = null;
  currentLineIndex = 0;
  isPlaying = false;
  isLoading = false;
  error = null;
  autoPlayOnReady = false;
  generatedAt = null;
  
  // Note: we don't completely remove elements from DOM
  // to maintain position and size settings for a better UX
  console.log('Conversation UI closed');
}

console.log('ZundaMetan content script loaded.'); // Log script load
