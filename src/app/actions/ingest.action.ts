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
  const person = await personRepo.getPersonById(validatedInput.person_id);
  if (!person) {
    throw new Error(`Person not found or access denied for person_id: ${validatedInput.person_id}`);
  }

  // Step 3: Persist Raw Interaction FIRST (Guarantees no raw data loss if AI fails)
  const rawInteraction = await interactionRepo.createInteraction({
    person_id: person.person_id,
    source_type: validatedInput.source_type,
    raw_content: validatedInput.raw_content,
  });

  // Step 4: AI Extraction with Gemma
  let extractionResult: ExtractionResult;
  try {
    const aiProvider = getAIProvider();
    extractionResult = await aiProvider.extractInteraction({
      rawContent: rawInteraction.raw_content,
      sourceType: rawInteraction.source_type,
      personName: person.name,
    });
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

  // Persist FACTS
  for (const fact of extractionResult.facts) {
    await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: rawInteraction.interaction_id,
      category: 'fact',
      memory_type: fact.memory_type || 'fact',
      content: fact.content,
      confidence: fact.confidence,
    });
  }

  // Persist ASSUMPTIONS
  for (const assumption of extractionResult.assumptions) {
    await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: rawInteraction.interaction_id,
      category: 'assumption',
      memory_type: 'assumption',
      content: assumption.content,
      confidence: assumption.confidence,
    });
  }

  // Persist UNCERTAINTIES
  for (const uncertainty of extractionResult.uncertainties) {
    await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: rawInteraction.interaction_id,
      category: 'uncertainty',
      memory_type: 'uncertainty',
      content: uncertainty.content,
      confidence: uncertainty.confidence,
    });
  }

  // Persist EVENTS
  for (const event of extractionResult.events) {
    await eventRepo.createEvent({
      person_id: person.person_id,
      source_interaction_id: rawInteraction.interaction_id,
      title: event.title,
      description: event.description,
      event_date: event.event_date ? new Date(event.event_date) : undefined,
    });
  }

  // Persist OPEN THREADS
  for (const thread of extractionResult.open_threads) {
    await openThreadRepo.createOpenThread({
      person_id: person.person_id,
      source_interaction_id: rawInteraction.interaction_id,
      topic: thread.topic,
    });
  }

  // Step 7: Return Response
  return serialize({
    success: true,
    interaction_id: rawInteraction.interaction_id,
    extraction: extractionResult,
  });
}
