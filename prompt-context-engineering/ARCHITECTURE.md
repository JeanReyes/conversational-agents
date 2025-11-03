# Arquitectura del Proyecto `game-ia`

Este documento detalla la arquitectura del proyecto `game-ia`, centrándose en la estructura de carpetas, la arquitectura de componentes de UI y la lógica de negocio del sistema de agentes de IA.

## 1. Arquitectura de Carpetas en `src`

El directorio `src` es el corazón de la aplicación y se organiza de la siguiente manera:

-   **`src/app`**: Contiene los archivos de la aplicación Next.js, incluyendo rutas, componentes específicos de la aplicación, hooks y la API.
    -   **`src/app/[serviceType]`**: Rutas dinámicas para diferentes tipos de servicios, cada uno con su `layout.tsx` y `page.tsx`.
    -   **`src/app/api`**: Endpoints de la API para la comunicación con los modelos de IA.
        -   **`src/app/api/generate-image`**: Endpoint para la generación de imágenes utilizando IA.
        -   **`src/app/api/generate-story`**: Endpoint para la generación de historias/conversaciones con IA.
    -   **`src/app/components`**: Componentes de UI específicos de la aplicación, como `game-input.tsx`, `game-loader.tsx`, `game-message.tsx` y `ServiceHeader.tsx`.
    -   **`src/app/hooks`**: Hooks personalizados para la lógica de la UI, como `useAgentConversation.ts` y `useGame.ts`.
    -   Otros archivos como `favicon.ico`, `globals.css`, `layout.tsx` y `page.tsx` para la configuración global de la aplicación.

-   **`src/components`**: Contiene componentes de UI reutilizables y genéricos, divididos en dos categorías principales:
    -   **`src/components/ai-elements`**: Componentes de UI diseñados específicamente para interactuar y mostrar elementos relacionados con la IA, como `actions.tsx`, `artifact.tsx`, `conversation.tsx`, `image.tsx`, `message.tsx`, `prompt-input.tsx` y `response.tsx`. Estos componentes forman la base visual para las interacciones con los agentes de IA.
    -   **`src/components/ui`**: Componentes de UI genéricos y de bajo nivel (un "design system" o "librería de componentes" básica), como `avatar.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx` y `tooltip.tsx`. Estos componentes son la base para construir elementos de UI más complejos y específicos.
    -   **`GameInterface.tsx`**: El componente principal que orquesta la interacción del usuario con los diferentes servicios de juego o agentes. Decide qué interfaz renderizar basándose en el `serviceType`.
    -   **`ServiceSelector.tsx`**: Componente que permite al usuario seleccionar entre los diferentes servicios de IA disponibles.

-   **`src/lib`**: Contiene la lógica de negocio central, utilidades, contextos y la definición de los servicios de IA.
    -   **`src/lib/game-context.tsx`**: Contexto de React para gestionar el estado global del juego o la conversación.
    -   **`src/lib/service-factory.ts`**: Fábrica para cargar dinámicamente los diferentes servicios de agentes de IA, gestionando sus constantes, configuraciones y prompts.
    -   **`src/lib/services`**: Directorio que contiene las definiciones y lógica específica para cada tipo de agente de IA.
        -   Cada subdirectorio (ej. `agent-resolutor`, `game-zombie`) contiene:
            -   **`constant.ts`**: Definiciones de mensajes UI, configuraciones específicas del juego/agente (como `IMAGE.DEFAULT_PROMPT`, `IMAGE.SEPARATOR`).
            -   **`prompt.ts`**: Plantillas de prompts utilizadas para interactuar con los modelos de IA (ej. `INITIAL_STORY`, `CONTINUE_STORY`, `GENERATE_IMAGE`).
    -   **`src/lib/shared-conversation-context.tsx`**: Contexto compartido para la gestión de la conversación.
    -   **`src/lib/types.ts`**: Definiciones de tipos TypeScript para todo el proyecto.
    -   **`src/lib/utils.ts`**: Funciones de utilidad generales.

## 2. Arquitectura de Componentes UI

La arquitectura de componentes UI sigue un enfoque modular, con una clara separación entre componentes específicos de la aplicación y componentes reutilizables/genéricos.

