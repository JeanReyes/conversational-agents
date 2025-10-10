import { useCallback, useEffect, useState } from "react";
import { useGameService } from '@/lib/game-context';
import { useSharedConversation } from "@/lib/shared-conversation-context";

import type { GameMessage, GenerateStoryResponse } from "@/lib/types";	

export function useGame() {
  const { service, serviceType, isLoading: serviceLoading } = useGameService();
  const sharedConversation = useSharedConversation();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startGame = useCallback(async () => {

    if (!service || !serviceType) return;
    console.log('startGame');
    setIsLoading(true);
    try {
    const response = await fetch("/api/generate-story", {
      method: "POST",
      body: JSON.stringify({
        isStart: true,
        serviceType,
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
        imageLoading: true,
      };
      
      setMessages([message]);
      if (sharedConversation && serviceType) {
        sharedConversation.addSharedMessage(message, serviceType);
      }
      generateImage(message.id, data.imagePrompt);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [serviceType, service, sharedConversation]);


  const generateImage = async (messageId: string, imagePrompt: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: JSON.stringify({
          imagePrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();

      setMessages(prevMessage => prevMessage.map(message => {
        if (message.id === messageId) {
          return {
            ...message,
            image: data.image,
            imageLoading: false,
          }
        } 
        return message;
      }))
    } catch (error) {
      console.error(error);
          setMessages(prevMessage => prevMessage.map(message => {
        if (message.id === messageId) {
          return {
            ...message,
            imageLoading: false,
          }
        } 
        return message;
      }))
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
  
    const userMessage: GameMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    }

    setIsLoading(true);
    setInput("");
    setMessages(prevMessage => [...prevMessage, userMessage]);
    if (sharedConversation && serviceType) {
      sharedConversation.addSharedMessage(userMessage, serviceType);
    }

    try {
      const conversationHistory = sharedConversation 
        ? [...sharedConversation.sharedMessages, userMessage] 
        : [...messages, userMessage];

      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          userMessage: input,
          conversationHistory,
          isStart: false,
          serviceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data = await response.json() as GenerateStoryResponse;

      const messageId = crypto.randomUUID();

      const assistantMessage: GameMessage = {
        id: messageId,
        role: "assistant",
        content: data.narrative,
        imageLoading: true,
      };
      
      setMessages(prevMessage => [...prevMessage, assistantMessage]);
      if (sharedConversation && serviceType) {
        sharedConversation.addSharedMessage(assistantMessage, serviceType);
      }
      generateImage(messageId, data.imagePrompt);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }

  const isInputDisabled = isLoading;

  useEffect(() => {
    startGame();
  }, [serviceType, service, startGame]);

  return {
    messages,
    input,
    isLoading: isLoading || serviceLoading,
    service,
    serviceType,
    handleSubmit,
    startGame,
    handleInputChange,
    isInputDisabled, // Exportar el estado de deshabilitación del input
  }
}