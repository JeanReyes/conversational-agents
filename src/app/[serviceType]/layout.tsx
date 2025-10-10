import { ServiceHeader } from '@/app/components/ServiceHeader';
import { ServiceType } from '@/lib/types';

export default function ServiceLayout({
  children,
  params: { serviceType },
}: {
  children: React.ReactNode;
  params: { serviceType: ServiceType };
}) {
  return (
    <div className="font-sans h-screen flex flex-col mx-auto overflow-hidden">
      <ServiceHeader serviceType={serviceType} />
      <div className="flex-grow overflow-y-auto relative">
        {children}
      </div>
    </div>
  );
}