-   **Componentes de Aplicación (`src/app/components`)**:
    -   **`GameInput`**: Gestiona la entrada del usuario, utilizando `PromptInput` de `ai-elements`. Se encarga de la captura de texto y el envío de acciones al backend. Está diseñado para ser deshabilitado durante el procesamiento para evitar entradas duplicadas.
    -   **`GameLoader`**: Muestra un indicador de carga, utilizando `Loader` y `Message` de `ai-elements`. Se utiliza para indicar que la IA está procesando una respuesta.
    -   **`GameMessage`**: Renderiza los mensajes de la conversación, incluyendo texto e imágenes generadas. Utiliza componentes como `Image`, `Loader`, `Message` y `Response` de `ai-elements`. Maneja la visualización de imágenes y el estado de carga de las mismas.
    -   **`ServiceHeader`**: Muestra el título del servicio actual y proporciona una opción para cambiar de experiencia. Utiliza `next/navigation` para la navegación.

-   **Componentes Reutilizables/Genéricos (`src/components`)**:
    -   **`ai-elements`**: Colección de componentes de UI de alto nivel diseñados para construir interfaces de conversación con IA. Estos incluyen:
        -   `Conversation`, `ConversationContent`, `ConversationScrollButton`: Para estructurar y gestionar la visualización de la conversación.
        -   `Message`, `MessageContent`, `MessageAvatar`: Para la representación individual de mensajes, incluyendo avatares y contenido.
        -   `Image`, `Loader`, `PromptInput`, `Response`: Elementos visuales y de interacción fundamentales para las experiencias de IA.
    -   **`ui`**: Componentes básicos y sin estado (primitivas de UI) que forman la base del sistema de diseño, como `Button`, `Input`, `Textarea`, `Avatar`, etc. Estos componentes se basan en `@radix-ui/react-slot` y `class-variance-authority` para la personalización de variantes y estilos con Tailwind CSS.
    -   **`GameInterface`**: El componente principal que actúa como un contenedor inteligente. Utiliza hooks como `useGame` y `useAgentConversation` para gestionar la lógica del estado y decidir qué interfaz específica (interactiva o de conversación de agente) renderizar basándose en el `serviceType` del contexto.
    -   **`ServiceSelector`**: Permite al usuario elegir entre los diferentes servicios de IA disponibles, navegando a la ruta correspondiente.

La interacción entre estos componentes se basa en un flujo de datos claro, donde los componentes de aplicación utilizan los componentes genéricos y de `ai-elements` para construir la interfaz específica de la experiencia, mientras que `GameInterface` orquesta la lógica de alto nivel y la selección de la experiencia.

## 3. Lógica de Negocio del Sistema de Agentes de IA

La lógica de negocio se centra en la definición, carga y exposición de los diferentes agentes de IA, así como en la gestión de sus configuraciones y prompts.

-   **Definición de Servicios de Agentes (`src/lib/services`)**:
    -   Cada subdirectorio dentro de `src/lib/services` representa un tipo de agente de IA (ej., `game-zombie`, `agent-resolutor`, `business-strategy`, `client-claim`, `desperate-client`, `angry-client`).
    -   **`constant.ts`**: Almacena mensajes específicos de la UI (ej. mensajes de carga, errores, placeholders) y configuraciones relacionadas con el juego/agente, como `GAME_CONFIG.IMAGE.DEFAULT_PROMPT` y `GAME_CONFIG.IMAGE.SEPARATOR`.
    -   **`prompt.ts`**: Contiene las plantillas de prompts (`GAME_PROMPTS.INITIAL_STORY`, `GAME_PROMPTS.CONTINUE_STORY`, `GAME_PROMPTS.GENERATE_IMAGE`) que se utilizan para interactuar con los modelos de IA. Estas plantillas están diseñadas para guiar el comportamiento de la IA en cada servicio.

-   **Fábrica de Servicios (`src/lib/service-factory.ts`)**:
    -   La clase `ServiceFactory` es responsable de la carga dinámica y la instanciación de los servicios de agentes de IA.
    -   Utiliza un patrón Singleton para almacenar los servicios ya cargados, evitando recargas innecesarias.
    -   El método `getService(serviceType: ServiceType)` importa y ensambla los `constants` y `prompts` para el `serviceType` solicitado.
    -   El método `getAvailableServices()` proporciona una lista de los servicios disponibles junto con sus metadatos (id, nombre, descripción).

