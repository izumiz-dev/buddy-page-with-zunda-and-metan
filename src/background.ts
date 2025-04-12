import { MessageType, Character, Conversation, ConversationLine, ConversationMode } from './types';
import { GeminiAPI } from './utils/gemini';
import { VoicevoxAPI } from './utils/voicevox';
import { loadSettings } from './utils/storage';
import { parseConversation } from './utils/parser';

// Flag to track in-progress API requests
let isProcessingApiRequest = false;

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type || message.action);
  
  if (message.type === MessageType.START_CONVERSATION) {
    try {
      // Prevent duplicate requests
      if (!isProcessingApiRequest) {
        // 非同期処理を行う場合、即座に処理中のレスポンスを返す
        sendResponse({ status: 'processing' });
        handleStartConversation(message.payload.content, message.payload.mode, sender.tab?.id);
      } else {
        console.log('API request already in progress, ignoring duplicate');
        sendResponse({ status: 'already_processing' });
      }
    } catch (error) {
      console.error('Error handling START_CONVERSATION:', error);
      sendResponse({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
    return false;
  } else if (message.type === MessageType.SYNTHESIZE_SPEECH) {
    try {
      // 非同期処理もPromiseとして扱う
      handleSynthesizeSpeech(message.payload.text, message.payload.character)
        .then(audioUrl => {
          // 成功時のレスポンス
          sendResponse({ status: 'success', audioUrl });
        })
        .catch(error => {
          // エラー時のレスポンス
          console.error('Error in handleSynthesizeSpeech:', error);
          sendResponse({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        });
      
      // 非同期レスポンスを行うためtrueを返す
      return true;
    } catch (error) {
      console.error('Error handling SYNTHESIZE_SPEECH:', error);
      sendResponse({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }
  return false;
});

/**
 * Handles the start conversation message from popup or content script
 * @param pageContent Content of the webpage
 * @param mode Conversation mode (casual or professional)
 * @param tabId ID of the tab that sent the message
 */
const handleStartConversation = async (
  pageContent: string, 
  mode: ConversationMode = ConversationMode.CASUAL, 
  tabId?: number
) => {
  if (!tabId) return;
  console.log(`Background: handling start conversation request in ${mode} mode`);
  
  // Set processing flag
  isProcessingApiRequest = true;
  
  try {
    // Load settings
    const settings = await loadSettings();
    
    if (!settings.geminiApiKey) {
      throw new Error('Gemini API key is not set. Please set it in the options page.');
    }
    
    // Initialize Gemini API
    const geminiApi = new GeminiAPI(settings.geminiApiKey);
    
    // Generate conversation with the specified mode
    const conversationText = await geminiApi.generateConversation(pageContent, mode);
    
    // Parse conversation
    const conversation = parseConversation(conversationText);
    
    // Add mode to conversation metadata
    conversation.mode = mode;
    
    // Send the conversation back to the content script
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.GENERATED_CONVERSATION,
      payload: conversation
    });
    
    // Pre-synthesize speech for all lines
    if (settings.voicevoxUrl) {
      await preloadSpeech(conversation, settings.voicevoxUrl, settings.zundamonSpeakerId, settings.metanSpeakerId, tabId);
    }
    
    // Reset processing flag after successful completion
    isProcessingApiRequest = false;
  } catch (error) {
    console.error('Error starting conversation:', error);
    
    // Send error message to content script
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.ERROR,
      payload: {
        code: 'conversation_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    // Reset processing flag on error too
    isProcessingApiRequest = false;
  }
};

/**
 * Preloads speech for all conversation lines
 * @param conversation Conversation object
 * @param voicevoxUrl VOICEVOX server URL
 * @param zundamonSpeakerId Zundamon speaker ID
 * @param metanSpeakerId Metan speaker ID
 * @param tabId ID of the tab to send messages to
 */
const preloadSpeech = async (
  conversation: Conversation,
  voicevoxUrl: string,
  zundamonSpeakerId: string,
  metanSpeakerId: string,
  tabId: number
): Promise<void> => {
  const voicevoxApi = new VoicevoxAPI(voicevoxUrl);
  
  for (let i = 0; i < conversation.lines.length; i++) {
    const line = conversation.lines[i];
    try {
      const speakerId = line.character === Character.ZUNDAMON ? zundamonSpeakerId : metanSpeakerId;
      const audioUrl = await voicevoxApi.textToSpeechDataUri(line.text, speakerId);
      
      // Send the synthesized speech URL to the content script
      chrome.tabs.sendMessage(tabId, {
        type: MessageType.SPEECH_SYNTHESIZED,
        payload: {
          index: i,
          audioUrl
        }
      });
    } catch (error) {
      console.error(`Error synthesizing speech for line ${i}:`, error);
    }
  }
};

/**
 * Handles synthesize speech message from content script
 * @param text Text to synthesize
 * @param character Character speaking
 */
const handleSynthesizeSpeech = async (text: string, character: Character) => {
  try {
    // Load settings
    const settings = await loadSettings();
    
    if (!settings.voicevoxUrl) {
      throw new Error('VOICEVOX server URL is not set. Please set it in the options page.');
    }
    
    // Initialize VOICEVOX API
    const voicevoxApi = new VoicevoxAPI(settings.voicevoxUrl);
    
    // Get speaker ID based on character
    const speakerId = character === Character.ZUNDAMON 
      ? settings.zundamonSpeakerId 
      : settings.metanSpeakerId;
    
    // Synthesize speech
    const audioUrl = await voicevoxApi.textToSpeechDataUri(text, speakerId);
    
    // Return the audio URL
    return audioUrl;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};