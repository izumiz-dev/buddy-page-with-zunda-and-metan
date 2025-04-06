// Character types
export enum Character {
  ZUNDAMON = 'zundamon',
  METAN = 'metan'
}

// Settings type
export interface Settings {
  geminiApiKey: string;
  voicevoxUrl: string;
  zundamonSpeakerId: string;
  metanSpeakerId: string;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  voicevoxUrl: 'http://localhost:50021',
  zundamonSpeakerId: '3',
  metanSpeakerId: '2'
};

// Message types for communication between background and content scripts
export interface Message {
  type: MessageType;
  payload?: any;
}

export enum MessageType {
  START_CONVERSATION = 'START_CONVERSATION',
  GENERATED_CONVERSATION = 'GENERATED_CONVERSATION',
  SYNTHESIZE_SPEECH = 'SYNTHESIZE_SPEECH',
  SPEECH_SYNTHESIZED = 'SPEECH_SYNTHESIZED',
  ERROR = 'ERROR'
}

// Conversation data types
export interface ConversationLine {
  character: Character;
  text: string;
  audioUrl?: string;
}

export interface Conversation {
  lines: ConversationLine[];
}

// Error types
export interface ErrorMessage {
  code: string;
  message: string;
}

// VOICEVOX API types
export interface VoicevoxAudioQuery {
  accent_phrases: any[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}