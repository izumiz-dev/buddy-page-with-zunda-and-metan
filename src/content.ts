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

// Preact root element reference
let rootElement: HTMLElement | null = null;
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

  conversation.lines[payload.index].audioUrl = payload.audioUrl;

  // Start playback automatically if it's the first line and auto-play is enabled
  // Ensure isPlaying is false before starting automatically
  if (payload.index === 0 && autoPlayOnReady && !isPlaying) {
    console.log('Auto-playing conversation...');
    autoPlayOnReady = false; // Disable auto-play after starting once
    startPlayback(); 
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
function ensureRootElement() {
  if (!rootElement || !document.body.contains(rootElement)) {
    rootElement = document.getElementById(ROOT_ELEMENT_ID) as HTMLElement | null;
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = ROOT_ELEMENT_ID;
      rootElement.style.position = 'fixed'; // Basic positioning
      rootElement.style.zIndex = '2147483647'; // Ensure high z-index
      document.body.appendChild(rootElement);
    }
  }
  rootElement.style.display = 'block'; // Ensure visible
}

/**
 * Renders the Preact ConversationUI component with the current state.
 */
function renderConversationUI() {
  if (!rootElement) {
    console.error('Cannot render UI: Root element not found.');
    return;
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
 */
function playCurrentLine() {
  if (!isPlaying || !conversation || currentLineIndex >= conversation.lines.length) {
    stopAndResetPlayback(); // Stop if end is reached or state is invalid
    return;
  }

  const line = conversation.lines[currentLineIndex];

  if (!line.audioUrl) {
    // Audio not ready yet, wait or skip? For now, just stop.
    console.warn(`Audio not ready for line ${currentLineIndex}, stopping playback.`);
    stopAndResetPlayback(); 
    return;
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
    playCurrentLine(); // Play next line
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

function handleClose() {
  stopAndResetPlayback();
  isUIVisible = false;
  if (rootElement) {
    render(null, rootElement); // Unmount the component
    rootElement.style.display = 'none'; // Hide the root
  }
}

console.log('ZundaMetan content script loaded.'); // Log script load
