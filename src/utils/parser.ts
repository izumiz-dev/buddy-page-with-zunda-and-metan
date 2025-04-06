import { Character, Conversation, ConversationLine } from '../types';

/**
 * Parses the generated conversation text into a structured format
 * @param conversationText Raw conversation text from Gemini API (JSON format)
 * @returns Structured conversation object
 */
export const parseConversation = (conversationText: string): Conversation => {
  const conversation: Conversation = {
    lines: []
  };

  try {
    // First, clean any markdown code blocks (```json [..] ```) from the text
    let cleanedText = conversationText;
    // Check for markdown code blocks with json and remove the markdown syntax
    const markdownMatch = conversationText.match(/```(?:json)?([\s\S]*?)```/i);
    if (markdownMatch && markdownMatch[1]) {
      cleanedText = markdownMatch[1].trim();
    }
    
    // Try to extract JSON from the cleaned text
    // Look for JSON array pattern
    const jsonMatch = cleanedText.match(/\[\s*\{.*\}\s*\]/s);
    
    let jsonText = '';
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    } else {
      // If no JSON array found, use the cleaned text as a fallback
      jsonText = cleanedText;
    }
    
    // Parse the JSON
    const parsedLines = JSON.parse(jsonText);
    
    // Convert the parsed JSON to ConversationLine objects
    for (const line of parsedLines) {
      if (line.character && line.text) {
        const characterEnum = line.character.toLowerCase() === 'zundamon' 
          ? Character.ZUNDAMON 
          : Character.METAN;
          
        conversation.lines.push({
          character: characterEnum,
          text: line.text
        });
      }
    }
    
    // Validate that the conversation has content and follows the pattern
    if (conversation.lines.length === 0) {
      throw new Error('Parsed conversation has no valid lines');
    }
    
    // Ensure the conversation starts with Zundamon and ends with Metan
    if (conversation.lines[0].character !== Character.ZUNDAMON) {
      // Add default opening line if needed
      conversation.lines.unshift({
        character: Character.ZUNDAMON,
        text: 'このページについて解説するのだ！'
      });
    }
    
    if (conversation.lines[conversation.lines.length - 1].character !== Character.METAN) {
      // Add default closing line if needed
      conversation.lines.push({
        character: Character.METAN,
        text: 'ページの内容は以上ですね。お役に立てて嬉しいです〜'
      });
    }
  } catch (error) {
    console.error('Error parsing JSON conversation:', error);
    
    // Fallback to text parsing if JSON parsing fails
    return parseTextConversation(conversationText);
  }

  return conversation;
};

/**
 * Fallback parser for non-JSON formatted conversation text
 * @param conversationText Raw conversation text
 * @returns Structured conversation object
 */
const parseTextConversation = (conversationText: string): Conversation => {
  // Split the text into lines
  const textLines = conversationText.split('\n').filter(line => line.trim() !== '');
  
  const conversation: Conversation = {
    lines: []
  };

  let currentLine: ConversationLine | null = null;

  for (const line of textLines) {
    // Check if line starts with character name
    if (line.startsWith('ずんだもん:') || line.startsWith('ずんだもん：')) {
      // If we have a current line, add it to the conversation
      if (currentLine) {
        conversation.lines.push(currentLine);
      }
      
      // Start a new line
      currentLine = {
        character: Character.ZUNDAMON,
        text: line.substring(line.indexOf(':') + 1).trim()
      };
    } else if (line.startsWith('四国めたん:') || line.startsWith('四国めたん：')) {
      // If we have a current line, add it to the conversation
      if (currentLine) {
        conversation.lines.push(currentLine);
      }
      
      // Start a new line
      currentLine = {
        character: Character.METAN,
        text: line.substring(line.indexOf(':') + 1).trim()
      };
    } else if (currentLine) {
      // Append to the current line
      currentLine.text += ' ' + line.trim();
    }
  }

  // Add the last line if it exists
  if (currentLine) {
    conversation.lines.push(currentLine);
  }
  
  // If no valid lines were found, add default conversation
  if (conversation.lines.length === 0) {
    conversation.lines = [
      {
        character: Character.ZUNDAMON,
        text: 'このページの内容を読み取れなかったのだ...ごめんなのだ！'
      },
      {
        character: Character.METAN,
        text: 'すみません、ページの解析に問題があったようです。もう一度試してみてください〜'
      }
    ];
  }

  return conversation;
};