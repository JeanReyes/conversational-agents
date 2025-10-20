import { GameProvider } from '@/lib/game-context';
import { ServiceType } from '@/lib/types';
import { GameInterface } from '@/components/GameInterface';

interface PageProps {
  params: Promise<{
    serviceType: ServiceType;
  }>;
}

export default async function ServicePage({ params }: PageProps) {
  const { serviceType } = await params;

  return (
    <GameProvider initialServiceType={serviceType}>
      <GameInterface />
    </GameProvider>
  );
}

export function generateStaticParams() {
  return [
    { serviceType: 'game-zombie' },
    { serviceType: 'business-strategy' },
    { serviceType: 'agent-resolutor' },
    { serviceType: 'client-claim' },
  ];
}
