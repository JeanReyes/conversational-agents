'use client';

import { useEffect, useState } from 'react';

interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export function McpResourceList() {
  const [resources, setResources] = useState<McpResource[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMcpData() {
      try {
        setLoading(true);
        const response = await fetch('/api/mcp/list');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch MCP data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setResources(data.resources || []);
        setTools(data.tools || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching MCP data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMcpData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
        <p className="text-red-300">{error}</p>
        <p className="text-sm text-gray-400 mt-4">
          Make sure the MCP server is running on http://localhost:5000/mcp
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Resources Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">📦</span>
          Resources ({resources.length})
        </h2>
        
        {resources.length === 0 ? (
          <p className="text-gray-400 italic">No resources available</p>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div
                key={resource.uri}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-mono text-lg text-blue-300">{resource.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{resource.uri}</p>
                    {resource.description && (
                      <p className="text-gray-300 mt-2">{resource.description}</p>
                    )}
                  </div>
                  {resource.mimeType && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {resource.mimeType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tools Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-green-400">🛠️</span>
          Tools ({tools.length})
        </h2>
        
        {tools.length === 0 ? (
          <p className="text-gray-400 italic">No tools available</p>
        ) : (
          <div className="grid gap-4">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <h3 className="font-mono text-lg text-green-300">{tool.name}</h3>
                {tool.description && (
                  <p className="text-gray-300 mt-2">{tool.description}</p>
                )}
                {tool.inputSchema && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200">
                      View input schema
                    </summary>
                    <pre className="mt-2 bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
