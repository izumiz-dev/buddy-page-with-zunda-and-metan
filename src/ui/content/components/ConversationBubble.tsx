import { h } from 'preact';
import { Character } from '../../../types'; // Corrected import path

interface ConversationBubbleProps {
  character: Character;
  text: string;
  isActive?: boolean;
}

const ConversationBubble = ({ character, text, isActive = false }: ConversationBubbleProps) => {
  const isZundamon = character === Character.ZUNDAMON;
  const characterName = isZundamon ? 'ずんだもん' : '四国めたん';
  const bubbleColor = isZundamon ? '#A2E884' : '#F5A9E1'; // Corrected Metan's color
  const activeClass = isActive ? 'active-bubble' : '';
  
  const containerStyle = {
    display: 'flex',
    justifyContent: isZundamon ? 'flex-start' : 'flex-end',
    marginBottom: '10px',
    width: '100%'
  };
  
  const bubbleStyle = {
    maxWidth: '80%',
    padding: '10px',
    borderRadius: '10px',
    backgroundColor: bubbleColor,
    color: '#333',
    boxShadow: isActive ? '0 0 8px rgba(0, 0, 0, 0.3)' : 'none',
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.2s ease'
  };
  
  const nameStyle = {
    fontWeight: 'bold',
    marginBottom: '5px'
  };
  
  return (
    <div style={containerStyle} class={`conversation-bubble ${activeClass}`}>
      <div style={bubbleStyle}>
        <div style={nameStyle}>{characterName}</div>
        <div>{text}</div>
      </div>
    </div>
  );
};

export default ConversationBubble;
