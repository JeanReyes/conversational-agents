
# 🧠 Resumen Completo — Vercel AI SDK (TypeScript)

> Basado en la documentación oficial de [ai-sdk.dev](https://ai-sdk.dev/docs)  
> Incluye `generateText`, `onStepFinish`, `stopWhen`, `toolChoice`, `Agents` y `MCP`.

---

## 🧩 1. Contexto general

El **AI SDK de Vercel** permite integrar modelos de lenguaje (OpenAI, Anthropic, Google, etc.) con:

- **Tool Calling** (funciones o herramientas con Zod)
- **Razonamiento en pasos** (*steps*)
- **Control de flujo y observabilidad** (`stopWhen`, `onStepFinish`)
- **Control de uso de herramientas** (`toolChoice`)
- **Soporte avanzado de agentes y MCP**

---

## ⚙️ 2. `generateText` — base del SDK

```ts
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const getWeather = tool({
  description: 'Get the weather for a given city',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 22 }),
});

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Weather in Santiago?',
  tools: { getWeather },
});

console.log(result.text);
```

**Resultados devueltos:**  
`text`, `steps`, `toolCalls`, `toolResults`

---

## 🧱 3. Qué es un *Step*

Un **step** es una **ronda interna de razonamiento** dentro de `generateText`.

```
prompt inicial
  ↓
step 1: modelo llama tool(s) → SDK ejecuta → devuelve resultados
  ↓
step 2: modelo usa resultados → genera nueva acción o texto
  ↓
step n: modelo entrega respuesta final
```

- El modelo decide los pasos.
- El SDK repite el ciclo hasta que:
  - No hay más tool calls, o
  - Se cumple `stopWhen`.

---

## 🧭 4. Control de Steps

### 🔹 `stopWhen`
Limita el número máximo de pasos.

```ts
import { stepCountIs } from 'ai';

await generateText({
  model: openai('gpt-4o'),
  tools: { getWeather },
  prompt: 'Weather in Santiago and convert to °F',
  stopWhen: stepCountIs(5),
});
```

---

### 🔹 `onStepFinish`
Callback que se ejecuta al final de cada step.

```ts
await generateText({
  model: openai('gpt-4o'),
  tools: { getWeather },
  prompt: 'Weather in Santiago?',
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    console.log({ text, toolCalls, toolResults, finishReason, usage });
  },
});
```

Campos disponibles:  
`text`, `toolCalls`, `toolResults`, `finishReason`, `usage`

---

## 🧠 5. Inferencia de Steps

- Los *steps* **no se definen manualmente**, los **infiera el modelo**.  
- El desarrollador **controla el entorno**:
  - Qué tools existen.
  - Límites con `stopWhen`.
  - Control del flujo con `toolChoice`.
  - Observación con `onStepFinish`.

**Analogía:** Tú defines el terreno (tools y límites), el modelo elige el camino (steps).

---

## ⚒️ 6. Tool Calling

Las herramientas se definen con `tool()` y `Zod`:

```ts
import { tool } from 'ai';
import { z } from 'zod';

const convertCurrency = tool({
  description: 'Convert USD to CLP',
  parameters: z.object({ amount: z.number() }),
  execute: async ({ amount }) => ({ clp: amount * 950 }),
});
```

Luego se pasan en `tools` dentro de `generateText()`.

---

## 🎛️ 7. `toolChoice` — control de herramientas

| Valor | Descripción |
|--------|--------------|
| `'auto'` | El modelo decide si usa tools (default). |
| `'required'` | Debe usar alguna tool. |
| `'none'` | Prohíbe herramientas. |
| `{ type: 'tool', toolName: 'miTool' }` | Obliga a usar una tool específica. |

### Ejemplos

```ts
// AUTO
await generateText({ model: openai('gpt-4o'), tools: { getWeather }, toolChoice: 'auto' });

// REQUIRED
await generateText({ model: openai('gpt-4o'), tools: { getWeather }, toolChoice: 'required' });

// NONE
await generateText({ model: openai('gpt-4o'), tools: { getWeather }, toolChoice: 'none' });

// TOOL ESPECÍFICA
await generateText({
  model: openai('gpt-4o'),
  tools: { getWeather },
  toolChoice: { type: 'tool', toolName: 'getWeather' },
});
```

---

## 🧩 8. Ejemplo completo con Steps

```ts
import { z } from 'zod';
import { generateText, tool, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';

const weatherF = tool({
  description: 'Get weather in Fahrenheit',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, fahrenheit: 72 }),
});

const toCelsius = tool({
  description: 'Convert °F to °C',
  parameters: z.object({ fahrenheit: z.number() }),
  execute: async ({ fahrenheit }) => ({ celsius: Math.round((fahrenheit - 32) * 5 / 9) }),
});

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { weatherF, toCelsius },
  prompt: 'Weather in Santiago in °C?',
  stopWhen: stepCountIs(5),
  toolChoice: 'auto',
  onStepFinish({ text, toolCalls, toolResults }) {
    console.log({ text, toolCalls, toolResults });
  },
});

console.log(result.text);
```

**Resultado esperado:**
1. Step 1 → llama `weatherF`
2. Step 2 → llama `toCelsius`
3. Step 3 → genera respuesta final

---

## 🌐 9. MCP (Model Context Protocol)

Permite usar herramientas **externas** a través de un servidor.

```ts
import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';

const client = await experimental_createMCPClient({
  transport: new Experimental_StdioMCPTransport({
    command: 'node',
    args: ['server.js'],
  }),
});

const mcpTools = await client.tools();
await generateText({ model: openai('gpt-4o'), tools: { ...mcpTools } });
```

**Usos típicos:**  
✔ Integrar servicios externos (Python, Go, etc.)  
✔ Separar lógica pesada en otro proceso  
✔ Reutilizar catálogos de herramientas  

---

## 🤖 10. Agents vs `generateText`

| Aspecto | `generateText` + tools | Agents |
|----------|------------------------|---------|
| Nivel de control | Bajo / medio | Alto (loop + memoria) |
| Estado | No persistente | Con contexto |
| Ideal para | Tareas puntuales | Conversaciones largas |
| Configuración | Manual | Automática |
| API | Funcional | Orientada a objetos |

**Ejemplo con Agent:**

```ts
import { Experimental_Agent as Agent, stepCountIs } from 'ai';

const agent = new Agent({
  model: 'openai/gpt-4o',
  tools: { getWeather },
  stopWhen: stepCountIs(10),
});

const res = await agent.generate({ prompt: 'Weather in Santiago?' });
console.log(res.text);
```

---

## ✅ 11. Buenas prácticas

| Recomendación | Motivo |
|----------------|--------|
| Usa pocas tools al inicio | Reduce ambigüedad |
| Describe tools con detalle | Mejora precisión del modelo |
| Usa `stopWhen` | Evita loops infinitos |
| Observa `onStepFinish` | Facilita debug y métricas |
| Usa `toolChoice: 'required'` | Garantiza tool-calls reales |
| `toolChoice: { type:'tool' }` | Para secuencias deterministas |
| Mira `result.steps` | Contiene todo el historial |

---

## 📘 12. Esquema final

```
generateText()
 ├─ Step 1: toolCall → execute → toolResult
 ├─ Step 2: usa result → nuevo step
 ├─ Step 3: texto final
 └─ stopWhen o sin toolCalls → termina
```

| Concepto | Propósito | Ejemplo |
|-----------|------------|---------|
| **Step** | Iteración interna | `stopWhen: stepCountIs(3)` |
| **onStepFinish** | Log de pasos | `{ text, toolCalls }` |
| **toolChoice** | Controla herramientas | `'auto'`, `'required'`, `'none'` |
| **MCP** | Integrar tools externas | `experimental_createMCPClient()` |
| **Agents** | Framework superior | `new Agent({ model, tools })` |

---

## 🧭 13. Conclusión

- Los **steps** los **infiera el modelo**; tú defines límites (`stopWhen`) y observas (`onStepFinish`).
- **`toolChoice`** controla cuándo y qué herramientas puede usar el modelo.
- **MCP** permite integrar herramientas externas y seguras.
- **Agents** extiende `generateText` con planificación, estado y memoria.
- **`generateText`** sigue siendo la base ideal para agentes conversacionales controlados.

---

**Autor:** ChatGPT (GPT‑5)  
**Tema:** Comprensión avanzada del AI SDK de Vercel  
**Lenguaje:** TypeScript
