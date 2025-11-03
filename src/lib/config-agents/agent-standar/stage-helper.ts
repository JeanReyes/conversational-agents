import { ConversationStage, StageInfo } from '@/lib/types';

export class StageHelper {
  /**
   * Determina la etapa según el número de turno y el contenido
   */
  static determineStage(
    turnNumber: number,
    agentResponse: string,
    previousWasClosing: boolean
  ): StageInfo {
    // Detectar si el agente marcó como resuelto
    const isResolved = agentResponse.includes('[STATUS: RESOLVED]');
    
    // Determinar etapa
    let stage: ConversationStage;
    
    if (turnNumber === 1) {
      stage = ConversationStage.OPENING;
    } else if (isResolved || previousWasClosing) {
      stage = ConversationStage.CLOSING;
    } else {
      stage = ConversationStage.DEVELOPMENT;
    }
    
    return {
      stage,
      turnNumber,
      isResolved
    };
  }

  /**
   * Actualiza StageInfo para marcar como NO_RESPONSE
   */
  static markAsNoResponse(currentStageInfo: StageInfo): StageInfo {
    return {
      ...currentStageInfo,
      noResponse: true,
      stage: ConversationStage.CLOSING,
      isResolved: false,  // No está resuelto, solo no hubo respuesta
    };
  }

  /**
   * Limpia las señales [STATUS: RESOLVED] y [STATUS: NO_RESPONSE] del mensaje
   */
  static cleanResponse(response: string): string {
    return response
      .replace(/\[STATUS:\s*RESOLVED\]/gi, '')
      .replace(/\[STATUS:\s*NO_RESPONSE\]/gi, '')  // ← NUEVO
      .trim();
  }

  /**
   * Verifica si la conversación debe terminar
   */
  static shouldEndConversation(
    stageInfo: StageInfo,
    maxTurns: number = 12
  ): boolean {
    // Terminar si está marcado como resuelto
    if (stageInfo.isResolved) {
      return true;
    }

    // ← NUEVO: Terminar si no hay respuesta del cliente
    if (stageInfo.noResponse) {
      return true;
    }
    
    // Terminar si llegamos al límite máximo
    if (stageInfo.turnNumber >= maxTurns) {
      return true;
    }
    
    return false;
  }
}
