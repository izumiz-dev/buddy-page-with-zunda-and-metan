import { MessageType, Conversation, ConversationLine } from './types';
import { extractPageContent, createConversationUI, addConversationLine } from './utils/dom';

// State
let conversation: Conversation | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentLineIndex = 0;
let isPlaying = false;
let ui: {
  container: HTMLElement;
  conversationArea: HTMLElement;
  audioBtn: HTMLElement;
  stopBtn: HTMLElement;
} | null = null;

// Global tracking variable to prevent duplicate UI creation
let isProcessingRequest = false;

// 自動再生をトラッキングするフラグ
// 会話生成時に自動再生を有効化するため
let autoPlayOnReady = false;

// BFCacheに対応するためのライフサイクルイベントリスナー
document.addEventListener('pageshow', (event) => {
  // ページがBFCacheから復元された場合
  if (event.persisted) {
    console.log('Page was restored from BFCache, reinitializing message listeners');
    // UIが表示されていれば更新を試みる
    if (document.getElementById('zunda-metan-conversation')) {
      // UIの再構築などが必要な場合はここで対応
    }
  }
});

// Combined message listener to handle all messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from background script
  if (message.type) {
    console.log('Received message from background:', message.type);
    if (message.type === MessageType.GENERATED_CONVERSATION) {
      handleGeneratedConversation(message.payload);
      sendResponse({ status: 'ok' }); // 明示的にレスポンスを返す
      return false;
    } else if (message.type === MessageType.SPEECH_SYNTHESIZED) {
      handleSpeechSynthesized(message.payload);
      sendResponse({ status: 'ok' }); // 明示的にレスポンスを返す
      return false;
    } else if (message.type === MessageType.ERROR) {
      handleError(message.payload);
      sendResponse({ status: 'ok' }); // 明示的にレスポンスを返す
      return false;
    }
  }
  
  // Handle message from popup
  if (message.action === 'startConversation') {
    console.log('Received startConversation command');
    // Prevent duplicate requests
    if (!isProcessingRequest) {
      startConversation();
    } else {
      console.log('Request already in progress, ignoring duplicate');
    }
    sendResponse({ status: 'processing' }); // 明示的にレスポンスを返す
    return false;
  }
  
  return false;
});

/**
 * Handles the start conversation command from popup
 */
