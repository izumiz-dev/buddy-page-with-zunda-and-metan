import { useRef, useEffect } from 'preact/hooks';
import { Conversation, ConversationMode } from '../../types';
import ConversationBubble from './components/ConversationBubble'; // Changed to default import
import { exportConversationToMarkdown } from '../../utils/exportConversation'; // Import the export function

interface ConversationUIProps {
  isLoading: boolean;
  conversation: Conversation | null;
  error: { code: string; message: string } | null;
  isPlaying: boolean;
  currentLineIndex: number;
  onPlayPause: () => void;
  onStop: () => void;
  onClose: () => void;
  mode?: ConversationMode;
  enableVoice: boolean; // Add enableVoice prop
  // Add metadata props
  pageTitle: string;
  pageUrl: string;
  generatedAt: Date | null;
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
  mode = ConversationMode.CASUAL,
  enableVoice, // Destructure enableVoice
  // Destructure metadata props
  pageTitle,
  pageUrl,
  generatedAt
}: ConversationUIProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const conversationAreaRef = useRef<HTMLDivElement>(null);

  // Use mode from conversation if available
  const displayMode = conversation?.mode || mode;
  
  // Determine if professional mode is active
  const isProfessional = displayMode === ConversationMode.PROFESSIONAL;

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
  const canExport = !!conversation && !isLoading && !!generatedAt; // Determine if export is possible

  // Dynamic header style based on mode
  const headerStyle = {
    ...styles.header,
    background: isProfessional 
      ? 'linear-gradient(to right, #3949ab, #9c27b0)' // Professional blue-purple gradient
      : 'linear-gradient(to right, #4caf50, #F5A9E1)'  // Original green-pink gradient
  };
  
  // Dynamic loading indicator style based on mode
  const loadingIndicatorStyle = {
    ...styles.loadingIndicator,
    border: isProfessional 
      ? '3px solid rgba(57, 73, 171, 0.3)' 
      : '3px solid rgba(76, 175, 80, 0.3)',
    borderTopColor: isProfessional ? '#3949ab' : '#4caf50'
  };
  
  // Dynamic play button style based on mode
  const playPauseButtonStyle = {
    ...styles.controlButton,
    ...styles.playPauseButton,
    background: isProfessional
      ? 'linear-gradient(to right, #3949ab, #5c6bc0)'
      : 'linear-gradient(to right, #4caf50, #66bb6a)',
    opacity: (!canPlay || isLoading) ? 0.7 : 1,
    cursor: (!canPlay || isLoading) ? 'not-allowed' : 'pointer'
  };

  // Dynamic container style based on mode - adjust width for professional mode
  const containerStyle = {
    ...styles.container,
    width: isProfessional ? '480px' : '320px' // 1.5x width for professional mode
  };

  return (
    <div ref={containerRef} style={containerStyle} class="conversation-container">
      {/* Resize Handle */}
      <div 
        ref={resizeHandleRef} 
        style={{
          ...styles.resizeHandle,
          background: isProfessional
            ? 'linear-gradient(315deg, transparent 50%, #3949ab 50%, #9c27b0 100%)'
            : 'linear-gradient(315deg, transparent 50%, #4caf50 50%, #F5A9E1 100%)'
        }}
      ></div>
      
      {/* Header */}
      <div ref={headerRef} style={headerStyle}>
        <div>
          <span style={{ fontWeight: 'bold', color: '#fff' }}>ずんだもん & 四国めたん</span>
          {isProfessional && (
            <span style={styles.modeIndicator}>プロフェッショナル</span>
          )}
        </div>
        <div style={styles.headerButtons}> {/* Container for header buttons */}
          <button 
            onClick={() => {
              if (canExport && conversation && generatedAt) {
                exportConversationToMarkdown(conversation, pageTitle, pageUrl, generatedAt);
              }
            }} 
            disabled={!canExport} 
            style={{...styles.headerButton, ...styles.exportButton, opacity: canExport ? 1 : 0.5, cursor: canExport ? 'pointer' : 'not-allowed'}}
            title="会話をMarkdown形式でエクスポート" // Tooltip
          >
            保存
          </button>
          <button onClick={onClose} style={{...styles.headerButton, ...styles.closeButton}}>×</button>
        </div>
      </div>

      {/* Conversation Area */}
      <div ref={conversationAreaRef} style={styles.conversationArea}>
        {isLoading && (
            <div style={styles.loadingContainer}>
            <div style={loadingIndicatorStyle}></div>
            {isProfessional ? (
              <>
              プロフェッショナル会話を生成中...
              <br />
              通常モードより時間がかかる場合があります...
              </>
            ) : '会話を生成中...'}
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
            isProfessional={isProfessional}
          />
        ))}
      </div>

      {/* Controls - Conditionally render based on enableVoice */}
      {enableVoice && (
        <div style={styles.controls} class="controls">
          <button 
            onClick={onPlayPause} 
            disabled={!canPlay || isLoading} 
            style={playPauseButtonStyle}
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
      )}
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
    borderRadius: '16px', // Slightly more rounded corners
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)', // Enhanced shadow
    zIndex: '2147483647', // Ensure high z-index
    overflow: 'hidden', // Important for border-radius and children
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Noto Sans JP", "Meiryo", sans-serif',
    border: '1px solid rgba(0, 0, 0, 0.08)', // Subtle border
  } as const, // Use 'as const' for better type inference with CSS properties
  resizeHandle: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize',
    borderBottomRightRadius: '5px', // Slight visual cue
    zIndex: 20, // Above header
  } as const,
  header: {
    padding: '12px 16px', // Slightly more padding
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move',
    flexShrink: 0, // Prevent header from shrinking
    position: 'relative', // Needed for absolute positioning of buttons if required
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Add subtle shadow for depth
  } as const,
  headerButtons: { // Style for the button container
    display: 'flex',
    alignItems: 'center',
  } as const,
  modeIndicator: {
    display: 'inline-block',
    fontSize: '11px',
    padding: '2px 6px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    marginLeft: '8px',
    verticalAlign: 'middle',
    color: 'white',
  } as const,
  headerButton: { // Common style for header buttons
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0 5px',
    marginLeft: '5px', // Space between buttons
    fontSize: '16px', // Adjusted font size for header buttons
    lineHeight: 1,
  } as const,
  exportButton: {
    // Specific styles for export button
    fontSize: '12px', // Smaller font size for chip style
    padding: '2px 8px', // Adjust padding for chip style
    borderRadius: '12px', // Rounded corners for chip style
    background: 'rgba(255, 255, 255, 0.2)', // Subtle background
    marginRight: '8px', // Add some space before the close button
  } as const,
  closeButton: {
    // Specific styles for close button if needed
    fontSize: '22px', // Make close button slightly larger
  } as const,
  conversationArea: {
    flex: 1, // Take remaining space
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f9f9f9',
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: '#ccc transparent', // Firefox
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
    borderRadius: '50%',
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
    padding: '14px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)', // Lighter border color
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
    padding: '10px 15px', // Slightly more padding
    margin: '0 5px',
    fontWeight: 'bold',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    fontSize: '0.92em', // Slightly smaller font
    cursor: 'pointer',
  } as const,
  playPauseButton: {
     background: 'linear-gradient(to right, #4caf50, #66bb6a)',
  } as const,
  stopButton: {
     background: 'linear-gradient(to right, #f44336, #ef5350)',
  } as const,
};

// No need to inject keyframes here anymore as they are handled in shadow DOM
