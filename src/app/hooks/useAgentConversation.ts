import { useCallback, useEffect, useState } from "react";
import { useGameService } from '@/lib/game-context';
import { useSharedConversation } from "@/lib/shared-conversation-context";

import type { GameMessage, GenerateStoryResponse, ServiceType } from "@/lib/types";

const CLIENT_TYPES: ServiceType[] = ['client-claim', 'desperate-client', 'angry-client'];

export function useAgentConversation(initialServiceType: ServiceType) {
  const { service, isLoading: serviceLoading } = useGameService();
  const sharedConversation = useSharedConversation();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTurnService, setCurrentTurnService] = useState<ServiceType>(initialServiceType);
  const [selectedClient, setSelectedClient] = useState<ServiceType | null>(null);

  useEffect(() => {
    const randomClient = CLIENT_TYPES[Math.floor(Math.random() * CLIENT_TYPES.length)];
    setSelectedClient(randomClient);
    console.log(`Random client for this conversation: ${randomClient}`);
  }, []);

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

      const message: GameMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.narrative,
        serviceType: initialServiceType,
      };
      
      setMessages([message]);
      setCurrentTurnService(selectedClient); // Set the next turn to the random client

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [initialServiceType, selectedClient]);

  const continueConversation = useCallback(async (history: GameMessage[]) => {
    const lastMessage = history[history.length - 1];
    if (!lastMessage || isLoading || !selectedClient) return;

    setIsLoading(true);
    console.log('continueConversation with', currentTurnService);
    
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

      const assistantMessage: GameMessage = {
        id: crypto.randomUUID(),
        role: currentTurnService === 'agent-resolutor' ? 'assistant' : "user",
        content: data.narrative,
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Toggle service for the next turn
      setCurrentTurnService(prevService => prevService === 'agent-resolutor' ? selectedClient : 'agent-resolutor');

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentTurnService, selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      startConversation();
    }
  }, [selectedClient, startConversation]);

  useEffect(() => {
    // If there are messages, the conversation isn't finished, and we aren't loading, continue.
    if (messages.length > 0 && messages.length < 8 && !isLoading) {
      const timer = setTimeout(() => {
        continueConversation(messages);
      }, 5000); // Add a delay to simulate thinking
      return () => clearTimeout(timer);
    }
  }, [messages, continueConversation, isLoading]);

  return {
    messages,
    isLoading: isLoading || serviceLoading,
    service,
    selectedClient
  }
}
