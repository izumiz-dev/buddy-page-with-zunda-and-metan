import { loadConversationPrompt } from './promptLoader';
import { GeminiResponse } from '../types';

/**
 * Service class for interacting with the Google Gemini API
 */
export class GeminiAPI {
  private apiKey: string;
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate conversation between Zundamon and Metan about the provided content
   * @param content The webpage content
   * @returns Generated conversation text
   */
  async generateConversation(content: string): Promise<string> {
    try {
      // Get prompt template
      const promptTemplate = loadConversationPrompt();
      
      // Replace placeholder in prompt with actual content
      const fullPrompt = promptTemplate.replace('{{CONTENT}}', content);
      
      // API endpoint with API key as query parameter
      const requestUrl = `${this.endpoint}?key=${this.apiKey}`;
      
      // API request body
      const requestBody = {
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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