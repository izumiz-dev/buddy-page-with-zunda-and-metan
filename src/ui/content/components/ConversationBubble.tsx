import { Character } from '../../../types'; // Corrected import path

interface ConversationBubbleProps {
  character: Character;
  text: string;
  isActive?: boolean;
  isProfessional?: boolean;
}

const ConversationBubble = ({ character, text, isActive = false, isProfessional = false }: ConversationBubbleProps) => {
  const isZundamon = character === Character.ZUNDAMON;
  const characterName = isZundamon ? 'ずんだもん' : '四国めたん';
  
  // Define colors based on mode
  const casualColors = {
    zundamon: '#A2E884', // Green
    metan: '#F5A9E1'     // Pink
  };
  
  const professionalColors = {
    zundamon: '#90CAF9', // Light blue
    metan: '#CE93D8'     // Light purple
  };
  
  // Select appropriate color scheme
  const colors = isProfessional ? professionalColors : casualColors;
  
  // Set bubble color based on character and mode
  const bubbleColor = isZundamon ? colors.zundamon : colors.metan;
  
  const activeClass = isActive ? 'active-bubble' : '';
  const modeClass = isProfessional ? 'professional-bubble' : 'casual-bubble';

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
    transition: 'all 0.2s ease',
    fontSize: isProfessional ? '0.95em' : '1em',
    lineHeight: isProfessional ? '1.5' : '1.4',
    borderLeft: isProfessional && isZundamon ? '3px solid #3949AB' : 'none',
    borderRight: isProfessional && !isZundamon ? '3px solid #9C27B0' : 'none'
  };

  const nameStyle = {
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const modeIndicatorStyle = {
    fontSize: '0.7em',
    opacity: 0.7,
    fontStyle: 'italic'
  };

  return (
    <div style={containerStyle} class={`conversation-bubble ${activeClass} ${modeClass}`}>
      <div style={bubbleStyle}>
        <div style={nameStyle}>
          <span>{characterName}</span>
          {isProfessional && (
            <span style={modeIndicatorStyle}>Pro</span>
          )}
        </div>
        <div>{text}</div>
      </div>
    </div>
  );
};

export default ConversationBubble;
