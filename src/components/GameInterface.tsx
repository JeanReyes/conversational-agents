'use client';

import { GameLoader } from "@/app/components/game-loader";
import { useGame } from "@/app/hooks/useGame";
import { useAgentConversation } from "@/app/hooks/useAgentConversation"; // Importar el nuevo hook
import { GameMessage } from "@/app/components/game-message";
import { GameInput } from "@/app/components/game-input";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { useGameService } from '@/lib/game-context';
import { ServiceType } from "@/lib/types";

// Componente para la interfaz de juego interactiva
function InteractiveGameInterface({ serviceType }: { serviceType: ServiceType }) {
  const { messages, input, isLoading, handleSubmit, handleInputChange, isInputDisabled } = useGame();

  return (
    <div className="flex flex-col h-full">
      <Conversation>
        <ConversationContent className="max-w-xl mx-auto">
          {messages.map((message) => (
            <GameMessage key={message.id} message={message} serviceType={serviceType} />
          ))}
          {isLoading && <GameLoader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="max-w-2xl w-full mx-auto p-4">
        <GameInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isDisabled={isInputDisabled}
        />
      </div>
    </div>
  );
}

// Componente para la conversación simulada de agentes
function AgentConversationInterface({ serviceType }: { serviceType: ServiceType }) {
  const { messages, isLoading, selectedClient } = useAgentConversation('agent-resolutor');

  return (
    <div className="flex flex-col h-full">
      {selectedClient}
      <Conversation>
        <ConversationContent className="max-w-xl mx-auto">
          {messages.map((message) => (
            <GameMessage key={message.id} message={message} serviceType={serviceType} />
          ))}
          {isLoading && <GameLoader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}

export function GameInterface() {
  const { service, serviceType } = useGameService();

  if (!service) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>cargando experiencia de {serviceType}...</p>
        </div>
      </div>
    );
  }

  // Decidir qué interfaz renderizar basado en el serviceType
  if (serviceType === 'agent-resolutor') {
    return <AgentConversationInterface serviceType={serviceType} />;
  } else {
    return <InteractiveGameInterface serviceType={serviceType} />;
  }
}
