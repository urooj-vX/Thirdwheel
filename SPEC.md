# Technical Product Specification: Third Wheel

**Tagline**: *"Receipts, not vibes."*

---

## 1. Product Definition

### 1.1 Overview
**Third Wheel** is a private AI companion that maintains an isolated, evidence-backed memory space for every person a user is talking to. It converts fragmented dating conversations and unstructured narrative updates into a grounded, auditable personal memory system.

### 1.2 Problem Statement
When navigating modern dating and relationships, individuals frequently experience social uncertainty, leading to overthinking and narrative-building based on sparse evidence (e.g., reply delays, punctuation choices, story views). Friends are routinely recruited into "screenshot analysis committees" to manually recall past statements and evaluate intent.

### 1.3 Core Purpose
Third Wheel serves as an objective, privacy-conscious social assistant. Rather than attempting to predict romantic outcomes or read another person's mind, Third Wheel answers one fundamental question:
> **"What do I actually know about this situation?"**

The product systematically separates verifiable **Facts** from user **Assumptions**, tracks missing **Uncertainties**, logs source **Provenance**, and delivers grounded **Reality Checks**.

---

## 2. Core Product Principles

1. **Receipts, Not Vibes**: Every stored fact and system output must be explicitly backed by user-provided evidence. The system never presents unverified assumptions as facts.
2. **Data Isolation Invariant**: Every operation involving a specific person's data MUST be scoped by both `user_id` AND `person_id`. Account-level operations such as user lookup, listing a user's people, and creating a new person are scoped by `user_id` only. The authenticated `user_id` must always be derived server-side and must never be trusted from a client payload.
3. **No Mind-Reading**: The system will NEVER claim to know how another person secretly feels or calculate romantic success probabilities.
4. **User Memory Ownership**: The user owns their memory store. Extracted facts, assumptions, and uncertainties are transparently displayed with provenance and can be corrected, moved, or deleted.
5. **Deterministic Pipeline Validation**: Output from the LLM is never trusted directly for database operations. All extractions must pass schema validation (Zod) and business rules before persistence.

---

## 3. Tech Stack & Commands

### 3.1 Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Next.js Server-side TypeScript (Server Actions & API Routes).
- **Database**: MongoDB Atlas (Document Database).
- **Retrieval**: MongoDB Atlas Vector Search.
- **AI Model**: **Gemma** (Open-weight model as primary reasoning layer).
- **Observability (Stretch)**: Sentry Agent Tracing.

### 3.2 Executable Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Typecheck & Lint
npm run lint

# Unit & Integration Tests
npm test

