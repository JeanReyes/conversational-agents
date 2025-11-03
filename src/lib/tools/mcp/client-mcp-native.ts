import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

type McpHttpConfig = {
  serverId: string;
  url: string;
  sessionId?: string;
};

declare global {
  var _mcpClientsCache: Map<string, Client> | undefined;
}

/**
 * Obtiene un cliente MCP via HTTP
 * @param config - Configuración del servidor MCP
 */
export async function getMcpHttpClient(config: McpHttpConfig): Promise<Client> {
  if (!globalThis._mcpClientsCache) {
    globalThis._mcpClientsCache = new Map();
  }

  const cached = globalThis._mcpClientsCache.get(config.serverId);
  if (cached) return cached;

  const client = new Client(
    { name: 'game-ia-client', version: '1.0.0' },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(new URL(config.url));
  await client.connect(transport);

  globalThis._mcpClientsCache.set(config.serverId, client);
  console.log(`✅ MCP Client "${config.serverId}" conectado a ${config.url}`);

  return client;
}

/**
 * Lee un recurso del servidor MCP
 * @param serverId - ID del servidor MCP
 * @param uri - URI del recurso (ej: 'greeting://hello')
 */
export async function readMcpResource(serverId: string, uri: string) {
  const client = globalThis._mcpClientsCache?.get(serverId);
  if (!client) throw new Error(`Cliente MCP "${serverId}" no encontrado. Debes conectarte primero.`);
  return await client.readResource({ uri });
}

/**
 * Lista todos los recursos disponibles en el servidor MCP
 * @param serverId - ID del servidor MCP
 */
export async function listMcpResources(serverId: string) {
  const client = globalThis._mcpClientsCache?.get(serverId);
  if (!client) throw new Error(`Cliente MCP "${serverId}" no encontrado. Debes conectarte primero.`);
  return await client.listResources();
}

/**
 * Lista todas las herramientas disponibles en el servidor MCP
 * @param serverId - ID del servidor MCP
 */
export async function listMcpTools(serverId: string) {
  const client = globalThis._mcpClientsCache?.get(serverId);
  if (!client) throw new Error(`Cliente MCP "${serverId}" no encontrado. Debes conectarte primero.`);
  return await client.listTools();
}

/**
 * Llama una herramienta del servidor MCP
 * @param serverId - ID del servidor MCP
 * @param name - Nombre de la herramienta
 * @param args - Argumentos de la herramienta
 */
export async function callMcpTool(serverId: string, name: string, args?: Record<string, unknown>) {
  const client = globalThis._mcpClientsCache?.get(serverId);
  if (!client) throw new Error(`Cliente MCP "${serverId}" no encontrado. Debes conectarte primero.`);
  return await client.callTool({ 
    name, 
    arguments: args 
  });
}

/**
 * Cierra la conexión de un cliente MCP
 * @param serverId - ID del servidor MCP a cerrar
 */
export async function closeMcpClient(serverId: string) {
  const client = globalThis._mcpClientsCache?.get(serverId);
  if (client) {
    await client.close();
    globalThis._mcpClientsCache?.delete(serverId);
    console.log(`🔌 MCP Client "${serverId}" cerrado`);
  }
}
