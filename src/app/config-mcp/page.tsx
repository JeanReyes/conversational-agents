import Link from 'next/link';
import { McpResourceList } from './McpResourceList';

export default function ConfigMcpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MCP Configuration</h1>
        <p className="text-gray-300 mb-8">
          View and manage Model Context Protocol resources and tools.
        </p>
        <span>
          <Link target='_parent' href="https://mcp.composio.dev/dashboard">https://mcp.composio.dev/dashboard/create</Link>
        </span>
        <McpResourceList />
      </div>
    </div>
  );
}
