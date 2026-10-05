'use server';

import { getAuthUser } from '@/lib/auth';
import { RealityCheckInputSchema, RealityCheckResult } from '@/lib/validation/schemas';
import { retrievePersonContext } from '@/lib/retrieval/context';
import { getAIProvider } from '@/lib/ai';
import { getRealityCheckRepository } from '@/repositories/reality-check.repository';
import { RealityCheckDocument } from '@/types';
import { serialize } from '@/lib/serialize';

export interface RunRealityCheckParams {
  personId: string;
  query: string;
  newMessageContent?: string;
  interactionId?: string;
}

export interface RunRealityCheckResponse {
  success: boolean;
  result?: RealityCheckResult;
  realityCheckDocument?: RealityCheckDocument;
  error?: string;
}

/**
 * Phase 4 Reality Check Server Action.
 * 
 * Pipeline:
 * 1. Authenticate user server-side (Client payload user_id ignored).
 * 2. Validate input (personId, query).
 * 3. Retrieve scoped person memory context (user_id + person_id isolation enforced).
 * 4. Call Gemma AI Provider to run evidence-grounded Reality Check reasoning.
 * 5. Validate output with RealityCheckResultSchema.
 * 6. Persist structured Reality Check result to MongoDB (scoped by user_id, person_id, interaction_id).
 * 7. Return structured diagnostic result.
 */
export async function runRealityCheckAction(
  params: RunRealityCheckParams
): Promise<RunRealityCheckResponse> {
  const tActionStart = performance.now();

  const authUser = await getAuthUser();
  if (!authUser || !authUser.user_id) {
    throw new Error('Unauthorized');
  }

  const validatedInput = RealityCheckInputSchema.parse({
    person_id: params.personId,
    query: params.query,
    new_message_content: params.newMessageContent,
  });

  // Retrieve strictly scoped person context (enforces user_id AND person_id)
  const tContextStart = performance.now();
  const context = await retrievePersonContext({
    userId: authUser.user_id,
    personId: validatedInput.person_id,
    query: validatedInput.query,
  });
  const tContextDuration = performance.now() - tContextStart;
  console.log(`[TIMING] [DB/RETRIEVAL] retrievePersonContext | Facts: ${context.facts.length} | Assumptions: ${context.assumptions.length} | Duration: ${tContextDuration.toFixed(2)}ms`);

  const aiProvider = getAIProvider();
  const tAiStart = performance.now();
  const realityCheckResult = await aiProvider.runRealityCheck({
    query: validatedInput.query,
    context,
    newMessageContent: validatedInput.new_message_content || params.newMessageContent,
  });
  const tAiDuration = performance.now() - tAiStart;
  console.log(`[TIMING] [AI] runRealityCheck Pipeline Step | Duration: ${tAiDuration.toFixed(2)}ms`);

  // Persist Reality Check result to MongoDB associated with interaction/person
  const realityCheckRepo = await getRealityCheckRepository();
  const savedDoc = await realityCheckRepo.createRealityCheck({
    person_id: validatedInput.person_id,
    interaction_id: params.interactionId,
    query: validatedInput.query,
    result: realityCheckResult,
  });

  const tActionTotal = performance.now() - tActionStart;
  console.log(`[TIMING] [ACTION] runRealityCheckAction TOTAL | Duration: ${tActionTotal.toFixed(2)}ms`);

  return serialize({
    success: true,
    result: realityCheckResult,
    realityCheckDocument: savedDoc,
  });
}
