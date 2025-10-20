import { promises as fs } from 'fs';
import path from 'path';

/**
 * Asegura que un directorio existe, creándolo recursivamente si es necesario
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Añade un objeto como línea JSON al final de un archivo JSONL
 * @param filePath Ruta del archivo JSONL
 * @param obj Objeto a serializar y añadir
 */
export async function appendJsonl(filePath: string, obj: unknown): Promise<void> {
  try {
    const jsonString = JSON.stringify(obj);
    if (!jsonString || jsonString === '{}') {
      throw new Error('Cannot append empty or invalid object to JSONL');
    }
    
    // Añadir newline al final
    await fs.appendFile(filePath, jsonString + '\n', 'utf-8');
  } catch (error) {
    console.error(`Error appending to JSONL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Lee todas las conversaciones de un archivo JSONL
 * @param filePath Ruta del archivo JSONL
 * @returns Array de objetos parseados
 */
export async function readJsonl(filePath: string): Promise<unknown[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Archivo no existe todavía
      return [];
    }
    console.error(`Error reading JSONL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Obtiene la ruta al directorio de datasets desde variables de entorno
 */
export function getDatasetDir(): string {
  return process.env.DATASET_DIR || 'dataset';
}

/**
 * Verifica si el guardado de datasets está habilitado
 */
export function isDatasetSaveEnabled(): boolean {
  return process.env.DATASET_SAVE !== 'off';
}

/**
 * Construye la ruta completa al archivo de dataset para un tipo de servicio
 */
export function getDatasetFilePath(serviceType: string): string {
  const dir = getDatasetDir();
  return path.join(process.cwd(), dir, `${serviceType}.jsonl`);
}

