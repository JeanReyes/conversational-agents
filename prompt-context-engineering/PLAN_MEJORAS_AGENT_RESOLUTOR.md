# Plan de Mejoras: Agent Resolutor (VERSIÓN SIMPLIFICADA)
## Sistema de Conversación Dinámica con 3 Etapas

**Fecha de Creación:** 10 de Octubre, 2025  
**Versión:** 2.0 - SIMPLE Y EJECUTABLE  
**Tiempo de Implementación:** 1-2 horas  
**Objetivo:** Conversaciones dinámicas con 3 etapas simples y finalización inteligente

---

## 📋 Resumen Ejecutivo

### Problema Actual
- **Turnos fijos:** Exactamente 8 turnos siempre (línea 109 de `useAgentConversation.ts`)
- **Sin detección de finalización:** El agente no puede terminar cuando ya resolvió el problema
- **Sin estructura:** No hay etapas definidas

### Solución Propuesta (ULTRA SIMPLIFICADA)
1. **3 Etapas simples:** OPENING (turno 1) → DEVELOPMENT (turnos 2-N) → CLOSING (último turno)
2. **1 Señal:** Solo `[STATUS: RESOLVED]` para terminar
3. **Prompts mejorados:** Un prompt por etapa, sin complejidad
4. **Límite flexible:** Mínimo 4 turnos, máximo 12 turnos

---

## 🎯 Lo que SÍ vamos a hacer

- ✅ 3 etapas simples (sin sub-etapas)
- ✅ Detección de `[STATUS: RESOLVED]` para terminar
- ✅ Mejorar prompts actuales con instrucciones por etapa
- ✅ Cambiar límite de 8 a 12 turnos máximo

## 🚫 Lo que NO vamos a hacer (para mantenerlo simple)

- ❌ Sub-etapas (GATHERING, CALMING, VALIDATION, RESOLUTION)
- ❌ Metadata compleja (emotionalState, confidence, informationGathered)
- ❌ Múltiples estados y transiciones
- ❌ Sistema de métricas avanzado

---

## 🔨 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Añadir Tipos Básicos (5 min)

**Archivo:** `src/lib/types.ts`

```typescript
// AÑADIR al final del archivo

export enum ConversationStage {
  OPENING = 'OPENING',
  DEVELOPMENT = 'DEVELOPMENT',
  CLOSING = 'CLOSING'
}

export interface StageInfo {
  stage: ConversationStage;
  turnNumber: number;
  isResolved: boolean;
}

// MODIFICAR GameMessage existente para añadir:
export interface GameMessage {
  // ... propiedades existentes ...
  stageInfo?: StageInfo;  // ← AÑADIR ESTO
}
```

---

### Paso 2: Actualizar Prompts (20 min)

**Archivo:** `src/lib/services/agent-resolutor/prompt.ts`

**REEMPLAZAR TODO EL CONTENIDO con:**

```typescript
export const GAME_PROMPTS = {
  // Prompt para el PRIMER turno (OPENING)
  INITIAL_STORY: `
Eres un Agente de Soporte de una tienda online. Tu objetivo es ayudar a los clientes con problemas de pedidos, reembolsos, entregas, etc.

**ETAPA: INICIO**

Tu tarea ahora:
1. Da un saludo simple y profesional
2. Pregunta en qué puedes ayudar
3. NO pidas información todavía, solo pregunta cuál es el problema

Ejemplo: "Hola, bienvenido a nuestro servicio de soporte. ¿En qué puedo ayudarte hoy?"

Mantén el mensaje corto y acogedor.
`.trim(),

  // Prompt para turnos intermedios (DEVELOPMENT)
  CONTINUE_STORY: (historyText: string, userMessage: string) => `
Eres el Agente de Soporte. Aquí está el historial de la conversación:

${historyText}

Último mensaje del cliente:
${userMessage}

**ETAPA: DESARROLLO**

**Tu objetivo:** Resolver el problema del cliente siguiendo estos pasos:

1. **Si el cliente está enojado/frustrado:**
   - Valida su emoción primero: "Entiendo completamente tu frustración"
   - Muestra empatía antes de pedir información

