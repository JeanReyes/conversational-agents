import { tool } from 'ai';
import { z } from 'zod';

export const getOrderStatusTool = tool({
  description: 'Consulta el estado de un pedido usando su número de orden.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
  }),
  execute: async ({ order_number }) => {
    console.log('📦 ORDER STATUS TOOL EJECUTADA con order_number:', order_number);
    return {
      status: `Pedido ${order_number} está en tránsito`, 
      estimatedDelivery: '2-3 días',
      trackingNumber: 'TRK123456789'
    };
  },
});


