import { tool } from "ai";
import { z } from "zod";
import { getMcpHttpClient, callMcpTool } from "@/lib/tools/mcp/client-mcp-native";

export const falabellaSearchFlowTool = tool({
  description: 'Busca productos en falabella.com y devuelve los primeros resultados (títulos) mas la url del producto. Usa Playwright MCP orquestado.',
  parameters: z.object({
    query: z.string().min(1, 'query requerida').describe('Término de búsqueda para falabella.com'),
  }),
  // @ts-expect-error - AI SDK tool typing inference
  execute: async ({ query }) => {
    try {
      await getMcpHttpClient({ serverId: "playwright", url: "http://localhost:8931/mcp" });
      const q = encodeURIComponent(query);

      // 1) Navega y espera contenedor estable
      await callMcpTool("playwright", "browser_navigate", {
        url: `https://www.falabella.com/falabella-cl/search?Ntt=${q}`,
      });

      await callMcpTool("playwright", "browser_wait", {
        selector: "#testId-searchResults-products",
        timeoutMs: 20000,
      });

      // 2) Tomar SNAPSHOT de la página (accessibility tree)
      const snapshot = await callMcpTool("playwright", "browser_snapshot", {});
      
      return {
        query,
        snapshot
      };
    } catch (err: unknown) {
      return {
        query,
        error: (err as Error)?.message || "Error inesperado en falabellaSearchFlowTool",
      };
    }
  },
});