-   **Endpoints de la API (`src/app/api`)**:
    -   **`src/app/api/generate-image/route.ts`**: Este endpoint recibe un `imagePrompt` y lo utiliza para generar una imagen a través del modelo `gemini-2.5-flash-image-preview` de Google. La respuesta incluye la imagen generada.
    -   **`src/app/api/generate-story/route.ts`**: Este endpoint es el motor conversacional. Recibe el mensaje del usuario, el historial de la conversación, un indicador de inicio de conversación (`isStart`) y el `serviceType`.
        -   Carga dinámicamente el servicio de IA correspondiente utilizando `ServiceFactory.getService(serviceType)`.
        -   Construye el prompt adecuado (`INITIAL_STORY` o `CONTINUE_STORY`) basado en `isStart` y el historial de conversación.
        -   Interactúa con el modelo `gemini-2.5-flash-lite` de Google para generar la narrativa.
        -   Analiza la respuesta de la IA para separar la narrativa principal del prompt de imagen (utilizando `service.config.IMAGE.SEPARATOR`).
        -   Devuelve la narrativa y el prompt de imagen para su procesamiento posterior.

-   **Configuraciones de Flujo (`flow-configs`)**:
    -   La carpeta `flow-configs` contiene archivos JSON (ej., `zombie-game-config.json`, `angry-client-config.json`) que definen las configuraciones detalladas para cada flujo de agente.
    -   Estos archivos centralizan metadatos (`id`, `name`, `description`, `version`), configuraciones temáticas (`genre`, `setting`, `tone`, `artStyle`), configuraciones de juego (`image`, `session`), mensajes de UI específicos (`uiMessages`), prompts directos (`prompts`), configuraciones de métricas (`metrics`), modelos de IA (`aiModels`), y la habilitación de características (`features`, `customComponents`).
    -   Aunque actualmente los prompts y UI_MESSAGES también se encuentran en los archivos `constant.ts` y `prompt.ts` de cada servicio, estos archivos JSON ofrecen un lugar centralizado para una configuración más granular y específica de cada flujo, lo que podría permitir una mayor flexibilidad y personalización sin cambios de código directos en el futuro.

### Uso Especial: `useAgentConversation.ts` (Conversación entre IAs)

El hook `useAgentConversation.ts` es un componente clave en la lógica de negocio, ya que habilita una experiencia conversacional única donde dos agentes de IA interactúan entre sí. Este hook simula un diálogo autónomo, permitiendo explorar dinámicas conversacionales sin intervención humana directa.

-   **Roles de los Agentes**:
    -   **Agente Primario (`initialServiceType`)**: Un agente configurado inicialmente (ej., `'agent-resolutor'`) que actúa como el iniciador y el agente principal en la conversación (p.ej., un agente de soporte al cliente).
    -   **Agente Cliente (`selectedClient`)**: Un agente secundario, seleccionado aleatoriamente de un conjunto predefinido (`CLIENT_TYPES`: `'client-claim'`, `'desperate-client'`, `'angry-client'`). Este agente simula ser el "cliente" con una personalidad o un estado emocional específico (p.ej., un cliente enojado o desesperado).

-   **Interacción por Turnos**:
    -   La conversación se desarrolla en turnos. El agente primario comienza el diálogo.
    -   Posteriormente, el `currentTurnService` alterna entre el agente primario (`'agent-resolutor'`) y el agente cliente (`selectedClient`). Esto simula una conversación fluida donde cada IA responde al último mensaje del otro.
    -   Esta alternancia permite modelar escenarios de interacción complejos, como un agente de soporte intentando calmar a un cliente furioso, o un agente de estrategia de negocio debatiendo con un agente financiero.

-   **Flujo de Mensajes y Roles**:
    -   Los mensajes generados por el agente primario suelen tener el rol de `"assistant"`.
    -   Los mensajes generados por el agente cliente, aunque también son producidos por una IA, se etiquetan con el rol de `"user"`. Esta distinción es fundamental para mantener la semántica de la conversación simulada y es útil para un posterior análisis de los diálogos.

-   **Simulación de "Pensamiento"**:
    -   Para hacer la interacción más realista, se introduce un retraso (`setTimeout`) entre las respuestas de los agentes de IA. Esto simula un tiempo de procesamiento o "pensamiento" humano, mejorando la inmersión en la simulación.

### Sistema de Etapas de Conversación y Finalización Dinámica

El sistema ha evolucionado para incluir un sofisticado mecanismo de gestión conversacional que simula interacciones humanas realistas, implementando etapas estructuradas y capacidades de finalización inteligente.

#### Etapas de Conversación (ConversationStage)

El sistema define tres etapas principales que estructuran el flujo de cada conversación:

