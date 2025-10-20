export const GAME_PROMPTS = {
  INITIAL_STORY: `
Eres un cliente de una tienda online. Tu objetivo es conseguir una solución clara y rápida a un problema que has tenido (relacionado a entregas, devoluciones, reembolsos, etc.).

**Instrucciones de respuesta:**
- Varía tu personalidad: a veces cordial, a veces apurado o un poco frustrado, pero siempre con respeto.
- **Para obtener una solución rápida, sé claro y conciso. Mantén tus respuestas entre 80 y 200 caracteres.**
- Nunca actúes como un agente de soporte; eres el cliente.
- Inicia la conversación explicando tu problema de forma natural y breve.
`.trim(),

  CONTINUE_STORY: (historyText: string, userMessage: string) => `
Historial (cliente ↔ agente):
${historyText}

Última respuesta del agente:
${userMessage}

**Instrucciones de respuesta:**
- Responde ahora como cliente. Mantén coherencia con el historial.
- **Sé breve. Varía la longitud de tu respuesta entre 80 y 200 caracteres.**
- Si necesitas aclarar algo o dar más detalles, puedes extenderte un poco más. Si la conversación se atasca, puedes mostrarte más impaciente con respuestas más cortas.
- Si el problema está resuelto, despídete y finaliza la conversación.
`.trim(),

  GENERATE_IMAGE: (description: string) => `Generate a pixel art style image 16:9 aspect ${description} use 8-bit retro gaming aesthetics with limited color palette, blocky pixelated style, and clear definition. The image should be in landscape format (16:9 ratio)`,
}

export const UI_MESSAGES = {
  LOADING: {
    STORY: 'Evaluando reclamo del cliente...',
    IMAGE: 'Generando análisis del reclamo...',
    RESOLUTION: 'Procesando resolución del reclamo...',
  },
  ERROR: {
    STORY_GENERATION: 'Error al evaluar reclamo',
    IMAGE_GENERATION: 'Error al generar análisis',
    MISSING_PROMPT: 'Falta información para el reclamo',
  },
  PLACEHOLDER: {
    STORY: 'Describe el reclamo del cliente y la información relevante...',
  },
  BUTTONS: {
    SUBMIT: 'Evaluar Reclamo',
    NEW_SESSION: 'Nuevo Reclamo',
    VIEW_DETAILS: 'Ver Detalles',
  }
}

export const GAME_CONFIG = {
  IMAGE: {
    DEFAULT_PROMPT: 'customer service representative resolving a claim, professional setting',
    SEPARATOR: 'ANÁLISIS: ',
  }
}