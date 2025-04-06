import { loadSettings } from './utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  // Check if API key is set
  const settings = await loadSettings();
  
  if (!settings.geminiApiKey) {
    // Show warning
    statusElement.textContent = 'API キーが設定されていません。拡張機能の設定ページで設定してください。';
    statusElement.className = 'status error';
    statusElement.style.display = 'block';
    startBtn.disabled = true;
  }
  
  // Start button click handler
  startBtn.addEventListener('click', async () => {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab || !activeTab.id) {
      showError('アクティブなタブが見つかりませんでした。拡張機能を再読み込みしてください。');
      return;
    }
    
    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, { action: 'startConversation' }, (response) => {
      // Note: response might be undefined if content script hasn't been injected yet
      if (chrome.runtime.lastError) {
        injectContentScriptAndStart(activeTab.id!);
      }
    });
    
    // Close popup
    window.close();
  });

  // 設定ページリンクのイベントハンドラ
  document.getElementById('settingsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

/**
 * Injects the content script and starts the conversation
 * @param tabId ID of the tab to inject into
 */
const injectContentScriptAndStart = async (tabId: number) => {
  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    
    // Start conversation
    chrome.tabs.sendMessage(tabId, { action: 'startConversation' });
  } catch (error) {
    console.error('Error injecting content script:', error);
    showError('コンテンツスクリプトの読み込みに失敗しました。拡張機能を再読み込みしてください。');
  }
};

/**
 * Shows an error message in the popup
 * @param message Error message to show
 */
const showError = (message: string) => {
  const statusElement = document.getElementById('status') as HTMLDivElement;
  statusElement.textContent = message;
  statusElement.className = 'status error';
  statusElement.style.display = 'block';
};