1.  **OPENING (Inicio)**:
    -   **Propósito**: Establecer el contacto inicial y crear un ambiente acogedor.
    -   **Duración**: Típicamente 1 turno (el primer mensaje del agente).
    -   **Características**:
        -   Saludo profesional y empático.
        -   Pregunta abierta para identificar el problema del cliente.
        -   No se solicita información detallada todavía.
    -   **Ejemplo**: "Hola, bienvenido a nuestro servicio de soporte. ¿En qué puedo ayudarte hoy?"

2.  **DEVELOPMENT (Desarrollo)**:
    -   **Propósito**: Recopilar información, gestionar emociones y resolver el problema del cliente.
    -   **Duración**: Variable (2-10 turnos, dependiendo de la complejidad del problema y estado emocional del cliente).
    -   **Características**:
        -   **Análisis emocional**: Detección y validación del estado emocional del cliente (enojo, desesperación, frustración, satisfacción).
        -   **Recopilación de información**: Obtención de datos necesarios (número de orden, email, detalles del problema).
        -   **Ofrecimiento de soluciones**: Propuestas concretas y específicas basadas en el tipo de problema.
        -   **Adaptación dinámica**: El agente ajusta su tono y enfoque según el comportamiento del cliente.
    -   **Sub-procesos implícitos** (manejados por el prompt, no por código):
        -   Calmar al cliente si está alterado emocionalmente.
        -   Solicitar información faltante de forma clara y específica.
        -   Validar la comprensión del problema.
        -   Resolver el problema con soluciones realistas y proporcionales.

3.  **CLOSING (Cierre)**:
    -   **Propósito**: Confirmar la resolución y despedirse profesionalmente.
    -   **Duración**: 1-2 turnos.
    -   **Características**:
        -   Resumen de la solución aplicada.
        -   Confirmación de satisfacción del cliente.
        -   Despedida cálida y profesional.
        -   Dejar la puerta abierta para futuros contactos.
    -   **Señales de finalización**:
        -   `[STATUS: RESOLVED]`: Cuando el problema se resuelve satisfactoriamente.
        -   `[STATUS: NO_RESPONSE]`: Cuando el cliente no responde (ver siguiente sección).

#### StageHelper: Gestión Centralizada de Etapas

La clase `StageHelper` (`src/lib/config-agents/agent-resolutor/stage-helper.ts`) proporciona métodos estáticos para gestionar las transiciones y el estado de las etapas:

-   **`determineStage(turnNumber, agentResponse, previousWasClosing)`**: Determina la etapa actual basándose en el número de turno, el contenido de la respuesta del agente y el estado previo.
-   **`cleanResponse(response)`**: Elimina las señales de control (`[STATUS: RESOLVED]`, `[STATUS: NO_RESPONSE]`) del contenido visible al usuario.
-   **`markAsNoResponse(currentStageInfo)`**: Marca una conversación como terminada por falta de respuesta del cliente.
-   **`shouldEndConversation(stageInfo, maxTurns)`**: Evalúa si la conversación debe finalizar basándose en:
    -   Presencia de la señal `[STATUS: RESOLVED]`.
    -   Cliente marcado como no disponible (`noResponse: true`).
    -   Alcance del límite máximo de turnos (por defecto 12).

#### Finalización Dinámica de Conversaciones

El sistema permite que las conversaciones terminen de forma natural y dinámica, eliminando el límite fijo de turnos y dotando al agente de autonomía para decidir cuándo cerrar:

-   **Cierre por Resolución Exitosa**: El agente detecta que el cliente está satisfecho (keywords: "gracias", "perfecto", "ok") y cierra la conversación con un mensaje de despedida profesional, marcando `[STATUS: RESOLVED]`.

-   **Cierre por No-Respuesta del Cliente**: Implementación de un sistema realista que simula escenarios donde el cliente deja de responder.

-   **Límite de Seguridad**: Un límite máximo configurable (por defecto 12 turnos) previene conversaciones infinitas en caso de fallos.

#### Sistema de Simulación de No-Respuesta (NoResponseConfig)

Una característica innovadora que añade realismo al simular clientes que, por diversas razones, dejan de responder durante la conversación:

**Configuración (`DEFAULT_NO_RESPONSE_CONFIG` en `src/lib/types.ts`)**:
```typescript
{
  enabled: true,                  // Activar/desactivar la funcionalidad
  probability: 0.20,              // 20% de probabilidad de no-respuesta
  minTurnsBeforeApply: 3,        // Solo aplicar después del turno 3
  timeoutDuration: 2000,         // 2 segundos de espera antes de cerrar
  maxTurnsToApply: 10            // No aplicar después del turno 10
}
```

