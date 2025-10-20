# Plan de Implementación: Exportación de Datasets de Conversaciones (JSONL)

Fecha: 10-10-2025
Estado: Listo para implementar
Tiempo estimado: 45–60 min

## Objetivo
Al finalizar cada conversación, guardar un registro estructurado en formato JSONL dentro de la carpeta `dataset/`, con un archivo por `initialServiceType` (p. ej., `dataset/agent-resolutor.jsonl`). Esto permitirá construir datasets para análisis y entrenamiento de modelos.

## Alcance
- Exportar 1 línea JSON válida por conversación (JSONL) en `dataset/{service}.jsonl`.
- Construir objeto de conversación a partir de `messages` y `StageInfo` del flujo actual.
- Integración no bloqueante (si falla, no rompe la app, solo loguea el error).

Fuera de alcance (por ahora)
- Persistencia cloud (S3/DB).
- Etiquetado automático de `topic`, `intent`, `sentiment_trend` (dejaremos placeholders o heurística futura).

---

## Formato de Archivo y Esquema
- Carpeta: `dataset/` (crear si no existe).
- Un archivo por servicio: `dataset/{service_type}.jsonl` (ej.: `dataset/agent-resolutor.jsonl`).
- Formato: JSONL (una conversación por línea, facilita apéndice y procesamiento en lote).

### Esquema por conversación (MVP)
```json
{
  "conversation_id": "uuid",
  "service_type": "agent-resolutor",
  "finished_at": "2025-10-10T10:00:00.000Z",
  "resolution_status": "resuelto | no_response | max_turns",
  "metadata": {
    "topic": null,
    "intent": null,
    "sentiment_trend": null
  },
  "turns": [
    {
      "turn_id": 1,
      "role": "cliente",
      "timestamp": "2025-10-10T09:59:30.000Z",
      "content": "Hola, tengo un problema…",
      "action": null
    },
    {
      "turn_id": 2,
      "role": "agente",
      "timestamp": "2025-10-10T09:59:50.000Z",
      "content": "Claro, ¿podrías indicarme…?",
      "action": "solicitar_informacion"
    }
  ]
}
```

Notas:
- `role` en turns mapea `assistant → agente`, `user → cliente`.
- `timestamp`: si los mensajes no lo traen, generar ISO en el momento de construir el dataset (aprox.) o empezar a sellar cada mensaje al crearlo (futuro).
- `action`: opcional (dejamos `null` por ahora, o reglas simples futuras).

---

## Endpoint API
**Ruta**: `POST /api/save-dataset`

Responsabilidad: recibir el objeto de conversación y apendearlo en `dataset/{service_type}.jsonl`.

Request (JSON):
```json
{
  "service_type": "agent-resolutor",
  "conversation": { /* Objeto con el esquema anterior */ }
}
```

Validaciones mínimas:
- `service_type` string no vacío.
- `conversation` objeto con `conversation_id`, `resolution_status`, `turns` array.

Lógica:
1. Asegurar carpeta `dataset/` (`fs.mkdir` con `{ recursive: true }`).
2. Construir path `dataset/${service_type}.jsonl`.
3. `fs.appendFile(file, JSON.stringify(conversation) + "\n")`.
4. Responder 200/OK; en error → 500 con mensaje.

Consideraciones:
- En entornos serverless el FS es efímero (dev-only); documentar y luego migrar a S3/DB.

---

## Helpers de Archivo
Crear `src/lib/dataset.ts`:
- `ensureDir(dirPath: string): Promise<void>`
- `appendJsonl(filePath: string, obj: unknown): Promise<void>` → añade `"\n"` y valida que `JSON.stringify(obj)` sea no vacío.
- Funciones puras y simples para reuso.

---

## Integración en useAgentConversation
Archivo: `src/app/hooks/useAgentConversation.ts`

Dónde: al momento de `setConversationEnded(true)` (después de que el último mensaje del agente se agrega y antes de salir del flujo), construir el objeto de conversación y enviar al endpoint.

Pasos:
1) Construir `resolution_status` desde `StageInfo` del último mensaje del agente:
   - `isResolved === true` → `resuelto`.
   - `noResponse === true` → `no_response`.
   - Caso contrario si se cerró por límite de turnos → `max_turns`.

2) Construir `turns` a partir de `messages`:
   - Enumerar `turn_id` desde 1..
   - Mapear roles: `assistant → agente`, `user → cliente`.
   - `timestamp`: usar `new Date().toISOString()` (MVP) o adjuntar `createdAt` al crear cada mensaje (mejorable futuro).
   - `action`: por ahora `null` (luego reglas: `solicitar_informacion`, `proveer_informacion`, `escalar_caso`).

