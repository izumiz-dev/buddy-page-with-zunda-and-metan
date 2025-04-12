import { h, Fragment } from 'preact';
import { useRef, useEffect, useState, useCallback } from 'preact/hooks';
import { Conversation, ConversationLine, Character } from '../../types';
import ConversationBubble from './components/ConversationBubble'; // Changed to default import

interface ConversationUIProps {
  isLoading: boolean;
  conversation: Conversation | null;
  error: { code: string; message: string } | null;
  isPlaying: boolean;
  currentLineIndex: number;
  onPlayPause: () => void;
  onStop: () => void;
  onClose: () => void;
}

export function ConversationUI({
  isLoading,
  conversation,
  error,
  isPlaying,
  currentLineIndex,
  onPlayPause,
  onStop,
  onClose,
}: ConversationUIProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const conversationAreaRef = useRef<HTMLDivElement>(null);

  // --- Draggable Logic ---
  useEffect(() => {
    const element = containerRef.current;
    const handle = headerRef.current;
    if (!element || !handle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e: MouseEvent) => {
      // Prevent drag on close button if it exists within the handle
      if ((e.target as HTMLElement).closest('button')) return; 
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    const elementDrag = (e: MouseEvent) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;
      
      // Keep within viewport bounds
      const rect = element.getBoundingClientRect();
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;

      element.style.top = Math.max(0, Math.min(newTop, parentHeight - rect.height)) + "px";
      element.style.left = Math.max(0, Math.min(newLeft, parentWidth - rect.width)) + "px";
    };

    const closeDragElement = () => {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };

    handle.addEventListener('mousedown', dragMouseDown);

    return () => {
      handle.removeEventListener('mousedown', dragMouseDown);
      // Clean up global listeners if component unmounts during drag
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };
  }, []); // Run only once on mount

  // --- Resizable Logic ---
  useEffect(() => {
    const element = containerRef.current;
    const handle = resizeHandleRef.current;
    if (!element || !handle) return;

    const minWidth = 320;
    const minHeight = 400;
    let startX: number, startY: number, startWidth: number, startHeight: number;
    let startLeft: number, startTop: number;

    const initResize = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
      document.documentElement.addEventListener('mousemove', doResize, false);
      document.documentElement.addEventListener('mouseup', stopResize, false);
    };

    const doResize = (e: MouseEvent) => {
      e.preventDefault();
      const dx = startX - e.clientX; // Inverted for top-left handle
      const dy = startY - e.clientY; // Inverted for top-left handle
      const newWidth = Math.max(minWidth, startWidth + dx);
      const newHeight = Math.max(minHeight, startHeight + dy);
      const newLeft = startLeft - (newWidth - startWidth);
      const newTop = startTop - (newHeight - startHeight);

      // Keep within bounds
      element.style.width = newWidth + 'px';
      element.style.height = newHeight + 'px';
      element.style.left = Math.max(0, newLeft) + 'px';
      element.style.top = Math.max(0, newTop) + 'px';
    };

    const stopResize = () => {
      document.documentElement.removeEventListener('mousemove', doResize, false);
      document.documentElement.removeEventListener('mouseup', stopResize, false);
    };

    handle.addEventListener('mousedown', initResize, false);

    return () => {
      handle.removeEventListener('mousedown', initResize, false);
      document.documentElement.removeEventListener('mousemove', doResize, false);
      document.documentElement.removeEventListener('mouseup', stopResize, false);
    };
  }, []); // Run only once on mount

  // --- Scroll to active line ---
  useEffect(() => {
      if (isPlaying && conversationAreaRef.current) {
          // Correct selector for the active bubble
          const activeElement = conversationAreaRef.current.querySelector(`.conversation-bubble.active-bubble`); 
          if (activeElement) {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Changed to 'start'
          }
      }
  }, [currentLineIndex, isPlaying]); // Depend on index and playing state

  // Determine if play button should be enabled
  const canPlay = !!conversation && conversation.lines.some(line => line.audioUrl);

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Resize Handle */}
      <div ref={resizeHandleRef} style={styles.resizeHandle}></div>
      
      {/* Header */}
      <div ref={headerRef} style={styles.header}>
        <span style={{ fontWeight: 'bold' }}>ずんだもん & 四国めたん</span>
        <button onClick={onClose} style={styles.closeButton}>×</button>
      </div>

      {/* Conversation Area */}
      <div ref={conversationAreaRef} style={styles.conversationArea}>
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingIndicator}></div>
            会話を生成中...
          </div>
        )}
        {error && (
          <div style={styles.errorContainer}>
            エラー: {error.message}
          </div>
        )}
        {!isLoading && !error && conversation && conversation.lines.map((line, index) => (
          <ConversationBubble
            key={index} // Important for Preact list rendering
            character={line.character}
            text={line.text}
            isActive={isPlaying && index === currentLineIndex}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button 
          onClick={onPlayPause} 
          disabled={!canPlay || isLoading} 
          style={{...styles.controlButton, ...styles.playPauseButton, opacity: (!canPlay || isLoading) ? 0.7 : 1, cursor: (!canPlay || isLoading) ? 'not-allowed' : 'pointer'}}
        >
          {isPlaying ? '⏸ 一時停止' : '🔊 再生'}
        </button>
        <button 
          onClick={onStop} 
          disabled={!isPlaying && currentLineIndex === 0} // Disable if not playing and at start
          style={{...styles.controlButton, ...styles.stopButton, opacity: (!isPlaying && currentLineIndex === 0) ? 0.7 : 1, cursor: (!isPlaying && currentLineIndex === 0) ? 'not-allowed' : 'pointer'}}
        >
          ⏹ 停止
        </button>
      </div>
    </div>
  );
}


// --- Styles --- (Consider moving to a separate CSS file/module later)
const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '320px', // Initial width
    height: '500px', // Initial height
    minWidth: '320px',
    minHeight: '400px',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
    zIndex: '2147483647', // Ensure high z-index
    overflow: 'hidden', // Important for border-radius and children
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Noto Sans JP", "Meiryo", sans-serif',
  } as const, // Use 'as const' for better type inference with CSS properties
  resizeHandle: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize',
    background: 'linear-gradient(315deg, transparent 50%, #4caf50 50%, #F5A9E1 100%)',
    borderBottomRightRadius: '5px', // Slight visual cue
    zIndex: 20, // Above header
  } as const,
  header: {
    padding: '10px 15px', // Adjusted padding
    background: 'linear-gradient(to right, #4caf50, #F5A9E1)',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move',
    flexShrink: 0, // Prevent header from shrinking
  } as const,
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 5px', // Add some padding for easier clicking
    lineHeight: 1,
  } as const,
  conversationArea: {
    flex: 1, // Take remaining space
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f9f9f9',
  } as const,
  loadingContainer: {
    padding: '10px',
    textAlign: 'center',
    color: '#666',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Center vertically
  } as const,
  loadingIndicator: {
    width: '40px',
    height: '40px',
    margin: '15px auto',
    border: '3px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#4caf50',
    animation: 'spin 1s ease-in-out infinite',
  } as const,
  errorContainer: {
    padding: '10px',
    textAlign: 'center',
    color: '#f44336',
    flex: 1, // Center vertically
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  controls: {
    padding: '12px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    flexShrink: 0, // Prevent controls from shrinking
  } as const,
  controlButton: {
    flex: 1,
    maxWidth: '45%',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 15px',
    margin: '0 5px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'opacity 0.3s ease, background-color 0.3s ease', // Added transition
  } as const,
  playPauseButton: {
     background: 'linear-gradient(to right, #4caf50, #66bb6a)',
  } as const,
  stopButton: {
     background: 'linear-gradient(to right, #f44336, #ef5350)',
  } as const,
};

// Inject keyframes for spinner (if not already present)
// This is a bit hacky, ideally use CSS modules or styled-components
(() => {
  const styleId = 'zunda-metan-keyframes';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
  }
})();