2. **Si necesitas información (orden #, email, detalles):**
   - Pide solo lo que aún no tienes
   - Sé específico: "¿Cuál es tu número de orden?"

3. **Si ya tienes la información necesaria:**
   - Ofrece una solución CONCRETA (reembolso, cupón, envío gratis, etc.)
   - Sé específico con cantidades y tiempos: "He procesado tu reembolso de $45, lo verás en 3-5 días"
   - SIEMPRE ofrece una compensación adicional (cupón, descuento, envío gratis)
   - Termina preguntando: "¿Hay algo más en lo que pueda ayudarte?"

4. **Si el cliente confirma que está todo bien (dice "gracias", "perfecto", "ok"):**
   - Pasa a la etapa de CIERRE
   - Resume brevemente lo que se resolvió
   - Despídete profesionalmente
   - **IMPORTANTE:** Termina tu mensaje con: [STATUS: RESOLVED]

**Matriz de Soluciones:**
- Producto defectuoso → Reembolso completo + cupón 20%
- Producto nunca llegó → Reembolso completo + cupón 25%
- Entrega tardía → 50% reembolso + envío gratis próxima compra
- Descuento no aplicado → Reembolso de diferencia + puntos extra

Mantén un tono empático y profesional. Sé específico, no genérico.
`.trim(),

  GENERATE_IMAGE: (description: string) => 
    `Generate a pixel art style image 16:9 aspect ${description} use 8-bit retro gaming aesthetics with limited color palette, blocky pixelated style, and clear definition. The image should be in landscape format (16:9 ratio)`,
};
```

---

### Paso 3: Crear Helper para Detectar Señal (10 min)

**Archivo:** `src/lib/services/agent-resolutor/stage-helper.ts` (NUEVO)

```typescript
import { ConversationStage, StageInfo } from '@/lib/types';

export class StageHelper {
  /**
   * Determina la etapa según el número de turno y el contenido
   */
  static determineStage(
    turnNumber: number,
    agentResponse: string,
    previousWasClosing: boolean
  ): StageInfo {
    // Detectar si el agente marcó como resuelto
    const isResolved = agentResponse.includes('[STATUS: RESOLVED]');
    
    // Determinar etapa
    let stage: ConversationStage;
    
    if (turnNumber === 1) {
      stage = ConversationStage.OPENING;
    } else if (isResolved || previousWasClosing) {
      stage = ConversationStage.CLOSING;
    } else {
      stage = ConversationStage.DEVELOPMENT;
    }
    
    return {
      stage,
      turnNumber,
      isResolved
    };
  }

  /**
   * Limpia la señal [STATUS: RESOLVED] del mensaje
   */
  static cleanResponse(response: string): string {
    return response
      .replace(/\[STATUS:\s*RESOLVED\]/gi, '')
      .trim();
  }

  /**
   * Verifica si la conversación debe terminar
   */
  static shouldEndConversation(
    stageInfo: StageInfo,
    maxTurns: number = 12
  ): boolean {
    // Terminar si está marcado como resuelto
    if (stageInfo.isResolved) {
      return true;
    }
    
    // Terminar si llegamos al límite máximo
    if (stageInfo.turnNumber >= maxTurns) {
      return true;
    }
    
    return false;
  }
}
```

---

### Paso 4: Modificar el Hook useAgentConversation (25 min)

**Archivo:** `src/app/hooks/useAgentConversation.ts`

**CAMBIOS A REALIZAR:**

```typescript
import { useCallback, useEffect, useState } from "react";
import { useGameService } from '@/lib/game-context';
import { useSharedConversation } from "@/lib/shared-conversation-context";
import { StageHelper } from '@/lib/services/agent-resolutor/stage-helper';  // ← NUEVO

import type { GameMessage, GenerateStoryResponse, ServiceType, StageInfo } from "@/lib/types";  // ← AÑADIR StageInfo

const CLIENT_TYPES: ServiceType[] = ['client-claim', 'desperate-client', 'angry-client'];

export function useAgentConversation(initialServiceType: ServiceType) {
  const { service, isLoading: serviceLoading } = useGameService();
  const sharedConversation = useSharedConversation();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTurnService, setCurrentTurnService] = useState<ServiceType>(initialServiceType);
  const [selectedClient, setSelectedClient] = useState<ServiceType | null>(null);
  const [conversationEnded, setConversationEnded] = useState<boolean>(false);  // ← NUEVO

  // ... useEffect de cliente random (sin cambios) ...

  const startConversation = useCallback(async () => {
    if (!initialServiceType || !selectedClient) return;
    console.log('startConversation with', initialServiceType);
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          isStart: true,
          serviceType: initialServiceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data = await response.json();

      // ← NUEVO: Procesar stage info
      const cleanedContent = StageHelper.cleanResponse(data.narrative);
      const stageInfo: StageInfo = StageHelper.determineStage(1, data.narrative, false);
      
      console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber);

      const message: GameMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanedContent,  // ← MODIFICADO
        serviceType: initialServiceType,
        stageInfo,  // ← NUEVO
      };
      
      setMessages([message]);
      setCurrentTurnService(selectedClient);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [initialServiceType, selectedClient]);

  const continueConversation = useCallback(async (history: GameMessage[]) => {
    const lastMessage = history[history.length - 1];
    if (!lastMessage || isLoading || !selectedClient || conversationEnded) return;  // ← MODIFICADO

    setIsLoading(true);
    console.log('continueConversation with', currentTurnService);
    
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          userMessage: lastMessage.content,
          conversationHistory: history,
          isStart: false,
          serviceType: currentTurnService,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story for " + currentTurnService);
      }

      const data = await response.json() as GenerateStoryResponse;

      // ← NUEVO: Procesar stage info solo para agent-resolutor
      let cleanedContent = data.narrative;
      let stageInfo: StageInfo | undefined;
      
      if (currentTurnService === 'agent-resolutor') {
        cleanedContent = StageHelper.cleanResponse(data.narrative);
        const turnNumber = history.filter(m => m.serviceType === 'agent-resolutor' || m.role === 'assistant').length + 1;
        const previousStage = history[history.length - 1]?.stageInfo;
        
        stageInfo = StageHelper.determineStage(
          turnNumber,
          data.narrative,
          previousStage?.stage === 'CLOSING'
        );
        
        console.log('Stage:', stageInfo.stage, 'Turn:', stageInfo.turnNumber, 'Resolved:', stageInfo.isResolved);
        
        // ← NUEVO: Verificar si debe terminar
        if (StageHelper.shouldEndConversation(stageInfo)) {
          console.log('🎯 Conversation ended!', stageInfo.isResolved ? 'RESOLVED' : 'MAX_TURNS');
          setConversationEnded(true);
        }
      }

      const assistantMessage: GameMessage = {
        id: crypto.randomUUID(),
        role: currentTurnService === 'agent-resolutor' ? 'assistant' : "user",
        content: cleanedContent,  // ← MODIFICADO
        stageInfo,  // ← NUEVO
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      // Toggle service for the next turn
      setCurrentTurnService(prevService => prevService === 'agent-resolutor' ? selectedClient : 'agent-resolutor');

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentTurnService, selectedClient, conversationEnded]);  // ← MODIFICADO

  // ... useEffect de inicio (sin cambios) ...

  useEffect(() => {
    // ← MODIFICADO: Usar conversationEnded en lugar de límite fijo
    if (messages.length > 0 && !isLoading && !conversationEnded) {
      const timer = setTimeout(() => {
        continueConversation(messages);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [messages, continueConversation, isLoading, conversationEnded]);  // ← MODIFICADO

  return {
    messages,
    isLoading: isLoading || serviceLoading,
    service,
    selectedClient,
    conversationEnded,  // ← NUEVO (opcional, para debugging)
  }
}
```

---

## ✅ Testing y Validación

### Casos de Prueba

**Test 1: Cliente Normal (Resolución Rápida)**
```
Turno 1 [OPENING]: Agente saluda
Turno 2 [DEVELOPMENT]: Cliente: "Mi pedido no llegó"
Turno 3 [DEVELOPMENT]: Agente pide orden #
Turno 4 [DEVELOPMENT]: Cliente da orden #12345
Turno 5 [DEVELOPMENT]: Agente ofrece reembolso + cupón + pregunta si hay algo más
Turno 6 [CLOSING]: Cliente: "Perfecto, gracias"
Turno 7 [CLOSING]: Agente: despedida + [STATUS: RESOLVED]
END

Resultado esperado: 7 turnos, termina con RESOLVED ✅
```

**Test 2: Cliente Enojado (Más Turnos)**
```
Turno 1 [OPENING]: Agente saluda
Turno 2 [DEVELOPMENT]: Cliente: "ESTO ES INACEPTABLE!!!"
Turno 3 [DEVELOPMENT]: Agente valida emoción + pide info
Turno 4 [DEVELOPMENT]: Cliente sigue molesto pero da orden #
Turno 5 [DEVELOPMENT]: Agente pide email
Turno 6 [DEVELOPMENT]: Cliente da email
Turno 7 [DEVELOPMENT]: Agente ofrece solución generosa
Turno 8 [CLOSING]: Cliente acepta
Turno 9 [CLOSING]: Agente: despedida + [STATUS: RESOLVED]
END

Resultado esperado: 9 turnos, termina con RESOLVED ✅
```

**Test 3: Límite de Seguridad**
```
Si por alguna razón el agente no marca [STATUS: RESOLVED] después de muchos turnos, 
la conversación debe terminar automáticamente al turno 12.

Resultado esperado: Termina al turno 12 máximo ✅
```

### Cómo Probar

1. Ejecuta la aplicación: `npm run dev`
2. Ve a la ruta del agent-resolutor
3. Observa la consola del navegador para ver los logs de Stage y Turn
4. Verifica que aparezca "🎯 Conversation ended!" cuando termine

---

## 📊 Métricas de Éxito

Al terminar la implementación, deberías ver:

- ✅ **70%+** de conversaciones terminan con `[STATUS: RESOLVED]` (no por límite)
- ✅ **Promedio 5-8 turnos** (en lugar de siempre 8)
- ✅ **0 errores** en consola relacionados con stages
- ✅ Las conversaciones **se sienten más naturales** (no cortadas abruptamente)

---

## 🎓 Mejores Prácticas Aplicadas

### 1. Principio KISS (Keep It Simple, Stupid)
- Solo 3 etapas, sin sub-etapas
- Una sola señal de control
- Prompts directos y claros

### 2. Fail-Safe (Límites de Seguridad)
- Máximo 12 turnos (evita conversaciones infinitas)
- Mínimo implícito de 4 turnos (para que sea una conversación real)

### 3. Clear Instructions (Instrucciones Claras)
- Los prompts dicen EXACTAMENTE qué hacer en cada etapa
- Incluyen ejemplos concretos
- Especifican cuándo usar [STATUS: RESOLVED]

### 4. Separation of Concerns (Separación de Responsabilidades)
- `StageHelper`: Lógica de etapas
- `prompt.ts`: Contenido de prompts
- `useAgentConversation`: Orquestación del flujo

---

## 🚀 Próximos Pasos (Después de Implementar)

### Mejoras Futuras (Opcionales)
Una vez que esto funcione bien, podrías añadir:

1. **Analytics básico:** Guardar métricas de cada conversación
2. **Prompts A/B:** Probar variaciones de prompts
3. **Detection keywords:** Añadir detección de keywords además de [STATUS: RESOLVED]
4. **Sub-etapas opcionales:** Si se necesitan, añadirlas gradualmente

Pero primero, **haz que esto funcione bien**.

---

## 🤝 Compromiso de Implementación

Este plan ES implementable en 1-2 horas porque:

✅ Solo modifica 3 archivos existentes  
✅ Crea 1 archivo helper pequeño  
✅ No requiere refactorización masiva  
✅ Mantiene retrocompatibilidad con otros agentes  
✅ Cada paso es claro y específico  

**Puedo implementar esto ahora mismo si quieres.**

---

**Última Actualización:** 10 de Octubre, 2025  
**Versión:** 2.0 SIMPLIFICADA  
**Estado:** Listo para implementar

JEAN:
 - crear variantes de conversaciones, agente resolutor de caso, agente resolutor de QR, y tamien los diferentes tipos de clientes.