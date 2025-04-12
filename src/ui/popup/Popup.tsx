import { h, Fragment } from 'preact';
import { useState, useCallback } from 'preact/hooks';

import { Settings } from '../../types'; // Assuming Settings type might be useful later, or remove if not

// Helper function to open the options page
const openOptionsPage = () => {
  chrome.runtime.openOptionsPage();
};

export function Popup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null); // Added for status messages

  const handleStartConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'startConversation' });
        console.log('Popup received response from content script:', response);
        // Assuming content script sends back { status: 'processing' } on success
        if (response?.status === 'processing') {
          setStatus('会話の準備を開始しました！');
          // Optionally close the popup after starting
          window.close(); 
        } else {
          // Handle cases where content script might return other statuses or fail
          setError(response?.message || 'コンテンツスクリプトの起動に失敗しました。ページをリロードしてみてください。');
          setStatus(null);
        }
      } else {
        setStatus(null);
        setError('アクティブなタブが見つかりません。');
      }
    } catch (err) {
      console.error('Error sending startConversation message:', err);
      // Check if the error indicates the content script isn't ready
      if (err instanceof Error && err.message.includes('Receiving end does not exist')) {
        setError('ページの読み込みが完了していないか、拡張機能が有効になっていません。ページをリロードするか、拡張機能の設定を確認してください。');
      } else {
        setError(`エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
      }
      setStatus(null); // Clear status on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Styles mimicking the old CSS
  const styles = {
    body: {
      width: '320px',
      padding: '15px',
      fontFamily: '"Rounded Mplus 1c", "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif',
      backgroundColor: '#f9f9f9',
      boxSizing: 'border-box' as const, // Ensure padding is included in width
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      backgroundColor: '#e8f5e9',
      padding: '12px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center' as const,
    },
    h1: {
      fontSize: '17px',
      margin: 0,
      fontWeight: 'bold',
      color: '#333',
      lineHeight: 1.4,
    },
    btn: {
      width: '100%',
      padding: '12px',
      backgroundColor: isLoading ? '#ccc' : '#66bb6a', // Adjusted for loading state
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      cursor: isLoading ? 'wait' : 'pointer',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      opacity: isLoading ? 0.7 : 1,
    },
    // Hover effect would ideally be done with CSS classes, but inline for now
    // btnHover: { backgroundColor: '#4caf50', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
    settingsLink: {
      display: 'block',
      textAlign: 'center' as const,
      marginTop: '15px',
      color: '#666',
      fontSize: '12px',
      textDecoration: 'none',
      cursor: 'pointer',
    },
    // settingsLinkHover: { textDecoration: 'underline' },
    status: {
      marginTop: '10px',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      textAlign: 'center' as const,
    },
    error: {
      backgroundColor: '#ffebee',
      color: '#c62828',
    },
    success: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
    },
    footer: {
      marginTop: '15px',
      fontSize: '10px',
      color: '#888',
      textAlign: 'center' as const,
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h1 style={styles.h1}>ずんだもんと四国めたんに<br />ページの内容をおはなししてもらう！</h1>
      </div>

      <button
        onClick={handleStartConversation}
        disabled={isLoading}
        style={styles.btn}
        // Basic hover effect using inline JS (less ideal than CSS)
        onMouseOver={(e) => { if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#4caf50'; }}
        onMouseOut={(e) => { if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#66bb6a'; }}
      >
        {isLoading ? '処理中...' : 'お話を用意してもらう'}
      </button>

      {/* Status/Error Display */}
      {error && <div style={{...styles.status, ...styles.error}}>{error}</div>}
      {status && <div style={{...styles.status, ...styles.success}}>{status}</div>}

      <a 
        onClick={openOptionsPage} 
        style={styles.settingsLink}
        onMouseOver={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
        onMouseOut={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
      >
        設定と本拡張機能について
      </a>

      <div style={styles.footer}>
        Powered by VOICEVOX:ずんだもん・四国めたん
      </div>
    </div>
  );
}
