import { VoicevoxAudioQuery } from '../types';

export class VoicevoxAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Creates an audio query for speech synthesis
   * @param text Text to synthesize
   * @param speakerId VOICEVOX speaker ID
   * @returns Audio query object
   */
  async createAudioQuery(text: string, speakerId: string): Promise<VoicevoxAudioQuery> {
    try {
      const params = new URLSearchParams({
        text,
        speaker: speakerId
      });
      
      const response = await fetch(`${this.baseUrl}/audio_query?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`VOICEVOX API Error: ${response.statusText}`);
      }

      return await response.json() as VoicevoxAudioQuery;
    } catch (error) {
      console.error('Error creating audio query:', error);
      throw error;
    }
  }

  /**
   * Synthesizes speech from an audio query
   * @param audioQuery Audio query object
   * @param speakerId VOICEVOX speaker ID
   * @returns Audio blob
   */
  async synthesizeSpeech(audioQuery: VoicevoxAudioQuery, speakerId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/synthesis?speaker=${speakerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/wav'
        },
        body: JSON.stringify(audioQuery)
      });

      if (!response.ok) {
        throw new Error(`VOICEVOX API Error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  /**
   * One-step method to convert text to speech and return data URI
   * @param text Text to synthesize
   * @param speakerId VOICEVOX speaker ID
   * @returns Audio data URI
   */
  async textToSpeechDataUri(text: string, speakerId: string): Promise<string> {
    try {
      const audioQuery = await this.createAudioQuery(text, speakerId);
      const audioBlob = await this.synthesizeSpeech(audioQuery, speakerId);
      
      // Convert blob to base64 data URI
      return await this.blobToDataUri(audioBlob);
    } catch (error) {
      console.error('Error in text to speech (data URI):', error);
      throw error;
    }
  }
  
  /**
   * One-step method to convert text to speech
   * @param text Text to synthesize
   * @param speakerId VOICEVOX speaker ID
   * @returns Audio URL or URI
   */
  async textToSpeech(text: string, speakerId: string): Promise<string> {
    try {
      // Get data URI version since URL.createObjectURL may not be available in service workers
      return await this.textToSpeechDataUri(text, speakerId);
    } catch (error) {
      console.error('Error in text to speech:', error);
      throw error;
    }
  }
  
  /**
   * Converts a Blob to a data URI
   * @param blob The blob to convert
   * @returns Data URI string
   */
  private async blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URI'));
      reader.readAsDataURL(blob);
    });
  }
}