import { tool } from 'ai';
import { z } from 'zod';

export const registerComplaintTool = tool({
  description: 'Registra un reclamo del cliente y ofrece compensación/solución apropiada según el problema.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
    issue: z.enum(['delayed_delivery', 'damaged_product', 'wrong_item', 'missing_item', 'quality_issue']).describe('Tipo de problema'),
    compensation: z.enum(['refund', 'discount', 'free_shipping', 'replacement', 'priority_shipping']).describe('Compensación ofrecida'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
  execute: async ({ order_number, issue, compensation }) => {
    console.log('📝 REGISTER COMPLAINT TOOL ejecutada:', { order_number, issue, compensation });
    
    const complaintId = `CLM-${Date.now()}`;
    
    return {
      success: true,
      complaintId,
      order_number,
      issue,
      compensation,
      message: `Reclamo registrado exitosamente (${complaintId}). Se ha aplicado: ${compensation}`,
      estimatedResolution: '24-48 horas'
    };
  },
});