const startConversation = () => {
  console.log('Starting conversation...');
  
  // Set processing flag to prevent duplicates
  isProcessingRequest = true;
  
  // Check for existing UI elements
  const existingUI = document.getElementById('zunda-metan-conversation');
  if (existingUI) {
    // Remove any existing UI completely to avoid duplicates
    existingUI.remove();
    ui = null;
  }
  
  // Create new UI
  ui = createConversationUI();
  setupUIListeners();
  
  // 音声の準備が完了するまでボタンを無効化
  ui.audioBtn.disabled = true;
  ui.stopBtn.disabled = true;
  ui.stopBtn.style.opacity = '0.7';
  ui.stopBtn.style.cursor = 'not-allowed';
  
  // Reset state
  conversation = null;
  currentAudio = null;
  currentLineIndex = 0;
  isPlaying = false;
  
  // 自動再生を有効化
  autoPlayOnReady = true;
  
  // Show loading message
  const loadingElement = document.createElement('div');
  loadingElement.className = 'loading-message';
  loadingElement.textContent = '会話を生成中...';
  loadingElement.style.cssText = `
    padding: 10px;
    text-align: center;
    color: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100px;
  `;
  
  // ローディングインジケーターを追加
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.cssText = `
    width: 40px;
    height: 40px;
    margin: 15px auto;
    border: 3px solid rgba(76, 175, 80, 0.3);
    border-radius: 50%;
    border-top-color: #4caf50;
    animation: spin 1s ease-in-out infinite;
  `;
  
  // アニメーションのCSSを追加
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message {
      animation: fadeIn 0.3s ease-in-out;
    }
  `;
  document.head.appendChild(styleElement);
  
  loadingElement.appendChild(loadingIndicator);
  ui.conversationArea.appendChild(loadingElement);
  
  // Extract page content
  const pageContent = extractPageContent();
  
  // Send message to background script
  chrome.runtime.sendMessage({
    type: MessageType.START_CONVERSATION,
    payload: pageContent
  });
};

/**
 * Handles the generated conversation message from background script
 * @param generatedConversation Conversation object
 */
const handleGeneratedConversation = (generatedConversation: Conversation) => {
  if (!ui) return;
  
  // Save conversation
  conversation = generatedConversation;
  
  // Clear loading message - ローディング要素を取得する
  const loadingElement = ui.conversationArea.querySelector('.loading-message');
  if (loadingElement) {
    loadingElement.remove();
  }
  
  // Add conversation lines to UI
  ui.conversationArea.innerHTML = ''; // いったんクリア
  for (const line of conversation.lines) {
    addConversationLine(ui.conversationArea, line.character, line.text);
  }
  
  // Reset the scroll position to the top
  ui.conversationArea.scrollTop = 0;
  
  // Reset processing flag
  isProcessingRequest = false;
};

/**
 * Handles the speech synthesized message from background script
 * @param payload Speech synthesis result
 */
const handleSpeechSynthesized = (payload: { index: number; audioUrl: string }) => {
  if (!conversation) return;
  
  // Save audio URL to conversation line
  conversation.lines[payload.index].audioUrl = payload.audioUrl;
  
  // If this is the first line and we're not playing, enable play button
  if (payload.index === 0 && !isPlaying && ui) {
    ui.audioBtn.disabled = false;
    
    // 再生ボタンが有効になったら停止ボタンも有効化
    ui.stopBtn.disabled = false;
    ui.stopBtn.style.opacity = '1';
    ui.stopBtn.style.cursor = 'pointer';
    
    // 自動再生フラグが立っていれば自動再生を開始
    if (autoPlayOnReady) {
      console.log('Auto-playing conversation');
      // 自動再生フラグをリセット
      autoPlayOnReady = false;
      // 再生ボタンの表示を更新
      ui.audioBtn.textContent = '⏸ 一時停止';
      // 再生フラグをセット
      isPlaying = true;
      // 再生開始
      playCurrentLine();
    }
  }
  
  // 会話が再生中で、完全に音声が生成されたらユーザーに通知
  if (isAllAudioReady() && ui) {
    const statusElement = ui.conversationArea.querySelector('.audio-status');
    if (!statusElement) {
      const readyMessage = document.createElement('div');
      readyMessage.className = 'audio-status';
      readyMessage.textContent = '・・・音声準備完了・・・';
      readyMessage.style.cssText = `
        text-align: center;
        color: #4caf50;
        font-weight: bold;
        margin: 10px 0;
        padding: 5px;
        background-color: rgba(76, 175, 80, 0.1);
        border-radius: 5px;
      `;
      ui.conversationArea.appendChild(readyMessage);
      
      // 2秒後にメッセージをフェードアウト
      setTimeout(() => {
        if (readyMessage.parentNode) {
          readyMessage.style.opacity = '0';
          readyMessage.style.transition = 'opacity 1s';
          
          // フェードアウト後に要素を削除
          setTimeout(() => {
            if (readyMessage.parentNode) {
              readyMessage.remove();
            }
          }, 1000);
        }
      }, 2000);
    }
  }
};

/**
 * すべての音声が準備完了しているかチェック
 */
const isAllAudioReady = (): boolean => {
  if (!conversation) return false;
  
  return conversation.lines.every(line => line.audioUrl !== undefined);
};

/**
 * Handles error messages from background script
 * @param error Error object
 */
const handleError = (error: { code: string; message: string }) => {
  if (!ui) return;
  
  // Clear loading message
  ui.conversationArea.innerHTML = '';
  
  // Show error message
  const errorElement = document.createElement('div');
  errorElement.textContent = `エラー: ${error.message}`;
  errorElement.style.cssText = `
    padding: 10px;
    text-align: center;
    color: #f44336;
  `;
  ui.conversationArea.appendChild(errorElement);
  
  // Reset processing flag on error
  isProcessingRequest = false;
};

/**
 * Sets up UI event listeners
 */
const setupUIListeners = () => {
  if (!ui) return;
  
  // Play button
  ui.audioBtn.addEventListener('click', () => {
    if (!conversation) return;
    
    if (isPlaying) {
      // Pause playback
      if (currentAudio) {
        currentAudio.pause();
      }
      isPlaying = false;
      ui!.audioBtn.textContent = '🔊 再生';
    } else {
      // Start or resume playback
      playCurrentLine();
      isPlaying = true;
      ui!.audioBtn.textContent = '⏸ 一時停止';
    }
  });
  
  // Stop button
  ui.stopBtn.addEventListener('click', () => {
    stopPlayback();
  });
};

/**
 * Plays the current conversation line
 */
const playCurrentLine = () => {
  if (!conversation || !ui) return;
  
  if (currentLineIndex >= conversation.lines.length) {
    // Reached the end, reset to beginning
    currentLineIndex = 0;
  }
  
  const line = conversation.lines[currentLineIndex];
  
  if (!line.audioUrl) {
    // Audio not ready, try the next line
    currentLineIndex++;
    playCurrentLine();
    return;
  }
  
  // Highlight the current line
  const messageElements = ui.conversationArea.querySelectorAll('.message');
  messageElements.forEach((el, index) => {
    if (index === currentLineIndex) {
      el.classList.add('active');
      
      // Scroll to the current line if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      el.classList.remove('active');
    }
  });
  
  // Create and play audio
  currentAudio = new Audio(line.audioUrl);
  
  currentAudio.onended = () => {
    // Move to next line when audio finishes
    currentLineIndex++;
    if (isPlaying && currentLineIndex < conversation!.lines.length) {
      playCurrentLine();
    } else if (currentLineIndex >= conversation!.lines.length) {
      // End of conversation
      stopPlayback();
    }
  };
  
  currentAudio.play().catch(error => {
    console.error('Error playing audio:', error);
    // Try to proceed to next line on error
    currentLineIndex++;
    if (isPlaying) {
      playCurrentLine();
    }
  });
};

/**
 * Stops the audio playback
 */
const stopPlayback = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  isPlaying = false;
  currentLineIndex = 0;
  
  if (ui) {
    ui.audioBtn.textContent = '🔊 再生';
    
    // Remove highlighting
    const messageElements = ui.conversationArea.querySelectorAll('.message');
    messageElements.forEach(el => {
      el.classList.remove('active');
    });
  }
};