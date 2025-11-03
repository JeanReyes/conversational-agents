import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { type NextRequest, NextResponse } from "next/server";

import { ServiceFactory } from "@/lib/service-factory";
import { GenerateStoryRequest } from "@/lib/types";
import { getOrderStatusTool } from "@/lib/tools/order-status-tool";
import { policySearchTool } from "@/lib/tools/policy-search-tool";
import { registerComplaintTool } from "@/lib/tools/register-complaint-tool";
import { escalateCaseTool } from "@/lib/tools/escalate-case-tool";
import { verifyIssueTool } from "@/lib/tools/verify-issue-tool";
import { mcpPingTool } from "@/lib/tools/mcp/mcp-tool-wrapper";
import { youtubeSearchFlowTool } from "@/lib/tools/mcp/youtube-search-flow-tool";
import { falabellaSearchFlowTool } from "@/lib/tools/mcp/falabella-search-flow-tool";

export async function POST(request: NextRequest) {
  try {
    const { userMessage, conversationHistory, isStart, serviceType }: GenerateStoryRequest = await request.json();
    
    if (!serviceType) {
      return NextResponse.json({ error: "Service type is required" }, { status: 400 });
    }

    // Cargar servicio dinámicamente
    const service = await ServiceFactory.getService(serviceType);
    
    if (!service.prompts) {
      return NextResponse.json({ error: "Service prompts are not defined" }, { status: 500 });
    }

    let prompt: string = service.prompts.INITIAL_STORY;

    if (!isStart) {
      const historyText = conversationHistory.map(message => `${message.role}: ${message.content}`).join("\n");
      prompt = service.prompts.CONTINUE_STORY(historyText, userMessage);
    }

    let tools = {};
    
    if (serviceType === 'agent-resolutor') {
      tools = {
        getOrderStatus: getOrderStatusTool,
        verifyIssue: verifyIssueTool,
        searchPolicy: policySearchTool,
        registerComplaint: registerComplaintTool,
        escalateCase: escalateCaseTool,
      };
    } else if (serviceType === 'agent-standar') {
      tools = {
        // Herramientas locales
        getOrderStatus: getOrderStatusTool,
        verifyIssue: verifyIssueTool,
        searchPolicy: policySearchTool,
        registerComplaint: registerComplaintTool,
        escalateCase: escalateCaseTool,
        // Herramientas MCP - Servidor local
        ping: mcpPingTool,
        // Herramientas MCP - Playwright
       youtubeSearchFlow: youtubeSearchFlowTool,
       falabellaSearchFlow: falabellaSearchFlowTool,
      };
    }

    const res = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
      tools,
    });

    const toolsUsed = res.steps?.some(step => step.toolCalls && step.toolCalls.length > 0);
    console.log('toolsUsed', toolsUsed);
    let finalText = res.text;

    // ⭐ Combinar respuesta del LLM con resultados de herramientas
    if (toolsUsed) {
      // Obtener todos los toolResults de los steps
      const allToolResults = res.steps?.flatMap(step => step.toolResults || []) || [];
      
      // Filtrar resultados exitosos:
      // - MCP tools: tienen output.isError === false
      // - Local tools: no tienen isError, son exitosos si output existe
      const successfulResults = allToolResults.filter(r => {
        const output = r.output as Record<string, unknown>;
        if (!output) return false;
        
        // Si tiene isError (MCP tool), verificar que sea false
        if ('isError' in output) {
          return output.isError === false;
        }
        
        // Si no tiene isError (Local tool), es exitoso si tiene output
        return true;
      });
      
      if (successfulResults.length > 0) {
        // Si el LLM generó texto, usarlo (ya tiene contexto de las herramientas)
        if (res.text && res.text.trim().length > 0) {
          finalText = res.text;
        } else {
          // 🔥 El LLM llamó herramientas pero NO generó respuesta
          // Hacer un SEGUNDO llamado con los resultados de las herramientas
          
          // Construir contexto con los resultados de las herramientas exitosas
          const toolResultsContext = successfulResults.map(r => {
            const output = r.output as Record<string, unknown>;
            // MCP tools: usar structuredContent
            // Local tools: usar output directamente
            const content = (output as { structuredContent?: unknown }).structuredContent || output;
            return `Resultado de ${r.toolName}: ${JSON.stringify(content)}`;
          }).join('\n');
          
          console.log("toolResultsContext", toolResultsContext);
          // Construir historial para contexto
          const historyText = conversationHistory?.map(m => `${m.role}: ${m.content}`).join('\n') || '';
          
          const secondPrompt = await ServiceFactory.getService('response-tools');
          const generatedPrompt = secondPrompt.prompts!.CONTINUE_STORY(historyText, userMessage, toolResultsContext);

          const res2 = await generateText({
            model: google("gemini-2.5-flash-lite"),
            prompt: generatedPrompt,
          });
          
          finalText = res2.text;
        }
      } else if (allToolResults.length > 0) {
        finalText = 'Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo.';
      }
    }

    const [narrative, imagePrompt] = finalText.split(service.config.IMAGE.SEPARATOR);

    return NextResponse.json({ narrative, imagePrompt });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error generating story" }, { status: 500 });
  }
}