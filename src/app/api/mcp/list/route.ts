import { listMcpResources, getMcpResourceClient } from '@/lib/tools/mcp/client-mcp-native';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the MCP client
    const client = await getMcpResourceClient();
    
    // List resources
    const resourcesResponse = await listMcpResources();
    
    // List tools
    const toolsResponse = await client.listTools();
    
    return NextResponse.json({
      resources: resourcesResponse.resources || [],
      tools: toolsResponse.tools || [],
    });
  } catch (error) {
    console.error('Error listing MCP resources:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to MCP server',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
