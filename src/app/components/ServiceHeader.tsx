'use client';

import { useRouter } from 'next/navigation';
import { ServiceType } from '@/lib/types';

interface ServiceHeaderProps {
    serviceType: ServiceType;
}

function getServiceDetails(serviceType: ServiceType) {
    switch (serviceType) {
        case 'game-zombie':
            return { title: '🧟 Zombie Apocalypse' };
        case 'business-strategy':
            return { title: '💼 Business Strategy' };
        case 'agent-resolutor':
            return { title: '💬 Agent Resolutor' };
        case 'client-claim':
            return { title: '💬 Client Claim' };
        default:
            return { title: '' };
    }
}

export function ServiceHeader({ serviceType }: ServiceHeaderProps) {
  const router = useRouter();
  const { title } = getServiceDetails(serviceType);

  return (
    <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Cambiar Experiencia
          </button>
          <div className="text-lg font-semibold">
            {title}
          </div>
        </div>
      </div>
  );
}