3) Construir `conversation`:
```ts
const conversation = {
  conversation_id: crypto.randomUUID(),
  service_type: initialServiceType,
  finished_at: new Date().toISOString(),
  resolution_status,
  metadata: { topic: null, intent: null, sentiment_trend: null },
  turns,
};
```

4) Enviar:
```ts
await fetch('/api/save-dataset', {
  method: 'POST',
  body: JSON.stringify({ service_type: initialServiceType, conversation }),
});
```

5) Tolerancia a fallos: `try/catch` + `console.error`; no bloquear UI.

---

## Configuración por ENV
- `DATASET_SAVE=on|off` (default: `on` en dev).
- `DATASET_DIR=dataset` (por defecto).
- `DATASET_MAX_FILE_SIZE_MB` (opcional futuro: rotación básica).

En el endpoint, leer `process.env.DATASET_SAVE` y `DATASET_DIR`.

---

## Casos de Prueba
1) Cierre por `resuelto`:
- Forzar flujo de resolución.
- Verificar línea en `dataset/agent-resolutor.jsonl` con `resolution_status: "resuelto"`.

2) Cierre por `no_response`:
- Usar feature ya implementada (probabilidad 1.0 en config del hook temporalmente).
- Verificar `resolution_status: "no_response"`.

3) Cierre por `max_turns`:
- Simular conversación larga hasta el límite.
- Verificar `resolution_status: "max_turns"`.

4) Robustez del archivo:
- Confirmar que cada línea es JSON válido.
- Probar lectura con `jq` o script simple.

---

## Checklist de Implementación
- [ ] Crear `src/lib/dataset.ts` con `ensureDir` y `appendJsonl`.
- [ ] Crear `src/app/api/save-dataset/route.ts` (API POST).
- [ ] Integrar en `useAgentConversation` (constructor de conversación + POST).
- [ ] Añadir `DATASET_SAVE` y `DATASET_DIR` a `.env.local` (documentar).
- [ ] Probar 3 escenarios (resuelto, no_response, max_turns).
- [ ] Verificar archivos generados en `dataset/`.
- [ ] Documentar `dataset/README.md` con ejemplo y advertencias de FS.

---

## Ejemplos JSONL (muestras)
```json
{"conversation_id":"conv_001","service_type":"agent-resolutor","finished_at":"2025-10-10T10:00:00.000Z","resolution_status":"escalado","metadata":{"topic":"producto_danado","intent":"reportar_problema","sentiment_trend":"negativo_a_neutro"},"turns":[{"turn_id":1,"role":"cliente","timestamp":"2025-10-10T09:59:30.000Z","content":"Hola, tengo un problema con mi pedido #12345.","action":null},{"turn_id":2,"role":"agente","timestamp":"2025-10-10T09:59:50.000Z","content":"Hola, claro que sí. ¿Podría describirme el problema?","action":"solicitar_informacion"}]}
{"conversation_id":"conv_002","service_type":"agent-resolutor","finished_at":"2025-10-10T11:02:00.000Z","resolution_status":"resuelto","metadata":{"topic":"reembolso","intent":"consultar_estado","sentiment_trend":"neutro_a_positivo"},"turns":[{"turn_id":1,"role":"cliente","timestamp":"2025-10-10T11:00:00.000Z","content":"Buenos días, quiero saber el estado de mi solicitud de reembolso.","action":null},{"turn_id":2,"role":"agente","timestamp":"2025-10-10T11:00:25.000Z","content":"Por supuesto, ¿me proporciona el número de solicitud?","action":"solicitar_informacion"},{"turn_id":3,"role":"cliente","timestamp":"2025-10-10T11:00:50.000Z","content":"Es el SR-9876.","action":null},{"turn_id":4,"role":"agente","timestamp":"2025-10-10T11:01:15.000Z","content":"Gracias. Veo que su reembolso fue aprobado y se procesará en las próximas 48 horas.","action":"proveer_informacion"}]}
```

---

## Notas y Riesgos
- FS local es efímero en serverless (Vercel) → esta exportación es para dev/local. Para prod usar S3/DB.
- Asegurar que `appendFile` se hace en modo texto y con `\n` al final.
- Validar que `service_type` solo contenga caracteres seguros para nombre de archivo.
- Evitar bloquear el hilo UI: envío al endpoint asíncrono y tolerante a error.

---

## Siguientes Pasos
- Implementar siguiendo el checklist.
- Evaluar añadir `createdAt` en cada `GameMessage` para timestamps precisos.
- (Futuro) Añadir enriquecimiento automático de `topic`, `intent`, `sentiment_trend` con un clasificador ligero.
