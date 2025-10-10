import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { type NextRequest, NextResponse } from "next/server";

import { ServiceFactory } from "@/lib/service-factory";
import { GenerateStoryRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userMessage, conversationHistory, isStart, serviceType }: GenerateStoryRequest = await request.json();
    
    if (!serviceType) {
      return NextResponse.json({ error: "Service type is required" }, { status: 400 });
    }

    // Cargar servicio dinámicamente
    const service = await ServiceFactory.getService(serviceType);
    
    let prompt: string = service.prompts.INITIAL_STORY;

    if (!isStart) {
      const historyText = conversationHistory.map(message => `${message.role}: ${message.content}`).join("\n");
      prompt = service.prompts.CONTINUE_STORY(historyText, userMessage);
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
    });

    const [narrative, imagePrompt] = text.split(service.config.IMAGE.SEPARATOR);

    return NextResponse.json({ narrative, imagePrompt });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error generating story" }, { status: 500 });
  }
}