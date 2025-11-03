# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 15 application that implements a multi-agent AI conversation system using Google's Gemini models via the Vercel AI SDK. The project simulates realistic customer service interactions between an AI resolver agent and various AI client personas, generating structured conversation datasets for training and analysis.

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run build        # Build production bundle with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing
Note: This project currently does not have a test suite configured. Before adding tests, check for existing test frameworks or consult the team on preferred testing approach.

## Architecture Overview

### Service Factory Pattern
The core architecture uses a **ServiceFactory** (`src/lib/service-factory.ts`) that dynamically loads AI agent configurations based on `ServiceType`. Each agent has:
- `constants.ts`: UI messages (loading, errors, placeholders)
- `prompt.ts`: System prompts for conversation stages (INITIAL_STORY, CONTINUE_STORY, GENERATE_IMAGE)
- Configuration for image generation separators

### Agent Types
**Primary Agent:**
- `agent-resolutor`: Customer support agent with tool-calling capabilities (order status, policy search, complaint registration, case escalation)

**Client Personas (simulate customer behaviors):**
- `client-claim`: Standard complaint client
- `desperate-client`: Urgent/desperate customer
- `angry-client`: Frustrated/angry customer
- 10+ specific problem-based clients (`promocion-no-respetada`, `retraso-entrega`, `producto-defectuoso`, etc.)

**Other Agents:**
- `game-zombie`: Interactive zombie survival narrative game
- `business-strategy`: Business strategy conversation agent

### Conversation Stages System
The system uses a sophisticated stage-based conversation flow (see `src/lib/config-agents/agent-resolutor/stage-helper.ts`):

1. **OPENING**: Initial greeting (turn 1)
2. **DEVELOPMENT**: Problem resolution (turns 2-10+, variable length)
3. **CLOSING**: Confirmation and professional goodbye (1-2 turns)

**Dynamic Termination Signals:**
- `[STATUS: RESOLVED]`: Problem solved successfully
- `[STATUS: NO_RESPONSE]`: Client stopped responding (timeout simulation)
- Maximum turns limit (default: 12)

### No-Response Simulation
Realistic abandonment behavior is simulated via `NoResponseConfig`:
- Configurable probability (default: 10%)
- Only triggers after turn 3
- Stops applying after turn 10
- 2-second timeout before agent closes conversation
- Agent generates professional closure message

### Tools System
The `agent-resolutor` has access to five tools (defined in `src/lib/tools/`):
- `getOrderStatus`: Query order status by order number
- `verifyIssue`: Validate complaint details
- `searchPolicy`: Search company policies
- `registerComplaint`: File formal complaint with compensation
- `escalateCase`: Escalate to supervisor

**Tool Response Flow:**
1. LLM calls tool(s) in first step
2. If LLM doesn't generate text after tool call, API automatically makes a second LLM call with tool results via `response-tools` service prompts
3. Final response combines tool output with natural language

### Dataset Export System
Every completed conversation is automatically saved to `dataset/{service_type}.jsonl` (see `src/lib/dataset.ts`):

**Schema per line:**
```json
{
  "conversation_id": "uuid",
  "service_type": "agent-resolutor",
  "finished_at": "ISO 8601 timestamp",
  "resolution_status": "resuelto" | "no_response" | "max_turns",
  "metadata": {
    "topic": null,
    "intent": null,
    "sentiment_trend": null
  },
  "turns": [
    {
      "turn_id": 1,
      "role": "cliente" | "agente",
      "timestamp": "ISO 8601",
      "content": "message text",
      "action": null
    }
  ]
}
```

**Configuration:**
- Enable/disable: Set `DATASET_SAVE=off` in `.env.local` to disable (default: enabled)
- Directory: Set `DATASET_DIR=dataset` (default)

**Important Notes:**
- JSONL format (one JSON object per line) for streaming/incremental processing
- Saved only on conversation end (resolved, no_response, or max_turns)
- Role mapping: `assistant` → `agente`, `user` → `cliente`
- Timestamps currently use export time (future improvement: capture per-message `createdAt`)

## Key Hooks

### `useAgentConversation` (src/app/hooks/useAgentConversation.ts)
Primary hook for AI-to-AI conversations. Supports two modes:

**Automatic Mode:**
- Two agents converse autonomously
- Alternates between primary agent (`agent-resolutor`) and selected client persona
- Simulates "thinking time" with delays
- Handles no-response simulation
- Auto-saves dataset on completion

**Custom Mode:**
- User types messages, agent responds
- Only calls `agent-resolutor` (always role `assistant`)
- User messages have role `user`

**Key Methods:**
- `startConversation()`: Begin with primary agent's opening
- `continueConversation()`: Continue automatic turn-based conversation
- `continueConversationCustomMode()`: Handle user input mode
- `resetConversation()`: Clear state and start fresh
- `shouldSimulateNoResponse()`: Probability-based abandonment check
- `handleNoResponse()`: Execute timeout and generate agent closure
- `buildDatasetConversation()`: Transform messages to dataset schema
- `saveDataset()`: POST to `/api/save-dataset`

### `useGameService` (src/lib/game-context.tsx)
Context provider that loads the current service configuration via `ServiceFactory`.

## API Routes

### POST `/api/generate-story`
Main conversation generation endpoint.

**Request:**
```typescript
{
  userMessage: string;
  conversationHistory: { role: "user" | "assistant", content: string }[];
  isStart: boolean;
  serviceType: ServiceType;
}
```

**Response:**
```typescript
{
  narrative: string;
  imagePrompt?: string;
}
```

**Behavior:**
- Uses `gemini-2.5-flash-lite` model
- Loads service-specific prompts via `ServiceFactory.getService()`
- Passes tools to model only for `agent-resolutor`
- If LLM uses tools but doesn't generate text, makes second call with tool results
- Splits response on `IMAGE.SEPARATOR` to extract image prompt

### POST `/api/generate-image`
Image generation endpoint (uses `gemini-2.5-flash-image-preview` model).

### POST `/api/save-dataset`
Persists conversation to JSONL file.

**Request:**
```typescript
{
  service_type: string;
  conversation: DatasetConversation;
}
```

**Behavior:**
- Validates conversation structure
- Sanitizes service_type for safe filename
- Creates `dataset/` directory if missing
- Appends to `dataset/{service_type}.jsonl`
- Non-blocking: errors logged but don't break UI

## File Structure Conventions

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate-story/     # Main conversation endpoint
│   │   ├── generate-image/     # Image generation
│   │   └── save-dataset/       # Dataset persistence
│   ├── components/             # App-specific components
│   ├── hooks/                  # Custom hooks (useAgentConversation, useGame)
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── ai-elements/            # AI UI components (conversation, message, etc.)
│   ├── ui/                     # Generic UI primitives (button, input, etc.)
│   ├── GameInterface.tsx       # Main orchestrator component
│   └── ServiceSelector.tsx     # Service selection UI
└── lib/
    ├── config-agents/          # Agent configurations
    │   ├── agent-resolutor/
    │   │   ├── constant.ts     # UI messages & config
    │   │   ├── prompt.ts       # System prompts
    │   │   └── stage-helper.ts # Stage management utilities
    │   ├── [other-agents]/     # Each agent follows same structure
    │   └── response-tools/     # Specialized prompts for tool response generation
    ├── tools/                  # Tool definitions (order-status-tool, etc.)
    ├── dataset.ts              # Dataset JSONL utilities
    ├── game-context.tsx        # Service provider context
    ├── service-factory.ts      # Dynamic service loader
    ├── types.ts                # TypeScript interfaces
    └── utils.ts                # Utility functions
