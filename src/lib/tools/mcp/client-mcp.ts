import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _mcpClientCache: { client: any; tools: any } | undefined;
}

// Helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtiene el cliente MCP singleton con retry
 * Usa sessionId fijo para reutilizar la misma sesión en el servidor
 */
export async function getMcpClientAndTools() {
  if (!globalThis._mcpClientCache) {
    const url = new URL('http://localhost:5000/mcp');
    
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const client = await createMCPClient({
          transport: new StreamableHTTPClientTransport(url),
        });

        // Esperar un poco para que el servidor termine de inicializar
        await sleep(100);

        const tools = await client.tools();
        
        globalThis._mcpClientCache = { client, tools };
        console.log('✅ MCP Client singleton creado');
        return globalThis._mcpClientCache;
      } catch (error) {
        lastError = error;
        retries--;
        console.log(`⚠️  Error conectando al servidor MCP, reintentos restantes: ${retries}`);
        if (retries > 0) {
          await sleep(500);
        }
      }
    }
    
    throw new Error(`No se pudo conectar al servidor MCP después de 3 intentos: ${lastError}`);
  }
  
  return globalThis._mcpClientCache;
}