# End-to-End Tests
npm run test:e2e
```

---

## 4. MVP Scope & Explicit Non-Goals

### 4.1 In-Scope (MVP Capabilities)
1. **People Directory**: Create, list, and view isolated person profiles.
2. **Person Memory Space**: Person-scoped dashboards containing known facts, assumptions, uncertainties, interaction timelines, and open threads.
3. **Interaction Ingestion (Text-Only MVP)**:
   - Paste raw conversation text.
   - Free-form narrative narration (*"Tell me what happened"*).
4. **Structured Extraction Pipeline**: Automatic extraction into distinct categories: Facts, Events, Open Threads, Assumptions, and Uncertainties.
5. **Memory Provenance**: Complete traceability linking every memory item back to its source interaction ID, timestamp, and extraction confidence rating.
6. **Person-Scoped Vector Retrieval**: Atlas Vector Search restricted by `{ user_id, person_id }`.
7. **Evidence-Based Reality Check**: Structured diagnostic tool evaluating known evidence vs. assumptions without predicting intent.
8. **Person-Scoped Conversational Q&A**: Chat interface bound to the active person's memory.
9. **Memory Inspection & Correction**: UI to review, edit, or delete extracted memories.

### 4.2 Explicit Non-Goals (DO NOT BUILD FOR MVP)
- ❌ **Screenshot OCR** *(Deferred to Stretch / Post-MVP)*
- ❌ **Voice / ElevenLabs Integration**
- ❌ **Matchmaking, Compatibility Scoring, or Romantic Probability Calculation**
- ❌ **Psychological Diagnosis or Mind Reading**
- ❌ **Web Search RAG (SerpApi)**
- ❌ **Automated Scraping (WhatsApp / Instagram / Dating Apps)**
- ❌ **Automated Messaging or User Impersonation**
- ❌ **14-Day Social Experiment or Friend Burnout Dashboard**
- ❌ **DigitalOcean GPU Droplet, Temporal, Tiger Data, Arduino, or Mastra orchestration**

---

## 5. User Flows & Screen Structure

### 5.1 User Flows
1. **Flow 1: Person Creation**: User adds a new person profile (e.g., "Arjun") specifying name, status, and optional context.
2. **Flow 2: Ingest Interaction**: User selects active person -> pastes a chat snippet or writes a quick summary of what happened -> clicks "Extract Evidence".
3. **Flow 3: Review Extraction**: System displays extracted Facts, Events, Open Threads, Assumptions, and Uncertainties. User can edit or confirm memory creation.
4. **Flow 4: Reality Check**: User inputs an overthinking query (e.g., *"He hasn't texted back in 5 hours, does he like me?"*) -> System executes scoped retrieval + Gemma reasoning -> Displays structured Reality Check card.
5. **Flow 5: Scoped Q&A**: User asks *"What did he say about coffee?"* -> System queries active person's memories only -> Answers with evidence citation.

### 5.2 Screen Structure (5 Core MVP Screens)
- **Screen 1: People Dashboard (`/people`)**: Grid/list of tracked person profiles with status indicators and an *"Add Person"* button.
- **Screen 2: Person Workspace (`/people/[personId]`)**: Person header, active open threads, feeds for facts/assumptions/uncertainties, interaction timeline, and shortcut to Reality Check.
- **Screen 3: Ingest Interaction Modal/Page (`/people/[personId]/ingest`)**: Tabs for *"Paste Text"* and *"Tell What Happened"*, submit trigger, and extraction preview.
- **Screen 4: Reality Check Panel (`/people/[personId]/reality-check`)**: Query input box, "Run Reality Check" trigger, and response rendering (Facts, Assumptions, Missing Context, Plausible Alternatives, Action Advice).
- **Screen 5: Memory Management Drawer/Page (`/people/[personId]/memories`)**: Full list of extracted memories categorized by Fact, Assumption, and Uncertainty with source metadata, edit inputs, and delete triggers.

---

## 6. System Architecture & AI Pipeline

### 6.1 Architectural Data Flow

```
                      +-------------------+
                      |   Next.js UI      |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      |   Ingestion API   |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      |   Gemma Parser    |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      | Zod Validation    |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      | Business Logic    |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      |   MongoDB Atlas   |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      | Atlas Vector      |
                      |      Search       |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      |  Gemma Reasoning  |
                      +---------+---------+
                                |
                                v
                      +-------------------+
                      | Evidence Response |
                      +-------------------+
```

### 6.2 AI Processing Pipeline Invariant
**Direct DB writes from raw LLM outputs are strictly forbidden.** All Gemma outputs MUST follow this multi-stage execution path:
1. **Gemma Output**: Generates structured JSON adhering to prompt constraints.
2. **Schema Validation**: Parsed through Zod (`ExtractionResultSchema`).
3. **Business Rule Enforcement**: Scoped with derived server-side `user_id` and target `person_id`, extraction confidence thresholds checked.
4. **Persistence**: Saved to MongoDB `memories` (as Fact, Assumption, or Uncertainty), `events`, and `open_threads`.
5. **Embedding Generation**: Vector stored in `embeddings` collection for Atlas Vector Search.

---

## 7. Memory Architecture & Data Isolation Invariants

### 7.1 Critical Data Isolation Invariant
Every operation involving a specific person's data MUST be scoped by both `user_id` AND `person_id`.

Account-level operations such as user lookup, listing a user's people, and creating a new person are scoped by `user_id` only.

The authenticated `user_id` must always be derived server-side (from authenticated session/context) and must never be trusted from a client payload.

```typescript
// MANDATORY SCOPING INTERFACES
export interface UserScopedQuery {
  user_id: string;
}