**Flujo de No-Respuesta**:

1.  **Detección del Turno del Cliente**: Después de que el agente responde, el sistema identifica que es el turno del cliente.

2.  **Evaluación Aleatoria** (solo si se cumplen las condiciones):
    -   **Condiciones previas**:
        -   `enabled` es `true`.
        -   El turno actual es >= `minTurnsBeforeApply`.
        -   El turno actual es <= `maxTurnsToApply` (si está configurado).
    -   **Decisión aleatoria**: `Math.random()` se compara con `probability`. Si el valor es menor, el cliente no responderá.

3.  **Timeout y Señal al Agente**: Si se decide que el cliente no responde:
    -   Se activa un timeout (`timeoutDuration`) para simular una espera realista.
    -   Se envía una señal especial al agente: `"[CLIENTE NO RESPONDIÓ - TIMEOUT]"`.

4.  **Respuesta Profesional del Agente**: El agente, al detectar la señal, genera un mensaje de cierre empático y profesional:
    -   Reconoce la falta de respuesta.
    -   Resume lo logrado hasta el momento.
    -   Deja la puerta abierta para futuros contactos.
    -   Marca la conversación con `[STATUS: NO_RESPONSE]`.

5.  **Finalización de la Conversación**: El sistema marca `conversationEnded = true` y detiene el loop de turnos.

**Beneficios del Sistema de No-Respuesta**:
-   **Mayor Realismo**: Simula comportamientos humanos reales (clientes que se desconectan, están ocupados, o pierden interés).
-   **Prueba de Resiliencia**: Evalúa cómo el agente maneja interrupciones inesperadas.
-   **Variabilidad en Datasets**: Genera conversaciones con diferentes tipos de cierres, enriqueciendo los datos para entrenamiento de modelos.
-   **Profesionalismo**: Demuestra que el agente puede manejar situaciones ambiguas con cortesía y profesionalismo.

**Implementación Técnica**:
-   **`shouldSimulateNoResponse(turnNumber)`** (en `useAgentConversation`): Evalúa las condiciones y decide aleatoriamente si el cliente responderá.
-   **`handleNoResponse(history)`** (en `useAgentConversation`): Gestiona el timeout, la generación del mensaje de cierre del agente y la actualización del estado de la conversación.
-   **Feedback Visual**: Un banner amarillo en la UI (`waitingForNoResponse`) indica al observador que el sistema está esperando antes de cerrar por no-respuesta.

#### Metadata de Etapas (StageInfo)

Cada mensaje del agente incluye metadata rica (`stageInfo`) que describe el estado de la conversación:

```typescript
interface StageInfo {
  stage: ConversationStage;      // OPENING, DEVELOPMENT, CLOSING
  turnNumber: number;             // Número de turno actual
  isResolved: boolean;            // true si se resolvió exitosamente
  noResponse?: boolean;           // true si el cliente no respondió
}
```

Esta metadata permite:
-   **Análisis Post-Conversación**: Evaluar la duración, la efectividad y el tipo de cierre de cada conversación.
-   **Debugging y Logging**: Rastrear el flujo conversacional en la consola del navegador.
-   **Métricas de Calidad**: Generar estadísticas sobre promedios de turnos, tasas de resolución exitosa, y frecuencia de no-respuestas.

#### Prompts Específicos por Etapa

Los prompts para el `agent-resolutor` (`src/lib/config-agents/agent-resolutor/prompt.ts`) están estructurados para guiar al agente a través de las etapas:

-   **`INITIAL_STORY`**: Instrucciones concisas para la etapa de OPENING.
-   **`CONTINUE_STORY`**: Instrucciones detalladas para DEVELOPMENT y CLOSING, incluyendo:
    -   Pasos numerados para diferentes escenarios (cliente enojado, información faltante, ofrecimiento de solución, confirmación de satisfacción, no-respuesta).
    -   Matriz de soluciones realistas según el tipo de problema.
    -   Ejemplos de respuestas apropiadas.
    -   Instrucciones claras sobre cuándo usar `[STATUS: RESOLVED]` y `[STATUS: NO_RESPONSE]`.

#### Ventajas de Este Sistema

1.  **Conversaciones más Naturales y Humanas**: Al eliminar el límite fijo de turnos y permitir finalizaciones dinámicas, las interacciones simuladas se asemejan más a conversaciones reales.

