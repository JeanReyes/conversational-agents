# Dataset de Conversaciones

Este directorio contiene los datasets generados automáticamente de las conversaciones entre agentes de IA.

## Formato

Los archivos están en formato **JSONL** (JSON Lines), donde cada línea representa una conversación completa.

### Archivos por Servicio

Cada tipo de servicio tiene su propio archivo:

- `agent-resolutor.jsonl`: Conversaciones del agente resolutor con diferentes tipos de clientes
- Futuros archivos para otros servicios...

## Esquema de Conversación

Cada línea en el archivo JSONL contiene un objeto JSON con esta estructura:

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
      "content": "Hola, tengo un problema...",
      "action": null
    },
    {
      "turn_id": 2,
      "role": "agente",
      "timestamp": "2025-10-10T09:59:50.000Z",
      "content": "Claro, ¿podrías indicarme...?",
      "action": null
    }
  ]
}
```

## Campos Principales

### Conversación

- **`conversation_id`** (string): Identificador único de la conversación (UUID)
- **`service_type`** (string): Tipo de servicio/agente (ej: "agent-resolutor")
- **`finished_at`** (string): Timestamp ISO 8601 de cuando finalizó la conversación
- **`resolution_status`** (string): Estado de resolución:
  - `resuelto`: El problema del cliente fue resuelto satisfactoriamente
  - `no_response`: El cliente dejó de responder (timeout)
  - `max_turns`: Se alcanzó el límite máximo de turnos
- **`metadata`** (object): Metadatos adicionales (actualmente con valores null, para uso futuro)

### Turns (Turnos)

- **`turn_id`** (number): Número de turno secuencial (comienza en 1)
- **`role`** (string): Rol del participante:
  - `cliente`: Mensajes del agente que simula ser cliente
  - `agente`: Mensajes del agente resolutor
- **`timestamp`** (string): Timestamp ISO 8601 del turno
- **`content`** (string): Contenido del mensaje
- **`action`** (string | null): Acción realizada (actualmente null, para uso futuro)

## Uso de los Archivos

### Lectura con jq

Puedes usar `jq` para analizar los archivos:

```bash
# Contar conversaciones
cat agent-resolutor.jsonl | wc -l

# Ver la primera conversación formateada
head -n 1 agent-resolutor.jsonl | jq

# Filtrar por resolution_status
jq 'select(.resolution_status == "resuelto")' agent-resolutor.jsonl

# Estadísticas de turnos
jq '.turns | length' agent-resolutor.jsonl | awk '{sum+=$1} END {print "Promedio de turnos:", sum/NR}'
```

### Lectura con Python

```python
import json

conversations = []
with open('dataset/agent-resolutor.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        conversations.append(json.loads(line))

print(f"Total de conversaciones: {len(conversations)}")

# Estadísticas
resueltas = sum(1 for c in conversations if c['resolution_status'] == 'resuelto')
print(f"Conversaciones resueltas: {resueltas} ({resueltas/len(conversations)*100:.1f}%)")
```

### Lectura con Node.js

```javascript
import { readJsonl } from '@/lib/dataset';

const conversations = await readJsonl('dataset/agent-resolutor.jsonl');
console.log(`Total: ${conversations.length} conversaciones`);
```

## Configuración

El guardado de datasets se controla con variables de entorno en `.env.local`:

```env
# Habilitar/deshabilitar guardado de datasets (default: on)
DATASET_SAVE=on

# Directorio donde se guardan los datasets (default: dataset)
DATASET_DIR=dataset
```

## Notas Importantes

⚠️ **Entornos Serverless**: En plataformas como Vercel, el filesystem es efímero. Estos archivos se generan correctamente en desarrollo local, pero en producción deberías usar una solución de almacenamiento persistente (S3, base de datos, etc.).

📊 **Uso Recomendado**: Estos datasets son ideales para:
- Análisis de calidad de conversaciones
- Entrenamiento de modelos de lenguaje
- Métricas de desempeño del agente
- Testing y validación de prompts

## Ejemplo de Conversación Completa

```json
{"conversation_id":"550e8400-e29b-41d4-a716-446655440000","service_type":"agent-resolutor","finished_at":"2025-10-10T10:00:00.000Z","resolution_status":"resuelto","metadata":{"topic":null,"intent":null,"sentiment_trend":null},"turns":[{"turn_id":1,"role":"agente","timestamp":"2025-10-10T09:59:00.000Z","content":"Hola, bienvenido a nuestro servicio de soporte. ¿En qué puedo ayudarte hoy?","action":null},{"turn_id":2,"role":"cliente","timestamp":"2025-10-10T09:59:30.000Z","content":"Hola, tengo un problema con mi pedido #12345. El producto llegó dañado.","action":null},{"turn_id":3,"role":"agente","timestamp":"2025-10-10T09:59:50.000Z","content":"Lamento mucho escuchar eso. Voy a ayudarte a resolverlo. ¿Podrías proporcionarme tu correo electrónico para buscar tu pedido?","action":null},{"turn_id":4,"role":"cliente","timestamp":"2025-10-10T10:00:10.000Z","content":"Claro, es cliente@email.com","action":null},{"turn_id":5,"role":"agente","timestamp":"2025-10-10T10:00:30.000Z","content":"Perfecto, he encontrado tu pedido. Voy a procesar un reembolso completo y enviaremos un reemplazo sin costo adicional. El reembolso se procesará en 3-5 días hábiles. ¿Hay algo más en lo que pueda ayudarte?","action":null},{"turn_id":6,"role":"cliente","timestamp":"2025-10-10T10:00:50.000Z","content":"No, eso es todo. Muchas gracias por la ayuda.","action":null},{"turn_id":7,"role":"agente","timestamp":"2025-10-10T10:01:00.000Z","content":"¡De nada! Me alegra haber podido ayudarte. Si necesitas algo más en el futuro, no dudes en contactarnos. ¡Que tengas un excelente día!","action":null}]}
```

---

_Generado automáticamente por el sistema de agentes de IA - game-ia_

