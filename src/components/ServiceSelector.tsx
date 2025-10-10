'use client';

import { useRouter } from 'next/navigation';
import { ServiceFactory } from '@/lib/service-factory';
import { ServiceType } from '@/lib/types';

export function ServiceSelector() {
  const router = useRouter();
  const availableServices = ServiceFactory.getAvailableServices();

  const handleServiceSelect = (serviceId: ServiceType) => {
    router.push(`/${serviceId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            🗣️ Conversational AI Platform
          </h1>
          <p className="text-xl text-gray-300">
            Select a conversational experience with an expert
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {availableServices.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer transform hover:scale-105 transition-all duration-200 hover:bg-gray-700 border border-gray-600 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-2xl mb-2">
                  {service.id === "game-zombie"
                    ? "🧟"
                    : service.id === "business-strategy"
                    ? "💼"
                    : "💬"}
                </div>
                <div className="text-sm text-gray-400">
                  {service.id === "game-zombie"
                    ? "Scenario"
                    : service.id === "business-strategy"
                    ? "Simulation"
                    : "Demonstration"}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-white">
                {service.name}
              </h3>

              <p className="text-gray-300 mb-4">{service.description}</p>

              <div className="flex items-center text-blue-400 font-medium">
                Start Experience
                <span className="ml-2">→</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Each experience uses generative AI to create unique and dynamic
            conversations.
          </p>
        </div>
      </div>
    </div>
  );
}