export interface PersonScopedQuery {
  user_id: string;
  person_id: string;
}
```

### 7.2 Violation Prevention
- **Database Level**: Compound indexes beginning with `user_id` and `person_id`.
- **Vector Search Level**: Pre-filtering configuration in Atlas Vector Search enforcing `user_id` and `person_id` matches.
- **API Level**: Server-side authentication helper (e.g. `getAuthUser()`) extracts `user_id` from session. Client payload `user_id` parameters are ignored.

---

## 8. MongoDB Collections & Domain Model

### 8.1 TypeScript Interfaces & Schemas

#### 1. `users` Collection
```typescript
export interface UserDocument {
  _id?: string; // ObjectId
  user_id: string;
  email: string;
  name: string;
  created_at: Date;
}
```

#### 2. `persons` Collection
```typescript
export interface PersonDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  name: string;
  relationship_status: 'talking' | 'dating' | 'ex' | 'friend' | 'paused';
  summary?: string;
  created_at: Date;
  updated_at: Date;
}
```

#### 3. `interactions` Collection
```typescript
export interface InteractionDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  interaction_id: string;
  source_type: 'pasted_text' | 'narrative';
  raw_content: string;
  timestamp: Date;
  created_at: Date;
}
```

#### 4. `memories` Collection (Facts, Assumptions & Uncertainties)
```typescript
export type MemoryCategory = 'fact' | 'assumption' | 'uncertainty';
export type MemoryType = 'fact' | 'interest' | 'pattern' | 'preference' | 'boundary' | 'assumption' | 'uncertainty';

export interface MemoryDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  memory_id: string;
  source_interaction_id: string;
  category: MemoryCategory; // Distinctly preserves 'fact' | 'assumption' | 'uncertainty'
  memory_type: MemoryType;
  content: string;
  confidence: number; // Extraction confidence (0.0 to 1.0) that claim is supported by source text (NOT real-world probability)
  user_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### 5. `events` Collection (Timeline)
```typescript
export interface EventDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  event_id: string;
  source_interaction_id: string;
  title: string;
  description?: string;
  event_date?: Date;
  created_at: Date;
}
```

#### 6. `open_threads` Collection
```typescript
export interface OpenThreadDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  thread_id: string;
  source_interaction_id: string;
  topic: string; // e.g. "Sunday Coffee Plans"
  status: 'open' | 'resolved' | 'abandoned';
  last_updated: Date;
}
```

#### 7. `embeddings` Collection (Vector Memory)
```typescript
export interface EmbeddingDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  memory_id: string;
  vector: number[]; // 768-dim vector
  content: string;
  created_at: Date;
}
```

### 8.2 Required Database Indexes
```typescript
// Execution script for MongoDB index initialization
// Uniqueness enforced only where semantically appropriate (e.g. user_id + person_id per person)
db.persons.createIndex({ user_id: 1, person_id: 1 }, { unique: true });
db.interactions.createIndex({ user_id: 1, person_id: 1, timestamp: -1 });
db.memories.createIndex({ user_id: 1, person_id: 1, category: 1 });
db.events.createIndex({ user_id: 1, person_id: 1, event_date: -1 });
db.open_threads.createIndex({ user_id: 1, person_id: 1, status: 1 });
db.embeddings.createIndex({ user_id: 1, person_id: 1, memory_id: 1 });
```

---

## 9. Vector Search Strategy

