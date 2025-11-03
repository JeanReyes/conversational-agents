import { tool } from 'ai';
import { z } from 'zod';

export const verifyIssueTool = tool({
  description: 'Analiza y valida un problema reportado por el cliente ANTES de registrar un reclamo. Esta herramienta determina si el reclamo es válido y qué compensación recomendar.',
  parameters: z.object({
    order_number: z.string().describe('Número de orden del cliente'),
    reported_issue: z.string().describe('Descripción exacta del problema que reporta el cliente (ej: "quiere cancelar", "no llegó", "retraso")'),
    issue_type: z.enum([
      'delayed_delivery', 
      'damaged_product', 
      'wrong_item', 
      'missing_item', 
      'quality_issue',
      'billing_error',
      'overcharge'
    ]).describe('Clasificación del problema. Si el cliente quiere cancelar usa "missing_item"'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
  execute: async ({ order_number, reported_issue, issue_type }) => {
    console.log('🔍 VERIFY ISSUE TOOL ejecutada:', { order_number, issue_type, reported_issue });
    
    // Simulación de validación inteligente
    let validation = {
      valid: true,
      reason: '',
      recommended_compensation: '',
      requires_more_info: false
    };
    
    // Determinar validación según el tipo de problema reportado
    switch(issue_type) {
      case 'delayed_delivery':
        validation = {
          valid: true,
          reason: `Reclamo por retraso en la entrega validado. El cliente reporta: "${reported_issue}"`,
          recommended_compensation: 'discount',
          requires_more_info: false
        };
        break;
      
      case 'billing_error':
      case 'overcharge':
        validation = {
          valid: true,
          reason: `Posible error en el cobro detectado. El cliente reporta: "${reported_issue}". Se requiere confirmación de montos específicos.`,
          recommended_compensation: 'refund',
          requires_more_info: true
        };
        break;
      
      case 'damaged_product':
        validation = {
          valid: true,
          reason: `Producto dañado reportado. El cliente indica: "${reported_issue}"`,
          recommended_compensation: 'replacement',
          requires_more_info: false
        };
        break;
      
      case 'wrong_item':
        validation = {
          valid: true,
          reason: `Producto incorrecto recibido. El cliente reporta: "${reported_issue}"`,
          recommended_compensation: 'replacement',
          requires_more_info: false
        };
        break;
      
      case 'missing_item':
        // Puede ser cancelación o producto no llegó
        validation = {
          valid: true,
          reason: `Solicitud procesada. El cliente reporta: "${reported_issue}"`,
          recommended_compensation: 'refund',
          requires_more_info: false
        };
        break;
      
      case 'quality_issue':
        validation = {
          valid: true,
          reason: `Problema de calidad reportado. El cliente indica: "${reported_issue}"`,
          recommended_compensation: 'replacement',
          requires_more_info: false
        };
        break;
      
      default:
        validation = {
          valid: true,
          reason: `Reclamo válido. El cliente reporta: "${reported_issue}"`,
          recommended_compensation: 'discount',
          requires_more_info: false
        };
    }
    
    return {
      is_valid: validation.valid,
      order_number,
      issue_type,
      validation_reason: validation.reason,
      recommended_action: validation.recommended_compensation,
      requires_supervisor: false, // Podría ser true para casos complejos
      requires_more_info: validation.requires_more_info,
      next_steps: validation.requires_more_info 
        ? 'Solicitar información adicional al cliente antes de proceder'
        : 'Puede proceder a registrar el reclamo',
      message: `Validación completada. ${validation.reason}`
    };
  },
});

