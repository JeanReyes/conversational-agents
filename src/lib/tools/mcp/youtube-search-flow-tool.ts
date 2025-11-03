import { tool } from 'ai';
import { z } from 'zod';
import { getMcpHttpClient, callMcpTool } from '@/lib/tools/mcp/client-mcp-native';
import { parseSnapshot, findFirstByPredicate, extractTopTitles } from '@/lib/tools/mcp/utils';

export const youtubeSearchFlowTool = tool({
  description: 'Busca en YouTube y devuelve los primeros resultados (títulos). Usa Playwright MCP orquestado.',
  parameters: z.object({
    query: z.string().min(1, 'query requerida').describe('Término de búsqueda para YouTube'),
    maxResults: z.number().int().positive().max(20).optional().default(5),
  }),
  // @ts-expect-error - AI SDK tool typing inference
  execute: async ({ query, maxResults }) => {
    console.log('query', query);
    // 1) Asegurar conexión al servidor Playwright MCP HTTP
    await getMcpHttpClient({ serverId: 'playwright', url: 'http://localhost:8931/mcp' });

    // 2) Navegar a YouTube
    await callMcpTool('playwright', 'browser_navigate', { url: 'https://www.youtube.com' });

    // 3) Primer snapshot y búsqueda del input
    const snap1 = await callMcpTool('playwright', 'browser_snapshot', {});
    const tree1 = parseSnapshot(snap1);
    const searchInput = findFirstByPredicate(tree1, (n) => {
      const role = (n.role || '').toLowerCase();
      const name = (n.name || '').toLowerCase();
      return (
        ['textbox', 'searchbox'].includes(role) &&
        (name.includes('search') || name.includes('buscar') || name.includes('search youtube') || name.includes('search query')) &&
        !!n.ref
      );
    });

    if (!searchInput?.ref) {
      const q = encodeURIComponent(query);
      await callMcpTool('playwright', 'browser_navigate', { url: `https://www.youtube.com/results?search_query=${q}` });
    } else {
      // 4) Escribir y enviar
      await callMcpTool('playwright', 'browser_type', {
        element: 'YouTube search input',
        ref: searchInput.ref,
        text: query,
        submit: true,
      });
    }

    // 5) Esperar resultados
    await callMcpTool('playwright', 'browser_wait_for', { time: 2 });

    // 6) Snapshot con resultados y parseo
    const snap2 = await callMcpTool('playwright', 'browser_snapshot', {});
    const tree2 = parseSnapshot(snap2);
    const titles = extractTopTitles(tree2, maxResults);

    return {
      query,
      results: titles,
      count: titles.length,
      usedRef: searchInput?.ref || null,
      snapshotBefore: (snap1 as { content?: Array<{ type: string; text?: string }> } | null | undefined)?.content?.find((c) => c.type === 'text')?.text || null,
      snapshotAfter: (snap2 as { content?: Array<{ type: string; text?: string }> } | null | undefined)?.content?.find((c) => c.type === 'text')?.text || null,
    };
  },
});


