'use server';

import { getAuthUser } from '@/lib/auth';
import { RealityCheckInputSchema, RealityCheckResult } from '@/lib/validation/schemas';
import { retrievePersonContext } from '@/lib/retrieval/context';
import { getAIProvider } from '@/lib/ai';
import { serialize } from '@/lib/serialize';

export interface RunRealityCheckParams {
  personId: string;
  query: string;
}

export interface RunRealityCheckResponse {
  success: boolean;
  result?: RealityCheckResult;
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
 * 6. Return structured diagnostic result.
 */
export async function runRealityCheckAction(
  params: RunRealityCheckParams
): Promise<RunRealityCheckResponse> {
  const authUser = await getAuthUser();
  if (!authUser || !authUser.user_id) {
    throw new Error('Unauthorized');
  }

  const validatedInput = RealityCheckInputSchema.parse({
    person_id: params.personId,
    query: params.query,
  });

  // Retrieve strictly scoped person context (enforces user_id AND person_id)
  const context = await retrievePersonContext({
    userId: authUser.user_id,
    personId: validatedInput.person_id,
    query: validatedInput.query,
  });

  const aiProvider = getAIProvider();
  const realityCheckResult = await aiProvider.runRealityCheck({
    query: validatedInput.query,
    context,
  });

  return serialize({
    success: true,
    result: realityCheckResult,
  });
}