2.  **Mejora en la Calidad de Datos**: Los datasets generados incluyen una variedad más rica de interacciones, incluyendo cierres exitosos, no-respuestas, y conversaciones de diferentes longitudes.

3.  **Evaluación de Competencias del Agente**: Permite medir la capacidad del agente para:
    -   Identificar cuándo un problema está resuelto.
    -   Manejar interrupciones y ausencias del cliente.
    -   Mantener profesionalismo en situaciones inciertas.

4.  **Escalabilidad para Otros Agentes**: El sistema de etapas y finalización dinámica es extensible a otros tipos de agentes más allá del `agent-resolutor`, permitiendo modelar conversaciones complejas en diversos dominios (negociación, enseñanza, entretenimiento).

5.  **Configurabilidad**: Los parámetros de `NoResponseConfig` permiten ajustar el comportamiento del sistema sin cambios de código, facilitando experimentos y optimizaciones.

### Sistema de Exportación de Datasets Conversacionales

Una de las funcionalidades más valiosas del sistema es la capacidad de exportar automáticamente cada conversación finalizada en formato estructurado (JSONL), creando datasets de alta calidad para análisis y entrenamiento de modelos.

#### Arquitectura de Exportación

**Flujo de Datos**:
1. **Captura**: Al finalizar una conversación (`conversationEnded = true`), el hook `useAgentConversation` construye un objeto `DatasetConversation`.
2. **Transformación**: Los mensajes se mapean a turnos estructurados con metadatos enriquecidos.
3. **Persistencia**: Se envía al endpoint `POST /api/save-dataset` que lo guarda en formato JSONL.
4. **Almacenamiento**: Un archivo por tipo de servicio en `dataset/{service_type}.jsonl`.

**Componentes Clave**:

1. **`src/lib/dataset.ts`**: Módulo de utilidades para manejo de archivos JSONL
   - `ensureDir()`: Crea el directorio de datasets si no existe
   - `appendJsonl()`: Añade conversaciones al archivo sin sobrescribir
   - `readJsonl()`: Lee y parsea archivos JSONL completos
   - `getDatasetFilePath()`: Construye rutas seguras para archivos
   - `isDatasetSaveEnabled()`: Verifica configuración de activación

2. **`src/app/api/save-dataset/route.ts`**: Endpoint de persistencia
   - Validación de estructura del objeto de conversación
   - Sanitización del `service_type` para nombres de archivo seguros
   - Creación automática del directorio `dataset/`
   - Append atómico al archivo JSONL
   - Manejo de errores sin bloquear la aplicación

3. **Integración en `useAgentConversation.ts`**:
   - **`buildDatasetConversation()`**: Transforma `GameMessage[]` → `DatasetConversation`
     - Mapeo de roles: `assistant` → `agente`, `user` → `cliente`
     - Detección automática de `resolution_status` desde `StageInfo`
     - Asignación de `turn_id` secuencial
     - Timestamps ISO 8601
   - **`saveDataset()`**: Envía al endpoint con retry-tolerance
   - **Puntos de guardado**:
     - Resolución exitosa (`[STATUS: RESOLVED]`)
     - Cliente no responde (`[STATUS: NO_RESPONSE]`)
     - Límite de turnos alcanzado

#### Esquema de Dataset

Cada conversación se guarda como una línea JSON con la siguiente estructura:

```typescript
{
  conversation_id: string;        // UUID único
  service_type: string;           // Tipo de agente (ej: "agent-resolutor")
  finished_at: string;            // Timestamp ISO 8601
  resolution_status: "resuelto" | "no_response" | "max_turns";
  metadata: {
    topic: string | null;         // Tema (futuro: extracción automática)
    intent: string | null;        // Intención (futuro: clasificación)
    sentiment_trend: string | null; // Tendencia emocional (futuro: análisis)
  };
  turns: [
    {
      turn_id: number;            // Secuencial desde 1
      role: "cliente" | "agente";
      timestamp: string;          // ISO 8601
      content: string;            // Contenido del mensaje
      action: string | null;      // Acción realizada (futuro)
    }
  ];
}
```

#### Configuración

Variables de entorno en `.env.local`:

```env
DATASET_SAVE=on          # on | off - habilitar/deshabilitar exportación
DATASET_DIR=dataset      # directorio de destino (relativo a raíz)
```

#### Formato JSONL: Ventajas

