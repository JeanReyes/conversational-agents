'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { GameMessage, ServiceType } from './types';

export interface SharedMessage extends GameMessage {
  serviceType: ServiceType;
}

interface SharedConversationContextType {
  sharedMessages: SharedMessage[];
  addSharedMessage: (message: GameMessage, serviceType: ServiceType) => void;
}

const SharedConversationContext = createContext<SharedConversationContextType | null>(null);

export function SharedConversationProvider({ children }: { children: React.ReactNode }) {
  const [sharedMessages, setSharedMessages] = useState<SharedMessage[]>([]);

  const addSharedMessage = useCallback((message: GameMessage, serviceType: ServiceType) => {
    const newMessage: SharedMessage = { ...message, serviceType };
    setSharedMessages(prevMessages => [...prevMessages, newMessage]);
  }, []);

  console.log('sharedMessages', sharedMessages);
  

  return (
    <SharedConversationContext.Provider value={{ sharedMessages, addSharedMessage }}>
      {children}
    </SharedConversationContext.Provider>
  );
}

export const useSharedConversation = () => {
  const context = useContext(SharedConversationContext);
  return context;
};
