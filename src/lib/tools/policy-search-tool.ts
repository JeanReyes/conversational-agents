import { tool } from 'ai';
import { z } from 'zod';

export const policySearchTool = tool({
  description: 'Busca información sobre políticas de la tienda, procedimientos, o información general.',
  parameters: z.object({
    query: z.string().describe('Lo que quieres buscar, por ejemplo: "política de devoluciones"'),
  }),
  // @ts-expect-error - TypeScript inference issue with AI SDK 5.x, functionally correct
  execute: async ({ query }) => {
    console.log('🔍 POLICY SEARCH EJECUTADA con query:', query);
    
    // Simulación de búsqueda de políticas
    const policies: Record<string, string> = {
      'devoluciones': 'Puedes devolver productos dentro de 30 días con recibo. Producto debe estar sin usar.',
      'reembolso': 'Los reembolsos se procesan en 5-7 días hábiles una vez recibido el producto.',
      'envío': 'Envío gratis en compras mayores a $50. Entrega en 3-5 días hábiles.',
      'garantía': 'Todos los productos tienen garantía de 1 año contra defectos de fabricación.',
      'pago': 'Aceptamos tarjetas de crédito, débito, PayPal y transferencias bancarias.',
    };
    
    // Buscar palabra clave en la query
    const lowerQuery = query.toLowerCase();
    let result = 'No encontré información específica sobre eso. Por favor contacta a un supervisor.';
    
    for (const [key, value] of Object.entries(policies)) {
      if (lowerQuery.includes(key)) {
        result = value;
        break;
      }
    }
    
    return {
      query,
      result,
      found: result !== 'No encontré información específica sobre eso. Por favor contacta a un supervisor.'
    };
  },
});

