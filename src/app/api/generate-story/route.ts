import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { type NextRequest, NextResponse } from "next/server";

import { ServiceFactory } from "@/lib/service-factory";
import { GenerateStoryRequest } from "@/lib/types";
import { getOrderStatusTool } from "@/lib/tools/order-status-tool";
import { policySearchTool } from "@/lib/tools/policy-search-tool";
import { registerComplaintTool } from "@/lib/tools/register-complaint-tool";
import { escalateCaseTool } from "@/lib/tools/escalate-case-tool";

/**
 * Generador de respuesta para getOrderStatus
 */
function generateOrderStatusResponse(output: Record<string, unknown>): string {
  const { status, estimatedDelivery, trackingNumber } = output;
  
  return (
    `He consultado el estado de tu pedido.\n\n` +
    `📦 Estado: ${status}\n` +
    `🚚 Número de seguimiento: ${trackingNumber}\n` +
    `📅 Entrega estimada: ${estimatedDelivery}\n\n` +
    `¿Hay algo más en lo que pueda ayudarte?`
  );
}

/**
 * Generador de respuesta para searchPolicy
 */
function generatePolicyResponse(output: Record<string, unknown>): string {
  const { result: policyInfo, found, query } = output;
  
  if (found) {
    return (
      `He consultado nuestra política sobre "${query}".\n\n` +
      `📋 Información: ${policyInfo}\n\n` +
      `¿Hay algo más en lo que pueda ayudarte?`
    );
  } else {
    return (
      `${policyInfo}\n\n` +
      `¿Hay algo más en lo que pueda ayudarte?`
    );
  }
}

/**
 * Generador de respuesta para registerComplaint
 */
function generateComplaintResponse(output: Record<string, unknown>): string {
  const { complaintId, order_number, compensation, message, estimatedResolution } = output;
  
  return (
    `He registrado tu reclamo exitosamente.\n\n` +
    `📝 Número de reclamo: ${complaintId}\n` +
    `📦 Orden: ${order_number}\n` +
    `💼 Solución aplicada: ${compensation}\n` +
    `⏰ Tiempo de resolución: ${estimatedResolution}\n\n` +
    `${message}\n\n` +
    `¿Hay algo más en lo que pueda ayudarte?`
  );
}

/**
 * Generador de respuesta para escalateCase
 */
function generateEscalateResponse(output: Record<string, unknown>): string {
  const { ticketId, order_number, message, estimatedContact } = output;
  
  return (
    `He escalado tu caso a un supervisor.\n\n` +
    `🔺 Número de ticket: ${ticketId}\n` +
    `📦 Orden: ${order_number}\n` +
    `⏰ Tiempo de contacto estimado: ${estimatedContact}\n\n` +
    `${message}\n\n` +
    `¿Hay algo más en lo que pueda ayudarte mientras tanto?`
  );
}

/**
 * Mapa de funciones generadoras de respuestas por herramienta
 */
const responseGenerators: Record<string, (output: Record<string, unknown>) => string> = {
  getOrderStatus: generateOrderStatusResponse,
  searchPolicy: generatePolicyResponse,
  registerComplaint: generateComplaintResponse,
  escalateCase: generateEscalateResponse,
};

/**
 * Genera respuestas basadas en los resultados de las herramientas
 */
function generateResponseFromToolResults(toolResults: Array<{ toolName: string; output: Record<string, unknown> }>): string {
  const responses: string[] = [];

  for (const result of toolResults) {
    const { toolName, output } = result;
    
    // Buscar generador específico para esta herramienta
    const generator = responseGenerators[toolName];
    
    if (generator) {
      responses.push(generator(output));
    } else {
      // Fallback para herramientas sin generador específico
      console.warn(`⚠️ No hay generador de respuesta para la herramienta: ${toolName}`);
      responses.push(
        `He procesado tu consulta usando ${toolName}. ` +
        `¿Hay algo más en lo que pueda ayudarte?`
      );
    }
  }

  return responses.join('\n\n');
}

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

    // Herramientas custom que SÍ funcionan
    const tools = serviceType === 'agent-resolutor' ? {
      getOrderStatus: getOrderStatusTool,
      searchPolicy: policySearchTool,
      registerComplaint: registerComplaintTool,
      escalateCase: escalateCaseTool,
    } : undefined;

    const res = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
      tools,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📍 FINISH REASON: ${finishReason}`);
        console.log('📝 Text:', text || '(vacío)');
        console.log('🛠️  Tool Calls:', toolCalls?.length || 0);
        
        if (toolCalls?.length) {
          console.log('🔧 HERRAMIENTAS LLAMADAS:');
          toolCalls.forEach(tc => {
            console.log(`   - ${tc.toolName}`);
            console.log(`     Args:`, tc);
          });
        }
        
        if (toolResults?.length) {
          console.log('📦 RESULTADOS RECIBIDOS:');
          toolResults.forEach(r => {
            console.log(`   ✅ ${r.toolName}`);
            console.log(`   📄 Output:`, JSON.stringify(r.output).substring(0, 200));
          });
        }
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }
    });

    // Verificar si se usaron herramientas
    const toolsUsed = res.steps?.some(step => step.toolCalls && step.toolCalls.length > 0);
    console.log('🔧 ¿Se usaron herramientas?', toolsUsed ? 'SÍ ✅' : 'NO ❌');

    let finalText = res.text;

    // Si hay tool results pero no hay texto, generar respuesta basada en los resultados
    if (toolsUsed) {
      const allToolResults = res.steps?.flatMap(step => step.toolResults || []) || [];
      
      if (allToolResults.length > 0) {
        // Generar respuesta basada en los resultados
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        finalText = generateResponseFromToolResults(allToolResults as any);
        console.log('✅ Respuesta generada automáticamente:', finalText.substring(0, 150) + '...');
      }
    }

    const [narrative, imagePrompt] = finalText.split(service.config.IMAGE.SEPARATOR);

    return NextResponse.json({ narrative, imagePrompt });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error generating story" }, { status: 500 });
  }
}