```

## Adding a New Agent

1. Create directory: `src/lib/config-agents/{new-agent-name}/`
2. Create `constant.ts`:
   ```typescript
   export const UI_MESSAGES = {
     LOADING: { default: "..." },
     ERROR: { default: "..." },
     PLACEHOLDER: { default: "..." }
   };
   export const GAME_CONFIG = {
     IMAGE: { DEFAULT_PROMPT: "...", SEPARATOR: "IMAGE_PROMPT:" }
   };
   ```
3. Create `prompt.ts`:
   ```typescript
   export const GAME_PROMPTS = {
     INITIAL_STORY: "Your opening prompt...",
     CONTINUE_STORY: (history: string, message: string) => `...`,
     GENERATE_IMAGE: (desc: string) => `...`
   };
   ```
4. Add to `ServiceType` union in `src/lib/types.ts`
5. Add case in `ServiceFactory.getService()` switch statement
6. Add to `getAvailableServices()` metadata array

## Important Patterns

### Path Aliases
Use `@/` for `src/` imports:
```typescript
import { ServiceFactory } from '@/lib/service-factory';
```

### Message Role Mapping
- **In code**: `assistant` = primary agent, `user` = client/human
- **In dataset**: `assistant` → `agente`, `user` → `cliente`

### Stage Detection
`StageHelper.determineStage()` analyzes:
- Turn number
- Agent response content (keywords, status signals)
- Previous stage state

Never manually set stage—always use `StageHelper` methods.

### Tool Response Generation
When tools are used, responses are generated in two ways:
1. **Preferred**: LLM generates natural response with tool context
2. **Fallback**: If LLM returns empty text, `response-tools` prompts format tool results into natural language

## Environment Variables

Create `.env.local` for local development:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
DATASET_SAVE=on              # Toggle dataset export (on/off)
DATASET_DIR=dataset          # Directory for JSONL files
```

## Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **AI SDK**: Vercel AI SDK (`ai`) + Google AI SDK (`@ai-sdk/google`)
- **Models**: `gemini-2.5-flash-lite` (text), `gemini-2.5-flash-image-preview` (images)
- **Styling**: Tailwind CSS 4, `class-variance-authority` for component variants
- **UI Components**: Radix UI primitives, custom `ai-elements` components
- **Type Safety**: TypeScript 5, strict mode enabled
- **Build Tool**: Turbopack (Next.js 15 default)

## Development Notes

### StageInfo Metadata
Every `GameMessage` from `agent-resolutor` includes `stageInfo`:
```typescript
{
  stage: ConversationStage;    // OPENING | DEVELOPMENT | CLOSING
  turnNumber: number;
  isResolved: boolean;
  noResponse?: boolean;
}
```
Use this for analytics, UI indicators, and dataset enrichment.

### Serverless Deployment Considerations
Current dataset system uses filesystem (`fs.appendFile`). For serverless environments (Vercel, AWS Lambda):
- Filesystem is ephemeral
- Migrate to S3/Google Cloud Storage or database (PostgreSQL JSONB, MongoDB, DynamoDB)
- `src/lib/dataset.ts` already provides abstraction layer for easy migration

### Extending Tool Capabilities
To add a new tool for `agent-resolutor`:
1. Create tool definition in `src/lib/tools/{tool-name}-tool.ts`
2. Import and add to `tools` object in `src/app/api/generate-story/route.ts`
3. Add response generator function to `responseGenerators` map
4. Update agent prompts to reference new tool

### Debug Logging
The `/api/generate-story` route includes extensive `console.log` statements for debugging:
- Step-by-step execution (`onStepFinish`)
- Tool calls with inputs
- Tool results with outputs
- Final text generation decisions

Leave these enabled during development for troubleshooting.

## Documentation References

For in-depth architectural details, see:
- `prompt-context-engineering/ARCHITECTURE.md`: Complete system architecture and design rationale
- `dataset/README.md`: Dataset format and analysis guides
- `prompt-context-engineering/PLAN_DATASET_EXPORT.md`: Dataset system implementation plan
- `prompt-context-engineering/PLAN_MEJORAS_AGENT_RESOLUTOR.md`: Agent improvement roadmap

## Common Tasks

**Run a conversation simulation:**
```bash
npm run dev
# Navigate to http://localhost:3000
# Select "Agent Resolutor"
# Choose a client persona
# Watch automatic conversation unfold
```

**Inspect generated datasets:**
```bash
cat dataset/agent-resolutor.jsonl | jq .
```

**Disable dataset saving temporarily:**
Create `.env.local`:
```env
DATASET_SAVE=off
```

**Adjust no-response probability:**
Modify `DEFAULT_NO_RESPONSE_CONFIG` in `src/lib/types.ts` or pass custom config to `useAgentConversation`.
