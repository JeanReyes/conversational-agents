'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { GameService, ServiceType } from '../types';
import { ServiceFactory } from '../service-factory';

interface GameContextType {
  service: GameService | null;
  serviceType: ServiceType | null;
  isLoading: boolean;
  switchService: (type: ServiceType) => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({
  children,
  initialServiceType
}: {
  children: React.ReactNode;
  initialServiceType?: ServiceType;
}) {
  const [service, setService] = useState<GameService | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(initialServiceType || null);
  const [isLoading, setIsLoading] = useState(false);

  const switchService = async (type: ServiceType) => {
    setIsLoading(true);
    try {
      const newService = await ServiceFactory.getService(type);
      setService(newService);
      setServiceType(type);
    } catch (error) {
      console.error('Error switching service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialServiceType) {
      switchService(initialServiceType);
    }
  }, [initialServiceType]);

  return (
    <GameContext.Provider value={{ service, serviceType, isLoading, switchService }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameService = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameService must be used within GameProvider');
  }
  return context;
};
