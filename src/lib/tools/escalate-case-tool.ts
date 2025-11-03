import { tool } from 'ai';
import { z } from 'zod';

export const escalateCaseTool = tool({
  description: 'Escala el caso a un supervisor o agente humano cuando el problema es muy complejo o el cliente está muy insatisfecho.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
    reason: z.string().describe('Razón detallada de la escalación'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
  execute: async ({ order_number, reason }) => {
    console.log('🔺 ESCALATE CASE TOOL ejecutada:', { order_number, reason });
    
    const ticketId = `ESC-${Date.now()}`;
    
    return {
      success: true,
      ticketId,
      order_number,
      reason,
      message: `Caso escalado exitosamente (${ticketId}). Un supervisor se contactará en 1-2 horas.`,
      priority: 'high',
      estimatedContact: '1-2 horas'
    };
  },
});

