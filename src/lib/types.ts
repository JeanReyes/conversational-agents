export interface GameMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: GeneratedImage;
  imageLoading?: boolean;
}

export interface GeneratedImage {
  base64Data: string;
  mediaType: string;
  uint8ArrayData?: Uint8Array;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateImageRequest {
  imagePrompt: string;
}

export interface GenerateStoryRequest {
  userMessage: string;
  conversationHistory: ConversationMessage[];
  isStart: boolean;
  serviceType?: ServiceType;
}

export interface GenerateStoryResponse {
  narrative: string;
  imagePrompt: GeneratedImage;
}

// Nuevos tipos para el sistema dinámico
export type ServiceType = 'game-zombie' | 'business-strategy' | 'agent-resolutor' | 'client-claim' | 'desperate-client' | 'angry-client';

export interface GameService {
  constants: {
    LOADING: Record<string, string>;
    ERROR: Record<string, string>;
    PLACEHOLDER: Record<string, string>;
    BUTTONS?: Record<string, string>;
  };
  config: {
    IMAGE: {
      DEFAULT_PROMPT: string;
      SEPARATOR: string;
    };
  };
  prompts: {
    INITIAL_STORY: string;
    CONTINUE_STORY: (historyText: string, userMessage: string) => string;
    GENERATE_IMAGE: (description: string) => string;
  };
  type: ServiceType;
}