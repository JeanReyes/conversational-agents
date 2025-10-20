import { type NextRequest, NextResponse } from "next/server";
import path from 'path';
import { 
  ensureDir, 
  appendJsonl, 
  getDatasetDir, 
  isDatasetSaveEnabled,
  getDatasetFilePath 
} from "@/lib/dataset";

interface SaveDatasetRequest {
  service_type: string;
  conversation: {
    conversation_id: string;
    service_type: string;
    finished_at: string;
    resolution_status: string;
    metadata: Record<string, unknown>;
    turns: Array<{
      turn_id: number;
      role: string;
      timestamp: string;
      content: string;
      action?: string | null;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar si el guardado está habilitado
    if (!isDatasetSaveEnabled()) {
      return NextResponse.json(
        { message: "Dataset save is disabled" }, 
        { status: 200 }
      );
    }

    const body: SaveDatasetRequest = await request.json();
    
    // Validaciones básicas
    if (!body.service_type || typeof body.service_type !== 'string') {
      return NextResponse.json(
        { error: "service_type is required and must be a string" }, 
        { status: 400 }
      );
    }

    if (!body.conversation || typeof body.conversation !== 'object') {
      return NextResponse.json(
        { error: "conversation object is required" }, 
        { status: 400 }
      );
    }

    const { conversation } = body;

    // Validar campos requeridos del objeto conversation
    if (!conversation.conversation_id || !conversation.resolution_status || !Array.isArray(conversation.turns)) {
      return NextResponse.json(
        { error: "conversation must have conversation_id, resolution_status, and turns array" }, 
        { status: 400 }
      );
    }

    // Validar que service_type sea seguro para nombre de archivo
    const safeServiceType = body.service_type.replace(/[^a-z0-9\-_]/gi, '_');
    
    // Obtener directorio y asegurar que existe
    const datasetDir = path.join(process.cwd(), getDatasetDir());
    await ensureDir(datasetDir);

    // Construir ruta del archivo
    const filePath = getDatasetFilePath(safeServiceType);

    // Añadir conversación al archivo JSONL
    await appendJsonl(filePath, conversation);

    console.log(`✅ Dataset saved: ${safeServiceType}.jsonl (${conversation.turns.length} turns, status: ${conversation.resolution_status})`);

    return NextResponse.json({ 
      success: true, 
      file: `${safeServiceType}.jsonl`,
      conversation_id: conversation.conversation_id 
    });

  } catch (error) {
    console.error("Error saving dataset:", error);
    return NextResponse.json(
      { error: "Error saving dataset", details: (error as Error).message }, 
      { status: 500 }
    );
  }
}

