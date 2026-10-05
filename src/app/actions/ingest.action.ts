'use server';

import { getAuthUser } from '@/lib/auth';
import { CreateInteractionInputSchema, ExtractionResult } from '@/lib/validation/schemas';
import { getPersonRepository } from '@/repositories/person.repository';
import { getInteractionRepository } from '@/repositories/interaction.repository';
import { getMemoryRepository } from '@/repositories/memory.repository';
import { getEventRepository } from '@/repositories/event.repository';
import { getOpenThreadRepository } from '@/repositories/open-thread.repository';
import { getAIProvider } from '@/lib/ai';
import { serialize } from '@/lib/serialize';

export interface IngestInteractionParams {
  personId: string;
  sourceType: 'pasted_text' | 'narrative';
  rawContent: string;
}

export interface IngestInteractionResponse {
  success: boolean;
  interaction_id: string;
  extraction?: ExtractionResult;
  error?: string;
}

/**
 * Core Phase 3 Interaction Ingestion Pipeline Server Action.
 * 
 * Pipeline:
 * 1. Authenticate user server-side.
 * 2. Verify target person belongs to authenticated user.
 * 3. Persist raw interaction FIRST to MongoDB.
 * 4. Invoke Gemma AI Provider for structured extraction.
 * 5. Validate extraction result with Zod.
 * 6. Persist extracted memories (FACT, ASSUMPTION, UNCERTAINTY), events, and open threads with provenance.
 * 7. Return structured extraction response.
 */
export async function ingestInteractionAction(
  params: IngestInteractionParams
): Promise<IngestInteractionResponse> {
  const tActionStart = performance.now();

  // Step 1: Server-side Authentication (Client payload user_id ignored)
  const authUser = await getAuthUser();
  if (!authUser || !authUser.user_id) {
    throw new Error('Unauthorized');
  }

  // Input Validation
  const validatedInput = CreateInteractionInputSchema.parse({
    person_id: params.personId,
    source_type: params.sourceType,
    raw_content: params.rawContent,
  });

  const personRepo = await getPersonRepository();
  const interactionRepo = await getInteractionRepository();

  // Step 2: Verify Person Ownership for Authenticated User
  const tDbPersonStart = performance.now();
  const person = await personRepo.getPersonById(validatedInput.person_id);
  const tDbPersonDuration = performance.now() - tDbPersonStart;
  console.log(`[TIMING] [DB] getPersonById | Duration: ${tDbPersonDuration.toFixed(2)}ms`);

  if (!person) {
    throw new Error(`Person not found or access denied for person_id: ${validatedInput.person_id}`);
  }

  // Step 3: Persist Raw Interaction FIRST (Guarantees no raw data loss if AI fails)
  const tDbInteractionStart = performance.now();
  const rawInteraction = await interactionRepo.createInteraction({
    person_id: person.person_id,
    source_type: validatedInput.source_type,
    raw_content: validatedInput.raw_content,
  });
  const tDbInteractionDuration = performance.now() - tDbInteractionStart;
  console.log(`[TIMING] [DB] createInteraction | Duration: ${tDbInteractionDuration.toFixed(2)}ms`);

  // Step 4: AI Extraction with Gemma
  let extractionResult: ExtractionResult;
  try {
    const aiProvider = getAIProvider();
    const tAiStart = performance.now();
    extractionResult = await aiProvider.extractInteraction({
      rawContent: rawInteraction.raw_content,
      sourceType: rawInteraction.source_type,
      personName: person.name,
    });
    const tAiDuration = performance.now() - tAiStart;
    console.log(`[TIMING] [AI] extractInteraction Pipeline Step | Duration: ${tAiDuration.toFixed(2)}ms`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'AI Extraction Failed';
    // Raw interaction remains safely persisted in MongoDB!
    return serialize({
      success: false,
      interaction_id: rawInteraction.interaction_id,
      error: errorMsg,
    });
  }

  // Step 5 & 6: Persist Extracted Records with Full Provenance
  const memoryRepo = await getMemoryRepository();
  const eventRepo = await getEventRepository();
  const openThreadRepo = await getOpenThreadRepository();

  const tDbPersistStart = performance.now();
  // Persist all extracted records concurrently with Promise.all
  await Promise.all([
    ...extractionResult.facts.map((fact) =>
      memoryRepo.createMemory({
        person_id: person.person_id,
        source_interaction_id: rawInteraction.interaction_id,
        category: 'fact',
        memory_type: fact.memory_type || 'fact',
        content: fact.content,
        confidence: fact.confidence,
      })
    ),
    ...extractionResult.assumptions.map((assumption) =>
      memoryRepo.createMemory({
        person_id: person.person_id,
        source_interaction_id: rawInteraction.interaction_id,
        category: 'assumption',
        memory_type: 'assumption',
        content: assumption.content,
        confidence: assumption.confidence,
      })
    ),
    ...extractionResult.uncertainties.map((uncertainty) =>
      memoryRepo.createMemory({
        person_id: person.person_id,
        source_interaction_id: rawInteraction.interaction_id,
        category: 'uncertainty',
        memory_type: 'uncertainty',
        content: uncertainty.content,
        confidence: uncertainty.confidence,
      })
    ),
    ...extractionResult.events.map((event) =>
      eventRepo.createEvent({
        person_id: person.person_id,
        source_interaction_id: rawInteraction.interaction_id,
        title: event.title,
        description: event.description,
        event_date: event.event_date ? new Date(event.event_date) : undefined,
      })
    ),
    ...extractionResult.open_threads.map((thread) =>
      openThreadRepo.createOpenThread({
        person_id: person.person_id,
        source_interaction_id: rawInteraction.interaction_id,
        topic: thread.topic,
      })
    ),
  ]);
  const tDbPersistDuration = performance.now() - tDbPersistStart;
  console.log(`[TIMING] [DB] persistExtractedMemories | Items: ${extractionResult.facts.length + extractionResult.assumptions.length + extractionResult.uncertainties.length} | Duration: ${tDbPersistDuration.toFixed(2)}ms`);

  const tActionTotal = performance.now() - tActionStart;
  console.log(`[TIMING] [ACTION] ingestInteractionAction TOTAL | Duration: ${tActionTotal.toFixed(2)}ms`);

  // Step 7: Return Response
  return serialize({
    success: true,
    interaction_id: rawInteraction.interaction_id,
    extraction: extractionResult,
  });
}
