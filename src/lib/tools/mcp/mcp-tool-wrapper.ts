import { tool } from 'ai';
import { z } from 'zod';
import { getMcpHttpClient, callMcpTool, closeMcpClient } from '@/lib/tools/mcp/client-mcp-native';

/**
 * Crea un wrapper de herramienta MCP para usar con generateText()
 * 
 * @param config Configuración de la herramienta MCP
 * @returns Tool compatible con AI SDK
 */
export function createMcpToolWrapper(config: {
  serverId: string;
  toolName: string;
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
  serverUrl?: string;
}) {
  return tool({
    description: config.description,
    parameters: config.parameters,
    // @ts-expect-error - TypeScript inference issue with AI SDK 5.x
    execute: async (args) => {
      console.log(`🔧 MCP Tool "${config.toolName}" ejecutada en "${config.serverId}" con args:`, args);
      
      let retries = 2;
      let lastError;
      
      while (retries > 0) {
        try {
          // Conectar al servidor MCP si aún no está conectado
          await getMcpHttpClient({
            serverId: config.serverId,
            url: config.serverUrl || 'http://localhost:5000/mcp',
          });
          
          // Llamar la herramienta MCP
          const result = await callMcpTool(config.serverId, config.toolName, args);
        
        console.log(`✅ MCP Tool "${config.toolName}" resultado:`, result);
        
        // Extraer el contenido de la respuesta MCP
        if (result.content && Array.isArray(result.content)) {
          // Buscar contenido de tipo texto
          const textContent = result.content.find((c: { type: string; text?: string }) => c.type === 'text');
          if (textContent && textContent.text) {
            try {
              // Intentar parsear JSON si es posible
              return JSON.parse(textContent.text);
            } catch {
              // Si no es JSON, retornar el texto tal cual
              return { result: textContent.text };
            }
          }
        }
        
          // Si no hay content, retornar el resultado completo
          return result;
          
        } catch (error) {
          lastError = error;
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          // Si es error de "Server already initialized", resetear y reintentar
          if (errorMsg.includes('Server already initialized') || errorMsg.includes('Server not initialized')) {
            console.log(`⚠️ Error de sesión MCP, limpiando caché y reintentando... (${retries - 1} intentos restantes)`);
            
            // Cerrar cliente y limpiar caché
            await closeMcpClient(config.serverId);
            
            // Resetear sesiones del servidor
            try {
              await fetch('http://localhost:5000/mcp/reset', { method: 'POST' });
            } catch {
              // Ignorar si falla el reset
            }
            
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
          }
          
          // Si no es error de sesión o ya no quedan reintentos
          console.error(`❌ Error en MCP Tool "${config.toolName}":`, error);
          return {
            error: true,
            message: `No se pudo ejecutar la herramienta ${config.toolName}`,
            details: errorMsg,
          };
        }
      }
      
      // Si llegamos aquí, todos los reintentos fallaron
      console.error(`❌ MCP Tool "${config.toolName}" falló después de todos los reintentos`);
      return {
        error: true,
        message: `No se pudo ejecutar la herramienta ${config.toolName} después de varios intentos`,
        details: lastError instanceof Error ? lastError.message : String(lastError),
      };
    },
  });
}

// ========== HERRAMIENTAS MCP PRE-DEFINIDAS ==========

/**
 * Herramienta ping del servidor local
 */
export const mcpPingTool = createMcpToolWrapper({
  serverId: 'local',
  toolName: 'ping',
  description: 'Hace ping al servidor para verificar conectividad. Devuelve "pong" opcionalmente con eco del mensaje.',
  parameters: z.object({
    message: z.string().optional().describe('Mensaje opcional para hacer eco'),
  }),
});

/**
 * Herramienta browser_navigate de Playwright MCP
 * IMPORTANTE: Levantar primero con: npx @playwright/mcp@latest --port 8931
 */
export const browserNavigateTool = createMcpToolWrapper({
  serverId: 'playwright',
  serverUrl: 'http://localhost:8931/mcp',
  toolName: 'browser_navigate',
  description: 'Navega a una URL específica en el navegador',
  parameters: z.object({
    url: z.string().describe('URL a la que navegar'),
  }),
});

/**
 * Herramienta browser_snapshot de Playwright MCP
 */
export const browserSnapshotTool = createMcpToolWrapper({
  serverId: 'playwright',
  serverUrl: 'http://localhost:8931/mcp',
  toolName: 'browser_snapshot',
  description: 'Captura un snapshot de accesibilidad de la página actual',
  parameters: z.object({}),
});

/**
 * Herramienta browser_click de Playwright MCP
 */
export const browserClickTool = createMcpToolWrapper({
  serverId: 'playwright',
  serverUrl: 'http://localhost:8931/mcp',
  toolName: 'browser_click',
  description: 'Hace click en un elemento de la página',
  parameters: z.object({
    element: z.string().describe('Descripción del elemento en el que hacer click'),
    ref: z.string().describe('Referencia exacta del elemento desde el snapshot'),
  }),
});

/**
 * Herramienta browser_type de Playwright MCP
 * Escribe texto en un elemento editable y opcionalmente hace submit
 */
export const browserTypeTool = createMcpToolWrapper({
  serverId: 'playwright',
  serverUrl: 'http://localhost:8931/mcp',
  toolName: 'browser_type',
  description: 'Escribe texto en un elemento editable. Puede enviar con Enter (submit).',
  parameters: z.object({
    element: z.string().describe('Descripción humana del elemento a editar'),
    ref: z.string().describe('Referencia exacta del elemento desde el snapshot'),
    text: z.string().describe('Texto a escribir'),
    submit: z.boolean().optional().describe('Si debe presionar Enter al final'),
    slowly: z.boolean().optional().describe('Escribir lentamente, carácter por carácter'),
  }),
});

/**
 * Herramienta browser_wait_for de Playwright MCP
 * Espera una condición simple: tiempo, aparición o desaparición de texto
 */
export const browserWaitForTool = createMcpToolWrapper({
  serverId: 'playwright',
  serverUrl: 'http://localhost:8931/mcp',
  toolName: 'browser_wait_for',
  description: 'Espera por tiempo o por aparición/desaparición de un texto en la página.',
  parameters: z.object({
    time: z.number().optional().describe('Tiempo a esperar en segundos'),
    text: z.string().optional().describe('Texto a esperar que aparezca'),
    textGone: z.string().optional().describe('Texto a esperar que desaparezca'),
  }),
});

// npx @playwright/mcp@latest --port 8931