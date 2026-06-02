export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  // Metadata for advanced feature items
  isImage?: boolean; // If this message is actually a created image
  imageUrl?: string;
  isAudioPlaying?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  model: string;
  systemInstruction?: string;
  suggestedPrompts?: string[];
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
}

export interface PromptPreset {
  id: string;
  title: string;
  description: string;
  iconName: string;
  prompt: string;
}
