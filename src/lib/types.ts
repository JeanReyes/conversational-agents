export interface GameMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: GeneratedImage;
  imageLoading?: boolean;
  stageInfo?: StageInfo; // ← NUEVO
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
  imagePrompt?: GeneratedImage;
}

// Nuevos tipos para el sistema dinámico
export type ServiceType = 
  | 'game-zombie' 
  | 'business-strategy' 
  | 'agent-resolutor'
  | 'agent-standar'
  | 'client-claim' 
  | 'desperate-client' 
  | 'angry-client' 
  | 'response-tools'
  | 'promocion-no-respetada'
  | 'retraso-entrega'
  | 'pedido-cancelado'
  | 'producto-incorrecto'
  | 'producto-defectuoso'
  | 'dificultad-devolucion'
  | 'reembolso-tardio'
  | 'cobro-indebido'
  | 'problema-garantia'
  | 'mala-atencion';

// NUEVOS TIPOS PARA ETAPAS DE CONVERSACIÓN
export enum ConversationStage {
  OPENING = 'OPENING',
  DEVELOPMENT = 'DEVELOPMENT',
  CLOSING = 'CLOSING'
}

export interface StageInfo {
  stage: ConversationStage;
  turnNumber: number;
  isResolved: boolean;
  noResponse?: boolean;  // ← NUEVO: Indica si el cliente no respondió
}

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
  prompts?: {
    INITIAL_STORY: string;
    CONTINUE_STORY: (historyText: string, userMessage: string, toolResultsContext?: string) => string;
    GENERATE_IMAGE?: (description: string) => string;
  };
  type: ServiceType;
}

// NUEVOS TIPOS PARA FEATURE NO-RESPONSE
export interface NoResponseConfig {
  enabled: boolean;
  probability: number;
  minTurnsBeforeApply: number;
  timeoutDuration: number;
  maxTurnsToApply?: number;
}

export const DEFAULT_NO_RESPONSE_CONFIG: NoResponseConfig = {
  enabled: true,
  probability: 0.10,        // 20% de probabilidad
  minTurnsBeforeApply: 3,   // Solo después del turno 3
  timeoutDuration: 2000,    // 2 segundos
  maxTurnsToApply: 10,      // Opcional: no aplicar después del turno 10
};

// TIPOS PARA DATASET EXPORT
export type ResolutionStatus = 'resuelto' | 'no_response' | 'max_turns';

export interface DatasetTurn {
  turn_id: number;
  role: 'cliente' | 'agente';
  timestamp: string;
  content: string;
  action?: string | null;
}

export interface DatasetMetadata {
  topic?: string | null;
  intent?: string | null;
  sentiment_trend?: string | null;
}

export interface DatasetConversation {
  conversation_id: string;
  service_type: string;
  finished_at: string;
  resolution_status: ResolutionStatus;
  metadata: DatasetMetadata;
  turns: DatasetTurn[];
}