### 9.1 Atlas Vector Search Index Configuration
The MongoDB Atlas Vector Search index `person_memory_vector_index` MUST be configured with pre-filtering on `user_id` and `person_id`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "vector",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "user_id"
    },
    {
      "type": "filter",
      "path": "person_id"
    }
  ]
}
```

### 9.2 Scoped Vector Query Pipeline
```typescript
export async function queryPersonMemories(
  userId: string,
  personId: string,
  queryVector: number[],
  limit = 5
) {
  return await db.collection('embeddings').aggregate([
    {
      $vectorSearch: {
        index: 'person_memory_vector_index',
        path: 'vector',
        queryVector: queryVector,
        numCandidates: limit * 10,
        limit: limit,
        filter: {
          $and: [
            { user_id: { $eq: userId } },
            { person_id: { $eq: personId } }
          ]
        }
      }
    }
  ]).toArray();
}
```

---

## 10. API & Server Boundaries

### 10.1 Server Boundaries
- All database calls and LLM invocations occur strictly within Next.js Server Actions or Route Handlers (`src/app/actions/*`).
- Client components consume typed server actions and render state.

### 10.2 Server Actions Spec

| Action | Client Input | Scoping Enforced Server-Side | Output |
|---|---|---|---|
| `createPersonAction` | `{ name, status }` | `user_id` (from session) | `PersonDocument` |
| `getPersonsAction` | `void` | `user_id` (from session) | `PersonDocument[]` |
| `getPersonDetailsAction` | `{ personId }` | `user_id` (from session) + `personId` | `{ person, facts, assumptions, uncertainties, events, threads }` |
| `ingestInteractionAction` | `{ personId, sourceType, rawContent }` | `user_id` (from session) + `personId` | `ExtractionResult` |
| `runRealityCheckAction` | `{ personId, query }` | `user_id` (from session) + `personId` | `RealityCheckResult` |
| `queryPersonChatAction` | `{ personId, question }` | `user_id` (from session) + `personId` | `ChatAnswerResult` |
| `updateMemoryAction` | `{ memoryId, content }` | `user_id` (from session) + `personId` | `MemoryDocument` |
| `deleteMemoryAction` | `{ memoryId, personId }` | `user_id` (from session) + `personId` | `{ success: boolean }` |

---

## 11. Interaction Ingestion & Structured Extraction Pipeline

### 11.1 Extraction Schema (Zod)
```typescript
import { z } from 'zod';

export const ExtractedMemorySchema = z.object({
  content: z.string().describe('Atomic statement of fact, interest, or observation'),
  memory_type: z.enum(['fact', 'interest', 'pattern', 'preference', 'boundary']),
  confidence: z.number().min(0).max(1).describe("Extraction confidence that claim is supported by source text"),
});

export const ExtractedEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  event_date: z.string().optional(),
});

export const ExtractedOpenThreadSchema = z.object({
  topic: z.string().describe('Unresolved topic or upcoming plan'),
});

export const ExtractedAssumptionSchema = z.object({
  content: z.string().describe('User assumption or subjective interpretation made in input'),
  confidence: z.number().min(0).max(1).describe("Extraction confidence that claim is supported by source text"),
});

export const ExtractedUncertaintySchema = z.object({
  content: z.string().describe('Unclear point or missing detail requiring clarification'),
  confidence: z.number().min(0).max(1).describe("Extraction confidence that claim is supported by source text"),
});

export const ExtractionResultSchema = z.object({
  facts: z.array(ExtractedMemorySchema),
  events: z.array(ExtractedEventSchema),
  open_threads: z.array(ExtractedOpenThreadSchema),
  assumptions: z.array(ExtractedAssumptionSchema),
  uncertainties: z.array(ExtractedUncertaintySchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
```

### 11.2 Mapping Extraction to Persistence
Upon successful extraction:
- `facts` items are saved to `memories` with `category: 'fact'`.
- `assumptions` items are saved to `memories` with `category: 'assumption'` and `memory_type: 'assumption'`.
- `uncertainties` items are saved to `memories` with `category: 'uncertainty'` and `memory_type: 'uncertainty'`.

This preserves distinct classification while avoiding redundant database collections.

### 11.3 Gemma Extraction Prompt Strategy
The Gemma prompt instructs the model to act as a strict information extractor:
- Input: Raw text narration or conversation snippet + Active person name.
- Output: Strict JSON matching `ExtractionResultSchema`.
- Rule: Do not invent facts not contained in the text. Extraction confidence represents how strongly the source text supports the extracted statement, NOT real-world probability.

---

## 12. Provenance Model

### 12.1 Provenance Fields
Every stored memory document contains full provenance metadata:
```typescript
{
  "memory_id": "mem_982341",
  "user_id": "usr_01",
  "person_id": "person_arjun",
  "source_interaction_id": "int_77123",
  "category": "fact",
  "content": "Likes Arsenal football team",
  "memory_type": "interest",
  "confidence": 0.95, // Model confidence that source text supports this claim
  "user_verified": false,
  "created_at": "2026-10-03T02:00:00.000Z"
}
```

### 12.2 UI Provenance Rendering
When a user inspects a memory item, the UI displays:
- Memory content and category badge (`FACT`, `ASSUMPTION`, `UNCERTAINTY`).
- Source interaction timestamp.
- Extract snippet preview (*"Source Interaction #int_77123"*).
- Action buttons: `Verify`, `Edit`, `Delete`.

---

## 13. Reality Check Engine Specification

### 13.1 Objective & Boundaries
The **Reality Check** engine processes user anxiety queries (e.g., *"He viewed my story but hasn't texted back. Is he ignoring me?"*) against the retrieved memory context of the target person.
- **Rule**: NEVER validate unsupported fears or claim knowledge of internal feelings.
- **Output**: Categorized, evidence-grounded analysis.

### 13.2 Reality Check Output Schema (Zod)
```typescript
export const RealityCheckResultSchema = z.object({
  query: z.string(),
  facts_known: z.array(z.string()).describe('Directly supported facts from memory and query'),
  user_assumptions: z.array(z.string()).describe('Unverified assumptions in the user query'),
  missing_unknowns: z.array(z.string()).describe('What is currently unknown about the situation'),
  other_plausible_explanations: z.array(z.string()).describe('Realistic alternative reasons'),
  evidence_strength: z.enum(['INSUFFICIENT', 'LOW', 'MODERATE', 'STRONG']),
  recommended_action: z.string().describe('Practical, grounded advice'),
  closing_quote: z.string().describe('Lighthearted, supportive friend-style closing statement')
});

export type RealityCheckResult = z.infer<typeof RealityCheckResultSchema>;
```

---

## 14. Code Style & Conventions

### 14.1 Server Action Style Example
```typescript
'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function deleteMemoryAction(
  personId: string,
  memoryId: string
) {
  // Always derive authenticated user_id server-side
  const authUser = await getAuthUser();
  if (!authUser || !authUser.user_id) {
    throw new Error('Unauthorized');
  }
  const userId = authUser.user_id;

  if (!personId || !memoryId) {
    throw new Error('Invalid scoping parameters');
  }

  const db = await getDb();
  const result = await db.collection('memories').deleteOne({
    user_id: userId,
    person_id: personId,
    memory_id: memoryId,
  });

  return { success: result.deletedCount === 1 };
}
```

---

## 15. Security, Privacy, and Data Governance

1. **Explicit Consent & Private-First**: All data is user-provided. The app never connects to third-party messaging logins.
2. **Strict Session Auth Scoping**: `user_id` is derived directly from authenticated server-side context/session on every request, never accepted from client payload arguments.
3. **Data Erasure**: Deleting a person profile purges all associated document records (`interactions`, `memories`, `events`, `open_threads`, `embeddings`) across all collections in a batch delete scoped by `{ user_id, person_id }`.

---

## 16. System Boundaries

- **ALWAYS DO**:
  - Derive `user_id` server-side and scope person-specific operations by `{ user_id, person_id }`.
  - Validate all Gemma LLM outputs using Zod before DB writes.
  - Display extraction confidence scores and source provenance for extracted memories.
- **ASK FIRST**:
  - Modifying database collection schemas or adding new collections.
  - Adding third-party NPM packages outside the stack.
- **NEVER DO**:
  - Execute unscoped vector searches across multiple people.
  - Treat extraction confidence as real-world probability of truth.
  - Output psychological diagnoses or romantic outcome probabilities.
  - Attempt to scrape external messaging services.

---

## 17. Validation, Error Handling, and Testing Strategy

### 17.1 Validation
- Zod schema validation at API boundaries and LLM output parsing boundaries.

### 17.2 Error Handling & Fallbacks
- **Gemma Output Parsing Failure**: If Gemma generates malformed JSON, retry extraction once with a JSON repair prompt. If still invalid, fall back to creating an unparsed raw interaction document so user data is never lost.
- **Vector Index Unavailable**: Fall back to chronological keyword search over `memories` filtered by `{ user_id, person_id }`.

### 17.3 Testing Strategy
- **Unit Tests (Vitest)**:
  - Scoped repository query builders.
  - Zod extraction parsers.
  - Reality Check output formatting.
- **Integration Tests**:
  - Person-scoped database query isolation check (verifying Person A queries return 0 records from Person B).
- **End-to-End Test (Playwright)**:
  - Critical Path: Create Person -> Ingest Text Interaction -> Extract Facts/Assumptions/Uncertainties -> Verify Provenance -> Execute Reality Check.

---

## 18. Implementation Plan & Strategy

### 18.1 Incremental Vertical Slice Strategy
Implementation must proceed incrementally through a working vertical slice to validate the complete product loop as early as possible before extensive UI polish or optional infrastructure work.

The first critical vertical slice is:
```
Create Person → Ingest Interaction → Gemma Extraction → Persist Memory → Retrieve Person Memory → Reality Check
```

### 18.2 Implementation Phases

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Tech Spec & Architecture Approval (Completed) │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Domain Model & Person-Scoped DB Layer          │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Gemma Structured Extraction & Ingestion        │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Atlas Vector Search & Scoped RAG Pipeline      │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 5: Reality Check Engine & Q&A Interface           │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 6: Next.js UI Construction & Flow Wiring           │
└────────────────────────────┬────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────┐
│ Phase 7: Verification & Critical Path E2E Testing       │
└────────────────────────────┴────────────────────────────┘
```

---

## 19. Risks, Mitigations, and Decision Log

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Gemma Serving Mechanism / Latency** | High | Abstract LLM call behind an `AIProvider` interface. Support fast endpoint (e.g. Ollama/vLLM/OpenAI-compatible Gemma endpoint) with JSON mode enabled. |
| **Atlas Vector Search Index Latency** | Medium | Provide chronological memory fallback during hackathon demo if vector index creation experiences delay. |
| **Extraction Hallucination** | Medium | Require Zod validation and display extraction confidence scores in UI so users can edit/verify extracted memories. |

---

## 20. Definition of Done (MVP Checkpoints)

- [ ] `SPEC.md` approved by user.
- [ ] MongoDB schemas created with appropriate compound indexes beginning with `user_id` and `person_id`, with uniqueness enforced only where semantically appropriate.
- [ ] Person CRUD operational.
- [ ] Interaction Ingestion working for text paste and free-form narration.
- [ ] Gemma structured extraction correctly parsing facts, assumptions, uncertainties, events, and open threads.
- [ ] Distinct persistence for Facts, Assumptions, and Uncertainties in `memories`.
- [ ] Provenance metadata correctly linked to every extracted memory.
- [ ] Atlas Vector Search retrieving memories scoped strictly by `{ user_id, person_id }`.
- [ ] Reality Check producing categorized evidence vs. assumption diagnostics.
- [ ] End-to-end critical demo path verified without errors.