- **Apéndice Seguro**: Cada conversación es una línea independiente, evitando corrupción de datos.
- **Streaming**: Procesamiento línea por línea sin cargar todo en memoria.
- **Compatibilidad**: Amplio soporte en herramientas de ML (Hugging Face, PyTorch, TensorFlow).
- **Análisis Simple**: Uso directo con `jq`, `grep`, `awk` sin parsers complejos.

#### Beneficios del Sistema de Datasets

1. **Entrenamiento de Modelos Especializados**:
   - Fine-tuning de LLMs para dominios específicos (soporte al cliente, negociación, etc.)
   - Creación de modelos de clasificación de intención y sentimiento
   - Entrenamiento de sistemas de respuesta automática

2. **Análisis de Calidad y Métricas**:
   - **Tasa de Resolución**: % de conversaciones con `resolution_status: "resuelto"`
   - **Duración Promedio**: Número medio de turnos por conversación
   - **Tasa de Abandono**: % de conversaciones con `no_response`
   - **Identificación de Patrones**: Problemas recurrentes, escalaciones frecuentes

3. **Evaluación y Mejora de Prompts**:
   - A/B testing de diferentes configuraciones de prompts
   - Identificación de respuestas efectivas vs. inefectivas
   - Refinamiento iterativo basado en resultados reales

4. **Datos Sintéticos de Alta Calidad**:
   - Generación masiva de conversaciones realistas sin intervención humana
   - Diversidad de escenarios (clientes enojados, desesperados, satisfechos)
   - Control de variables (tipo de problema, resolución, emociones)

5. **Auditoría y Compliance**:
   - Registro completo de interacciones para revisión
   - Validación de cumplimiento de políticas de atención
   - Identificación de sesgos o comportamientos no deseados

#### Posibles Mejoras Futuras

**Corto Plazo**:
1. **Timestamps Precisos**: Guardar `createdAt` en cada `GameMessage` en lugar de usar timestamp de exportación
2. **Enriquecimiento de `action`**: Detectar acciones automáticamente (`solicitar_informacion`, `proveer_solucion`, `escalar_caso`) desde el contenido del mensaje
3. **Rotación de Archivos**: Implementar límite de tamaño con rotación automática (`agent-resolutor.1.jsonl`, etc.)
4. **Compresión**: Comprimir archivos antiguos en `.jsonl.gz` para optimizar almacenamiento

**Mediano Plazo**:
1. **Extracción Automática de Metadata**:
   - **Topic**: Clasificación del tema principal (ej: "reembolso", "producto_dañado", "envío_tardío")
   - **Intent**: Intención del cliente (ej: "queja", "consulta", "solicitud")
   - **Sentiment Trend**: Análisis de evolución emocional (ej: "negativo_a_positivo")
2. **Persistencia Cloud**: Migración a S3/Google Cloud Storage para entornos serverless
3. **API de Consulta**: Endpoint para búsqueda y filtrado de conversaciones históricas
4. **Dashboard de Métricas**: UI para visualizar estadísticas en tiempo real

**Largo Plazo**:
1. **Fine-tuning Automático**: Pipeline CI/CD que entrena modelos con nuevos datasets periódicamente
2. **Feedback Loop**: Sistema de puntuación de conversaciones para mejora continua
3. **Multi-agente**: Soporte para conversaciones con más de 2 participantes
4. **Anonimización**: Detección y ofuscación automática de datos sensibles (PII)
5. **Versionado de Prompts**: Vincular cada conversación con la versión del prompt usado para análisis de impacto

#### Consideraciones Técnicas

**Entornos de Desarrollo vs. Producción**:
- **Local/Dev**: El filesystem es persistente, los archivos JSONL funcionan perfectamente
- **Serverless (Vercel, AWS Lambda)**: El filesystem es efímero, se requiere migración a:
  - **S3/GCS**: Para datasets grandes
  - **Base de datos**: PostgreSQL con JSONB, MongoDB, etc.
  - **Servicios gestionados**: DynamoDB, Firestore

**Escalabilidad**:
- Con 1,000 conversaciones/día de ~10 turnos c/u:
  - Tamaño promedio: ~2KB por conversación
  - Espacio diario: ~2MB
  - Espacio mensual: ~60MB
- Con 100,000 conversaciones/día:
  - Espacio diario: ~200MB
  - Espacio mensual: ~6GB
  - Recomendación: Implementar particionamiento por fecha (`dataset/agent-resolutor/2025-10-10.jsonl`)

**Seguridad y Privacidad**:
- Actualmente, las conversaciones contienen todo el contenido textual
- Para datos sensibles, implementar:
  - Encriptación en reposo
  - Políticas de retención (ej: eliminar después de 90 días)
  - Anonimización de identificadores personales

