import { loadSettings, saveSettings, resetSettings } from './utils/storage';

// Form is modified flag
let isFormModified = false;

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('optionsForm') as HTMLFormElement;
  const geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
  const toggleApiKeyBtn = document.getElementById('toggleApiKey') as HTMLButtonElement;
  const voicevoxUrlInput = document.getElementById('voicevoxUrl') as HTMLInputElement;
  const zundamonSpeakerIdInput = document.getElementById('zundamonSpeakerId') as HTMLInputElement;
  const metanSpeakerIdInput = document.getElementById('metanSpeakerId') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  // Load current settings
  const settings = await loadSettings();
  
  // Fill in form with current settings
  geminiApiKeyInput.value = settings.geminiApiKey || '';
  voicevoxUrlInput.value = settings.voicevoxUrl || '';
  zundamonSpeakerIdInput.value = settings.zundamonSpeakerId || '';
  metanSpeakerIdInput.value = settings.metanSpeakerId || '';
  
  // Setup form change detection
  const formInputs = form.querySelectorAll('input');
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      isFormModified = true;
      form.classList.add('modified-form');
    });
  });
  
  // Toggle API key visibility
  toggleApiKeyBtn.addEventListener('click', () => {
    if (geminiApiKeyInput.type === 'password') {
      geminiApiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '非表示'; // 非表示
    } else {
      geminiApiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '表示'; // 表示
      
      // Clear selection to prevent copy operations
      window.getSelection()?.removeAllRanges();
    }
  });
  
  // Prevent copying from API key field
  geminiApiKeyInput.addEventListener('copy', (e) => {
    // Show security warning
    e.preventDefault();
    showStatus('APIキーをコピーすることはセキュリティのために無効化されています。', 'error');
  });
  
  // Reset API key field focus on blur
  geminiApiKeyInput.addEventListener('blur', () => {
    if (geminiApiKeyInput.type === 'text') {
      geminiApiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '表示';
    }
  });
  
  // Save button click handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Get form values
      const newSettings = {
        geminiApiKey: geminiApiKeyInput.value.trim(),
        voicevoxUrl: voicevoxUrlInput.value.trim(),
        zundamonSpeakerId: zundamonSpeakerIdInput.value.trim(),
        metanSpeakerId: metanSpeakerIdInput.value.trim()
      };
      
      // Validate form
      if (!newSettings.geminiApiKey) {
        showStatus('Gemini API Keyを入力してください。APIキーはGoogle AI Studioから取得できます。', 'error');
        return;
      }
      
      // Basic API key validation
      if (!validateApiKey(newSettings.geminiApiKey)) {
        showStatus('入力されたAPIキーの形式が正しくありません。Google AI Studioから取得したキーを確認してください。', 'error');
        return;
      }
      
      if (!newSettings.voicevoxUrl) {
        showStatus('VOICEVOX サーバーURLを入力してください。通常は「http://localhost:50021」です。', 'error');
        return;
      }
      
      // Save settings
      await saveSettings(newSettings);
      
      // Reset form modified flag
      isFormModified = false;
      form.classList.remove('modified-form');
      
      showStatus('設定を保存しました。変更を反映するにはページを再読み込みしてください。', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('設定の保存に失敗しました。', 'error');
    }
  });
  
  // Reset button click handler
  resetBtn.addEventListener('click', async () => {
    try {
      // Confirm reset
      if (!confirm('設定をデフォルト値にリセットしますか？このアクションは元に戻せません。')) {
        return;
      }
      
      // Reset settings
      await resetSettings();
      
      // Update form
      const defaultSettings = await loadSettings();
      geminiApiKeyInput.value = defaultSettings.geminiApiKey || '';
      voicevoxUrlInput.value = defaultSettings.voicevoxUrl || '';
      zundamonSpeakerIdInput.value = defaultSettings.zundamonSpeakerId || '';
      metanSpeakerIdInput.value = defaultSettings.metanSpeakerId || '';
      
      // Reset form modified flag
      isFormModified = false;
      form.classList.remove('modified-form');
      
      showStatus('設定をデフォルト値にリセットしました。APIキーは必ず別途設定してください。', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatus('設定のリセットに失敗しました。', 'error');
    }
  });
  
  // Warn before leaving page with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (isFormModified) {
      // Standard message (browser will show its own message)
      const message = '変更が保存されていません。このページを離れますか？';
      e.returnValue = message;
      return message;
    }
  });
});

/**
 * Shows a status message
 * @param message Message to show
 * @param type Type of message (success or error)
 */
const showStatus = (message: string, type: 'success' | 'error') => {
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
};

/**
 * Basic validation for API Key format
 * @param apiKey API Key to validate
 * @returns Whether the API key format is valid
 */
const validateApiKey = (apiKey: string): boolean => {
  // Gemini API keys are typically long alphanumeric strings
  // This is a basic check for approximate format (at least 20 chars, alphanumeric)
  const keyRegex = /^[A-Za-z0-9_-]{20,}$/;
  return keyRegex.test(apiKey);
}