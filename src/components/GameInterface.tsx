'use client';

import { GameLoader } from "@/app/components/game-loader";
import { useGame } from "@/app/hooks/useGame";
import { useAgentConversation } from "@/app/hooks/useAgentConversation"; // Importar el nuevo hook
import { GameMessage } from "@/app/components/game-message";
import { GameInput } from "@/app/components/game-input";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { useGameService } from '@/lib/providers/game-context';
import { ServiceType } from "@/lib/types";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

  const CLIENT_TYPES: {
    value: ServiceType;
    label: string;
    description: string;
  }[] = [
    {
      value: "client-claim",
      label: "Cliente Normal",
      description: "Presenta un problema de manera calmada",
    },
    {
      value: "desperate-client",
      label: "Cliente Desesperado",
      description: "Tiene urgencia y necesita ayuda inmediata",
    },
    {
      value: "angry-client",
      label: "Cliente Enojado",
      description: "Está frustrado y puede ser confrontativo",
    },
    {
      value: "promocion-no-respetada",
      label: "Promoción No Respetada",
      description: "Código de descuento no funcionó",
    },
    {
      value: "retraso-entrega",
      label: "Retraso en Entrega",
      description: "Pedido lleva más de 15 días sin llegar",
    },
    {
      value: "pedido-cancelado",
      label: "Pedido Cancelado",
      description: "Orden cancelada por falta de stock",
    },
    {
      value: "producto-incorrecto",
      label: "Producto Incorrecto",
      description: "Recibió producto diferente al ordenado",
    },
    {
      value: "producto-defectuoso",
      label: "Producto Defectuoso",
      description: "Producto llegó dañado o con fallas",
    },
    {
      value: "dificultad-devolucion",
      label: "Dificultad Devolución",
      description: "Problemas para devolver producto",
    },
    {
      value: "reembolso-tardio",
      label: "Reembolso Tardío",
      description: "Lleva semanas esperando reembolso",
    },
    {
      value: "cobro-indebido",
      label: "Cobro Indebido",
      description: "Cargo duplicado o incorrecto",
    },
    {
      value: "problema-garantia",
      label: "Problema Garantía",
      description: "Tienda no respeta garantía legal",
    },
    {
      value: "mala-atencion",
      label: "Mala Atención",
      description: "Frustrado por mala atención repetida",
    },
  ];

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
          mode={'custom'}
        />
      </div>
    </div>
  );
}

// Componente para la conversación simulada de agentes
function AgentConversationInterface({
  serviceType,
  clientType,
}: {
  serviceType: ServiceType;
  clientType: ServiceType | null;
}) {
  const [mode, setMode] = useState<"automatic" | "custom">("custom");
  const {
    messages,
    isLoading,
    selectedClient,
    isInputDisabled,
    setSelectedClient,
    resetConversation,
    waitingForNoResponse,
    input,
    handleInputChange,
    handleSubmit,
  } = useAgentConversation(
    serviceType === "agent-standar" ? "agent-standar" : "agent-resolutor",
    undefined,
    serviceType === 'agent-resolutor' ? mode : 'custom' // agent-standar siempre usa modo custom
  );

  // Determinar si se debe mostrar configuración (solo para agent-resolutor)
  const showConfiguration = serviceType === "agent-resolutor";

  useEffect(() => {
    if (clientType) {
      setSelectedClient(clientType);
    }
  }, [clientType, setSelectedClient]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Panel de Configuración - Solo para agent-resolutor */}
      {showConfiguration && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Configuración
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configura el tipo de cliente y modo de conversación
            </p>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {/* Selección de Cliente */}
            <div>
              <label
                htmlFor="client-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
              >
                Tipo de Cliente
              </label>
              <select
                id="client-select"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedClient || ""}
                onChange={(e) => {
                  const clientType = e.target.value as ServiceType;
                  if (clientType) {
                    console.log(`Cliente seleccionado: ${clientType}`);
                    setSelectedClient(clientType);
                  }
                }}
              >
                <option value="" disabled>
                  Selecciona un tipo de cliente...
                </option>
                {CLIENT_TYPES.map((client) => (
                  <option key={client.value} value={client.value}>
                    {client.label}
                  </option>
                ))}
              </select>

              {selectedClient && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {
                      CLIENT_TYPES.find((c) => c.value === selectedClient)
                        ?.label
                    }
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {
                      CLIENT_TYPES.find((c) => c.value === selectedClient)
                        ?.description
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Selección de Modo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Modo de Conversación
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMode("automatic");
                    resetConversation(); // Resetear al cambiar modo
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === "automatic"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  🤖 Automático
                </button>
                <button
                  onClick={() => {
                    setMode("custom");
                    resetConversation(); // Resetear al cambiar modo
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === "custom"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  ✍️ Personalizado
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {mode === "automatic"
                  ? "Conversación automática entre IA y cliente"
                  : "Tú escribes como cliente, IA responde como agente"}
              </p>
            </div>

            {/* Información de Estado */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                <p>
                  <strong>Estado:</strong>{" "}
                  {isLoading ? "Procesando..." : "Listo"}
                </p>
                <p>
                  <strong>Mensajes:</strong> {messages.length}
                </p>
                {waitingForNoResponse && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    ⏳ Esperando respuesta del cliente...
                  </p>
                )}
              </div>

              {/* Botón de Nueva Conversación */}
              {selectedClient && messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  className="w-full"
                >
                  🔄 Nueva Conversación
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel de Chat - Lado Derecho */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header del Chat */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {serviceType === "agent-standar"
                  ? "Asistente AI"
                  : "Conversación"}
              </h3>
              {selectedClient && showConfiguration && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {CLIENT_TYPES.find((c) => c.value === selectedClient)?.label}{" "}
                  • Modo {mode === "automatic" ? "Automático" : "Personalizado"}
                </p>
              )}
              {serviceType === "agent-standar" && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Asistente versátil con herramientas locales y MCP
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selectedClient && showConfiguration ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Selecciona un cliente
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Elige un tipo de cliente en el panel izquierdo para comenzar
                  la conversación
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Banner cuando está esperando no-respuesta */}
              {waitingForNoResponse && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 text-sm text-center border-b border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                  <span className="text-yellow-800 dark:text-yellow-200">
                    ⏳ Cliente no responde... cerrando conversación
                    profesionalmente
                  </span>
                </div>
              )}

              {/* Área de Chat con Scroll */}
              <div className="flex-1 min-h-0">
                <Conversation className="h-full">
                  <ConversationContent className="max-w-4xl mx-auto">
                    {messages.map((message) => (
                      <GameMessage
                        key={message.id}
                        message={message}
                        serviceType={serviceType}
                      />
                    ))}
                    {isLoading && <GameLoader />}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
              </div>

              {/* Input fijo en la parte inferior */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                  <GameInput
                    input={input}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    isDisabled={isInputDisabled}
                    mode={mode}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
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
  if (serviceType === 'agent-resolutor' || serviceType === 'agent-standar') {
    return <AgentConversationInterface serviceType={serviceType} clientType={serviceType === 'agent-standar' ? 'client-claim' : null}/>;
  } else {
    return <InteractiveGameInterface serviceType={serviceType as ServiceType} />;
  }
}
