import { loadSettings, saveSettings, resetSettings } from './utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('optionsForm') as HTMLFormElement;
  const geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
  const voicevoxUrlInput = document.getElementById('voicevoxUrl') as HTMLInputElement;
  const zundamonSpeakerIdInput = document.getElementById('zundamonSpeakerId') as HTMLInputElement;
  const metanSpeakerIdInput = document.getElementById('metanSpeakerId') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  // Load current settings
  const settings = await loadSettings();
  
  // Fill in form with current settings
  geminiApiKeyInput.value = settings.geminiApiKey;
  voicevoxUrlInput.value = settings.voicevoxUrl;
  zundamonSpeakerIdInput.value = settings.zundamonSpeakerId;
  metanSpeakerIdInput.value = settings.metanSpeakerId;
  
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
      
      if (!newSettings.voicevoxUrl) {
        showStatus('VOICEVOX サーバーURLを入力してください。通常は「http://localhost:50021」です。', 'error');
        return;
      }
      
      // Save settings
      await saveSettings(newSettings);
      
      showStatus('設定を保存しました。変更を反映するにはページを再読み込みしてください。', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('設定の保存に失敗しました。', 'error');
    }
  });
  
  // Reset button click handler
  resetBtn.addEventListener('click', async () => {
    try {
      // Reset settings
      await resetSettings();
      
      // Update form
      const defaultSettings = await loadSettings();
      geminiApiKeyInput.value = defaultSettings.geminiApiKey;
      voicevoxUrlInput.value = defaultSettings.voicevoxUrl;
      zundamonSpeakerIdInput.value = defaultSettings.zundamonSpeakerId;
      metanSpeakerIdInput.value = defaultSettings.metanSpeakerId;
      
      showStatus('設定をデフォルト値にリセットしました。APIキーは必ず別途設定してください。', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatus('設定のリセットに失敗しました。', 'error');
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