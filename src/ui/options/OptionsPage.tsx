import { h, Fragment } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { loadSettings, saveSettings, resetSettings } from '../../utils/storage';
import { Settings, DEFAULT_SETTINGS } from '../../types';

export function OptionsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load settings on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setStatus('設定の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = useCallback((event: Event) => {
    const target = event.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSave = useCallback(async (event: Event) => {
    event.preventDefault();
    setStatus('保存中...');
    try {
      await saveSettings(settings);
      setStatus('設定を保存しました！');
      setTimeout(() => setStatus(''), 3000); // Clear status after 3 seconds
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus('設定の保存に失敗しました。');
    }
  }, [settings]);

  const handleReset = useCallback(async () => {
    if (confirm('本当に設定をリセットしますか？')) {
      setStatus('リセット中...');
      try {
        await resetSettings();
        setSettings({ ...DEFAULT_SETTINGS }); // Update state to defaults
        setStatus('設定をリセットしました。');
        setTimeout(() => setStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset settings:', error);
        setStatus('設定のリセットに失敗しました。');
      }
    }
  }, []);

  if (isLoading) {
    return <div>設定を読み込み中...</div>;
  }

  // Apply max-width and centering to the main container
  const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px' // Keep padding from original body style
  };

  return (
    <div style={containerStyle}>
      <h1>設定</h1>
      <form onSubmit={handleSave}>
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>API設定</legend>
          <div style={styles.formGroup}>
            <label htmlFor="geminiApiKey" style={styles.label}>
              Gemini API キー:
            </label>
            <input
              type="password" // Use password type for sensitive keys
              id="geminiApiKey"
              name="geminiApiKey"
              value={settings.geminiApiKey || ''}
              onInput={handleInputChange}
              style={styles.input}
              placeholder="Gemini API キーを入力"
              required
            />
            <small style={styles.smallText}>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                APIキーはこちらで取得できます
              </a>
            </small>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="voicevoxUrl" style={styles.label}>
              VOICEVOX URL:
            </label>
            <input
              type="url"
              id="voicevoxUrl"
              name="voicevoxUrl"
              value={settings.voicevoxUrl || ''}
              onInput={handleInputChange}
              style={styles.input}
              placeholder="例: http://localhost:50021"
            />
             <small style={styles.smallText}>
              ローカルでVOICEVOXを実行している場合、そのURLを指定します。空の場合は音声合成が無効になります。
            </small>
          </div>
        </fieldset>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>キャラクター設定</legend>
          <div style={styles.formGroup}>
            <label htmlFor="zundamonSpeakerId" style={styles.label}>
              ずんだもん話者ID:
            </label>
            <input
              type="text" // Changed to text as it might not be a number
              id="zundamonSpeakerId"
              name="zundamonSpeakerId"
              value={settings.zundamonSpeakerId}
              onInput={handleInputChange}
              style={styles.input}
              required
            />
             <small style={styles.smallText}>
              VOICEVOXエディタで確認できる話者ID (例: 3)
            </small>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="metanSpeakerId" style={styles.label}>
              四国めたん話者ID:
            </label>
            <input
              type="text" // Changed to text as it might not be a number
              id="metanSpeakerId"
              name="metanSpeakerId"
              value={settings.metanSpeakerId}
              onInput={handleInputChange}
              style={styles.input}
              required
            />
             <small style={styles.smallText}>
              VOICEVOXエディタで確認できる話者ID (例: 2)
            </small>
          </div>
        </fieldset>

        {/* Add General Settings Fieldset */}
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>一般設定</legend>
          <div style={styles.formGroup}>
            <label htmlFor="enableVoice" style={{...styles.label, display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="checkbox"
                id="enableVoice"
                name="enableVoice"
                checked={settings.enableVoice}
                onChange={handleInputChange} // Use onChange for checkboxes in Preact
                style={{ width: 'auto', marginRight: '5px' }} // Adjust style for checkbox
              />
              音声読み上げを有効にする
            </label>
            <small style={styles.smallText}>
              チェックを外すと、会話の自動音声読み上げが無効になります。
            </small>
          </div>
        </fieldset>

        <div style={styles.buttonGroup}>
          <button type="submit" style={{...styles.button, ...styles.saveButton}}>
            保存
          </button>
          <button type="button" onClick={handleReset} style={{...styles.button, ...styles.resetButton}}>
            リセット
          </button>
        </div>
      </form>
      {status && <p style={styles.statusMessage}>{status}</p>}

      {/* Credits Section */}
      <hr style={styles.hr} />
      <div style={styles.creditsContainer}>
        <h4 style={styles.creditsHeader}>クレジット</h4>
        <p>本拡張機能では以下のキャラクターボイスを使用しています：</p>
        <ul style={styles.creditsList}>
          <li>ずんだもん by VOICEVOX</li>
          <li>四国めたん by VOICEVOX</li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          音声合成エンジン: <a href="https://voicevox.hiroshiba.jp/" target="_blank" rel="noopener noreferrer">VOICEVOX</a>
        </p>
      </div>
    </div>
  );
}

// Basic inline styles (consider moving to CSS file later)
const styles = {
  fieldset: {
    border: '1px solid #ccc',
    borderRadius: '5px',
    marginBottom: '20px',
    padding: '15px',
  },
  legend: {
    fontWeight: 'bold',
    padding: '0 10px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: 'calc(100% - 22px)', // Adjust for padding/border
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '3px',
  },
  smallText: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  buttonGroup: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  resetButton: {
    backgroundColor: '#f44336',
  },
  statusMessage: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    textAlign: 'center',
  },
  // Added styles for credits
  hr: {
    margin: '30px 0',
    border: 0,
    borderTop: '1px solid #eee',
  },
  creditsContainer: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#666',
  },
  creditsHeader: {
    marginBottom: '10px',
    fontSize: '14px', // Slightly larger for header
    fontWeight: 'bold',
  },
  creditsList: {
    marginTop: '5px',
    paddingLeft: '20px', // Indent list
  }
};
