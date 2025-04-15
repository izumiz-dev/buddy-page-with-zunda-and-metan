import { loadConversationPrompt } from './promptLoader';
import { GeminiResponse, ConversationMode, GeminiModel } from '../types';

/**
 * Service class for interacting with the Google Gemini API
 */
export class GeminiAPI {
  private apiKey: string;
  private baseEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get the appropriate endpoint based on conversation mode
   * @param mode Conversation mode
   * @returns API endpoint URL
   */
  private getEndpoint(mode: ConversationMode = ConversationMode.CASUAL): string {
    const model = mode === ConversationMode.PROFESSIONAL 
      ? GeminiModel.GEMINI_PRO 
      : GeminiModel.GEMINI_FLASH;
    
    return `${this.baseEndpoint}/${model}:generateContent`;
  }

  /**
   * Generate conversation between Zundamon and Metan about the provided content
   * @param content The webpage content
   * @param mode Conversation mode (casual or professional)
   * @returns Generated conversation text
   */
  async generateConversation(content: string, mode: ConversationMode = ConversationMode.CASUAL): Promise<string> {
    try {
      // Get prompt template according to mode
      const promptTemplate = loadConversationPrompt(mode);
      
      // Replace placeholder in prompt with actual content
      const fullPrompt = promptTemplate.replace('{{CONTENT}}', content);
      
      // Get appropriate endpoint based on mode
      const endpoint = this.getEndpoint(mode);
      
      // API endpoint with API key as query parameter
      const requestUrl = `${endpoint}?key=${this.apiKey}`;
      
      // Adjust temperature based on mode - lower for professional for more focused responses
      const temperature = mode === ConversationMode.PROFESSIONAL ? 0.3 : 0.7;
      
      // API request body - increase max tokens for professional mode
      const requestBody = {
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: mode === ConversationMode.PROFESSIONAL ? 4096 : 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };
      
      // Make API request
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || 'Unknown error';
        const errorDetails = errorData.error?.details ? JSON.stringify(errorData.error.details) : '';
        throw new Error(`Gemini API Error (${errorData.error?.code || 500}): ${errorMsg}\n${errorDetails}`);
      }
      
      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no results');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating conversation:', error);
      throw error;
    }
  }
}