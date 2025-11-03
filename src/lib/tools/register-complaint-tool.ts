import { tool } from 'ai';
import { z } from 'zod';

export const registerComplaintTool = tool({
  description: 'Registra OFICIALMENTE un reclamo del cliente. IMPORTANTE: Solo usar DESPUÉS de haber validado con verify-issue-tool y tener toda la información necesaria.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
    issue: z.enum([
      'delayed_delivery', 
      'damaged_product', 
      'wrong_item', 
      'missing_item', 
      'quality_issue',
      'billing_error',
      'overcharge'
    ]).describe('Tipo de problema'),
    compensation: z.enum([
      'refund', 
      'discount', 
      'free_shipping', 
      'replacement', 
      'priority_shipping'
    ]).describe('Compensación ofrecida según validación previa'),
    verified: z.boolean().describe('Debe ser true. Indica que el problema fue validado con verify-issue-tool'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
  execute: async ({ order_number, issue, compensation, verified }) => {
    console.log('📝 REGISTER COMPLAINT TOOL ejecutada:', { order_number, issue, compensation, verified });
    
    // ⭐ PROTECCIÓN: Rechazar si no se validó primero
    if (!verified) {
      return {
        success: false,
        error: 'VALIDACIÓN_REQUERIDA',
        message: 'Debes validar el reclamo con verify-issue-tool antes de registrarlo oficialmente.'
      };
    }
    
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