## Conclusión: Potencial del Sistema de Agentes de IA

El sistema de agentes de IA implementado en `game-ia` va más allá de la mera interacción de juego; ofrece un marco potente para la exploración y el desarrollo de inteligencias conversacionales avanzadas. Sus capacidades actuales y el diseño modular abren la puerta a aplicaciones significativas:

1.  **Generación de Grandes Datasets Conversacionales**: La interacción autónoma entre dos o más IAs con roles definidos puede generar volúmenes masivos de diálogos simulados de alta calidad. Estos datasets son invaluables para:
    -   Entrenar y afinar modelos de lenguaje (LLMs) más robustos y especializados en dominios específicos (p.ej., soporte técnico, negociación, roles de personajes).
    -   Crear conjuntos de datos para tareas de comprensión del lenguaje natural (NLU) y generación de lenguaje natural (NLG).

2.  **Afinación y Validación de Prompts (Prompt Engineering Avanzado)**: Al observar cómo diferentes agentes de IA (con sus `constants` y `prompt.ts` únicos) responden e interactúan entre sí, los desarrolladores pueden:
    -   Experimentar y refinar iterativamente los prompts para lograr el comportamiento deseado de un agente en escenarios complejos.
    -   Identificar prompts que provocan respuestas indeseadas, sesgos o inconsistencias, permitiendo una mejora continua en la calidad de la interacción.

3.  **Pruebas Conversacionales Automatizadas**: El sistema permite realizar pruebas automatizadas de resiliencia y coherencia de los modelos de IA en diversas situaciones conversacionales. Esto facilita:
    -   La detección temprana de puntos débiles o fallos en la lógica de los agentes.
    -   La evaluación de cómo los modelos se comportan bajo estrés o con entradas ambiguas.
    -   La validación de la ética y seguridad de los agentes antes de su despliegue en entornos de usuario real.

### Ideas para Futuros Proyectos utilizando este Sistema:

El potencial de este marco es vasto y puede extenderse a múltiples dominios. Aquí hay 5 ideas para futuros proyectos:

1.  **Simulador de Entrenamiento para Agentes de Servicio al Cliente**: Desarrollar una plataforma donde agentes de IA simulen roles de clientes con diferentes personalidades y quejas (enojado, confuso, impaciente, etc.). Un agente de IA "agente de soporte" entrenaría con estos "clientes" para mejorar sus habilidades de resolución y manejo de emociones, generando métricas de rendimiento y satisfacción del cliente simuladas.

2.  **Generador de Contenido Narrativo Dinámico y Branching Stories**: Extender el concepto del "juego zombie" para crear historias interactivas complejas o guiones para videojuegos y películas. Múltiples personajes controlados por IA dialogarían y desarrollarían la trama de forma autónoma, explorando diferentes ramas narrativas basadas en sus "personalidades" y objetivos definidos en sus prompts y configuraciones de flujo.

3.  **Plataforma de Simulación de Negociación y Estrategia Empresarial**: Crear agentes de IA que representen roles en un entorno empresarial (p.ej., vendedor, comprador, director financiero, inversor). Estos agentes podrían negociar acuerdos, tomar decisiones estratégicas y simular escenarios de mercado, permitiendo a los usuarios humanos explorar resultados potenciales y optimizar sus estrategias de negocio.

4.  **Entrenador Personalizado de Habilidades de Comunicación**: Un sistema donde un usuario humano interactúa con agentes de IA diseñados para simular diferentes personalidades o situaciones sociales (p.ej., una entrevista de trabajo, una conversación difícil con un colega, una presentación a un inversor). La IA proporcionaría feedback en tiempo real sobre el tono, la elección de palabras y la efectividad de la comunicación del usuario.

5.  **Laboratorio de Investigación para el Comportamiento Emergente de IAs**: Una plataforma para científicos e investigadores donde se puedan configurar complejas interacciones entre múltiples tipos de agentes de IA. El objetivo sería estudiar cómo emergen comportamientos complejos, dinámicas sociales simuladas, o cómo los sesgos se propagan o se mitigan en sistemas conversacionales distribuidos. Esto podría ofrecer insights valiosos sobre la inteligencia artificial general (AGI).

Esta arquitectura permite una clara separación de responsabilidades, facilitando la escalabilidad, el mantenimiento y la adición de nuevos tipos de agentes o experiencias conversacionales.
