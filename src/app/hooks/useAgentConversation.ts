import { useCallback, useEffect, useState } from "react";
import { useGameService } from '@/lib/game-context';
import { StageHelper } from '@/lib/config-agents/agent-resolutor/stage-helper';
import { DEFAULT_NO_RESPONSE_CONFIG } from '@/lib/types';  // ← NUEVO

import type { 
  GameMessage, 
  GenerateStoryResponse, 
  ServiceType, 
  StageInfo,
  NoResponseConfig,  // ← NUEVO
  DatasetConversation,
  ResolutionStatus,
  DatasetTurn
} from "@/lib/types";
import { ConversationStage } from "@/lib/types";

export function useAgentConversation(
  initialServiceType: ServiceType,
  noResponseConfig: NoResponseConfig = DEFAULT_NO_RESPONSE_CONFIG,
  mode: 'automatic' | 'custom' = 'automatic'
) {
  const { service, isLoading: serviceLoading } = useGameService();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTurnService, setCurrentTurnService] = useState<ServiceType>(initialServiceType);
  const [selectedClient, setSelectedClient] = useState<ServiceType | null>(null);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);
  const [waitingForNoResponse, setWaitingForNoResponse] = useState<boolean>(false);
  const [datasetSaved, setDatasetSaved] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  /**
   * Decide aleatoriamente si el cliente debe responder o no
   * Retorna true si NO debe responder (simular desconexión)
   */
  const shouldSimulateNoResponse = useCallback((turnNumber: number): boolean => {
    if (!noResponseConfig.enabled) return false;
    
    // No aplicar antes del turno mínimo
    if (turnNumber < noResponseConfig.minTurnsBeforeApply) return false;
    
    // No aplicar después del turno máximo (si está configurado)
    if (noResponseConfig.maxTurnsToApply && turnNumber > noResponseConfig.maxTurnsToApply) {
      return false;
    }
    
    // Random con la probabilidad configurada
    const random = Math.random();
    const shouldNotRespond = random < noResponseConfig.probability;
    
    if (shouldNotRespond) {
      console.log(`🔇 Cliente no responderá (Random: ${random.toFixed(2)} < ${noResponseConfig.probability})`);
    }
    
    return shouldNotRespond;
  }, [noResponseConfig]);

  /**
   * Construye el objeto de conversación para el dataset a partir de los mensajes
   */
  const buildDatasetConversation = useCallback((finalMessages: GameMessage[]): DatasetConversation => {
    // Determinar resolution_status basándose en stageInfo del último mensaje del agente
    let resolutionStatus: ResolutionStatus = 'max_turns';
    
    const lastAgentMessage = [...finalMessages]
      .reverse()
      .find(m => m.role === 'assistant' && m.stageInfo);
    
    if (lastAgentMessage?.stageInfo) {
      if (lastAgentMessage.stageInfo.isResolved) {
        resolutionStatus = 'resuelto';
      } else if (lastAgentMessage.stageInfo.noResponse) {
        resolutionStatus = 'no_response';
      }
    }

    // Construir turns mapeando messages
    const turns: DatasetTurn[] = finalMessages.map((msg, index) => ({
      turn_id: index + 1,
      role: msg.role === 'assistant' ? 'agente' : 'cliente',
      timestamp: new Date().toISOString(), // MVP: usar timestamp actual (mejorar en futuro)
      content: msg.content,
      action: null, // Por ahora null, agregar lógica futura
    }));

    return {
      conversation_id: crypto.randomUUID(),
      service_type: initialServiceType,
      finished_at: new Date().toISOString(),
      resolution_status: resolutionStatus,
      metadata: {
        topic: null,
        intent: null,
        sentiment_trend: null,
      },
      turns,
    };
  }, [initialServiceType]);

  /**
   * Guarda la conversación en el dataset via API
   */
  const saveDataset = useCallback(async (finalMessages: GameMessage[]) => {
    if (datasetSaved) return; // Evitar doble guardado
    
    try {
      const conversation = buildDatasetConversation(finalMessages);
      
      console.log(`💾 Guardando dataset: ${conversation.conversation_id} (${conversation.turns.length} turns, ${conversation.resolution_status})`);
      
      const response = await fetch('/api/save-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: initialServiceType,
          conversation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save dataset: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Dataset guardado:', data);
      setDatasetSaved(true);
    } catch (error) {
      console.error('❌ Error guardando dataset:', error);
      // No bloqueamos la UI, solo logueamos el error
    }
  }, [initialServiceType, buildDatasetConversation, datasetSaved]);

  /**
   * Maneja el caso cuando el cliente no responde
   * Espera un timeout y luego genera la respuesta del agente cerrando la conversación
   */
  const handleNoResponse = useCallback(async (history: GameMessage[]) => {
    console.log(`⏳ Esperando ${noResponseConfig.timeoutDuration}ms antes de cerrar por no-respuesta...`);
    setWaitingForNoResponse(true);
    
    // Esperar el timeout configurado
    await new Promise(resolve => setTimeout(resolve, noResponseConfig.timeoutDuration));
    
    setWaitingForNoResponse(false);
    setIsLoading(true);
    
    try {
      // Generar respuesta del agente indicando que el cliente no respondió
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          userMessage: "[CLIENTE NO RESPONDIÓ - TIMEOUT]",  // Señal especial para el prompt
          conversationHistory: history,
          isStart: false,
          serviceType: initialServiceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate no-response closure");
      }

      const data = await response.json() as GenerateStoryResponse;

      // Procesar respuesta del agente
      const cleanedContent = StageHelper.cleanResponse(data.narrative);
      const lastStageInfo = history[history.length - 1]?.stageInfo;
      const turnNumber = messages.filter(m => m.role === 'assistant').length + 1;
      
      // Crear stageInfo marcado como NO_RESPONSE
      const stageInfo: StageInfo = StageHelper.markAsNoResponse({
        stage: lastStageInfo?.stage || ConversationStage.DEVELOPMENT,
        turnNumber,
        isResolved: false,
        noResponse: false,
      });
      
      console.log('🔇 Conversation closed: NO_RESPONSE');
      console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber, 'NoResponse:', stageInfo.noResponse);
      
      const agentMessage: GameMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: cleanedContent,
        stageInfo,
      };
      
      const updatedMessages = [...messages, agentMessage];
      setMessages(updatedMessages);
      setConversationEnded(true);
      
      // Guardar dataset
      await saveDataset(updatedMessages);

    } catch (error) {
      console.error('Error handling no-response:', error);
      setConversationEnded(true); // Terminar de todos modos
    } finally {
      setIsLoading(false);
    }
  }, [noResponseConfig.timeoutDuration, messages, saveDataset]);

  const startConversation = useCallback(async () => {
    if (!initialServiceType || !selectedClient) return;
    console.log('startConversation with', initialServiceType);
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          isStart: true,
          serviceType: initialServiceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data = await response.json();

      // Procesar stage info
      const cleanedContent = StageHelper.cleanResponse(data.narrative);
      const stageInfo: StageInfo = StageHelper.determineStage(1, data.narrative, false);

      console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber, 'Resolved:', stageInfo.isResolved);

      const message: GameMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanedContent,
        stageInfo,
      };

      setMessages([message]);
      setCurrentTurnService(selectedClient); // Set the next turn to the random client

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [initialServiceType, selectedClient]);

  /**
   * Modo custom: Usuario escribe, agente responde
   * Solo llama al agent, siempre rol 'assistant'
   */
  const continueConversationCustomMode = useCallback(async (history: GameMessage[]) => {
    if (isLoading || conversationEnded) return;

    setIsLoading(true);

    try {
      const lastUserMessage = history[history.length - 1];
      
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          userMessage: lastUserMessage.content,
          conversationHistory: history,
          isStart: false,
          serviceType: initialServiceType, // Siempre agente resolutor
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data = await response.json() as GenerateStoryResponse;

      // Procesar respuesta del agente
      const cleanedContent = StageHelper.cleanResponse(data.narrative);
      const turnNumber = messages.filter(m => m.role === 'assistant').length + 1;
      const previousStage = history[history.length - 1]?.stageInfo;

      const stageInfo = StageHelper.determineStage(
        turnNumber,
        data.narrative,
        previousStage?.stage === 'CLOSING'
      );

      console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber, 'Resolved:', stageInfo.isResolved);

      const assistantMessage: GameMessage = {
        id: crypto.randomUUID(),
        role: 'assistant', // Siempre assistant en modo custom
        content: cleanedContent,
        stageInfo,
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Verificar si debe terminar
      if (StageHelper.shouldEndConversation(stageInfo)) {
        console.log('🎯 Conversation ended!', stageInfo.isResolved ? 'RESOLVED' : 'MAX_TURNS');
        const finalMessages = [...history, assistantMessage];
        setConversationEnded(true);
        setTimeout(() => saveDataset(finalMessages), 100);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationEnded, messages, saveDataset]);

  const continueConversation = useCallback(async (history: GameMessage[]) => {
    const lastMessage = history[history.length - 1];
    if (!lastMessage || isLoading || !selectedClient || conversationEnded) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          userMessage: lastMessage.content,
          conversationHistory: history,
          isStart: false,
          serviceType: currentTurnService,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story for " + currentTurnService);
      }

      const data = await response.json() as GenerateStoryResponse;

      // Procesar stage info solo para agent
      let cleanedContent = data.narrative;
      let stageInfo: StageInfo | undefined;

      if (currentTurnService === initialServiceType) {
        cleanedContent = StageHelper.cleanResponse(data.narrative);
        const turnNumber = messages.filter(m => m.role === 'assistant').length + 1; // Corregir el cálculo del turno
        const previousStage = history[history.length - 1]?.stageInfo;

        stageInfo = StageHelper.determineStage(
          turnNumber,
          data.narrative,
          previousStage?.stage === 'CLOSING'
        );

        console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber, 'Resolved:', stageInfo.isResolved);
      }

      // Crear el mensaje antes de cualquier verificación
      const assistantMessage: GameMessage = {
        id: crypto.randomUUID(),
        role: currentTurnService === initialServiceType ? 'assistant' : "user",
        content: cleanedContent,
        stageInfo,
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Verificar si debe terminar (solo para agent)
      if (currentTurnService === initialServiceType && stageInfo && StageHelper.shouldEndConversation(stageInfo)) {
        console.log('🎯 Conversation ended!', stageInfo.isResolved ? 'RESOLVED' : 'MAX_TURNS');

        // Construir array de mensajes actualizado para guardarlo
        const finalMessages = [...history, assistantMessage];
        setConversationEnded(true);

        // Guardar dataset después de marcar como terminado
        setTimeout(() => saveDataset(finalMessages), 100);
      }

      // Toggle service for the next turn
      setCurrentTurnService(prevService => prevService === initialServiceType ? selectedClient : initialServiceType);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentTurnService, selectedClient, conversationEnded, messages, saveDataset]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: GameMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // En modo custom, siempre llamar al agente resolutor
    await continueConversationCustomMode(updatedMessages);

  }


  useEffect(() => {
    if (selectedClient) {
      startConversation();
    }
  }, [selectedClient, startConversation]);

  useEffect(() => {
    if (mode === 'automatic') {
      if (conversationEnded || waitingForNoResponse) return;
      if (messages.length > 0 && !isLoading) {
        const timer = setTimeout(() => {
          const lastMessage = messages[messages.length - 1];
          const currentTurn = messages.length;
          if (lastMessage.role === 'assistant') {
            if (shouldSimulateNoResponse(currentTurn)) {
              handleNoResponse(messages);
            } else {
              continueConversation(messages);
            }
          } else {
            continueConversation(messages);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    messages, 
    continueConversation, 
    isLoading, 
    conversationEnded, 
    waitingForNoResponse,
    shouldSimulateNoResponse,
    handleNoResponse,
    mode
  ]);

  /**
   * Resetea la conversación completamente
   */
  const resetConversation = useCallback(() => {
    setMessages([]);
    setConversationEnded(false);
    setWaitingForNoResponse(false);
    setDatasetSaved(false);
    setInput('');
    setCurrentTurnService(initialServiceType);
  }, [initialServiceType]);

  /**
   * Cambia el cliente seleccionado y resetea la conversación
   */
  const changeClient = useCallback((newClient: ServiceType | null) => {
    setSelectedClient(newClient);
    resetConversation();
  }, [resetConversation]);

  return {
    messages,
    isLoading: isLoading || serviceLoading || waitingForNoResponse,  // ← MODIFICADO
    service,
    selectedClient,
    conversationEnded,
    input,
    waitingForNoResponse, 
    isInputDisabled: isLoading,
    setSelectedClient: changeClient, // Usar la nueva función que resetea
    resetConversation, // Nueva función exportada
    handleInputChange,
    handleSubmit
    // ← NUEVO: Útil para UI
  }
}
