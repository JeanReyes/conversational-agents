import { ServiceHeader } from '@/app/components/ServiceHeader';
import { ServiceType } from '@/lib/types';

export default async function ServiceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serviceType: ServiceType }>;
}) {
  const { serviceType } = await params;
  
  return (
    <div className="font-sans h-screen flex flex-col mx-auto overflow-hidden">
      <ServiceHeader serviceType={serviceType} />
      <div className="flex-grow overflow-y-auto relative">
        {children}
      </div>
    </div>
  );
}
