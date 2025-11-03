import { tool } from 'ai';
import { z } from 'zod';

export const getOrderStatusTool = tool({
  description: 'Consulta el estado y detalles completos de un pedido. SIEMPRE usar esta herramienta ANTES de registrar un reclamo.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
  execute: async ({ order_number }) => {
    console.log('📦 ORDER STATUS TOOL EJECUTADA con order_number:', order_number);
    
    // ⭐ VALIDACIÓN MOCK: Solo la orden 123456 existe
    if (order_number !== '123456') {
      return {
        found: false,
        order_number,
        message: 'No se encontró una orden con ese número. Por favor verifica el número de orden e intenta nuevamente.',
      };
    }
    
    // ⭐ DATOS COMPLETOS para la orden válida
    return {
      found: true,
      order_number: '123456',
      status: 'delivered',
      product: 'Producto comprado',
      amount_paid: 899.99,
      purchase_date: '2024-10-15',
      estimated_delivery: '2024-10-18',
      actual_delivery: '2024-10-20',
      tracking_number: 'TRK987654321',
      payment_method: 'Tarjeta ****4532'
    };
  },
});


