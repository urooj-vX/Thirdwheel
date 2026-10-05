import { ExtractionResult, RealityCheckResult } from '@/lib/validation/schemas';
import { InteractionSourceType } from '@/types';
import { PersonContext } from '@/lib/retrieval/context';

export interface ExtractionInput {
  rawContent: string;
  sourceType: InteractionSourceType;
  personName: string;
}

export interface RealityCheckAIInput {
  query: string;
  context: PersonContext;
  newMessageContent?: string;
}

export interface AIProvider {
  /**
   * Extracts structured information (facts, events, open threads, assumptions, uncertainties)
   * from an interaction input using Gemma.
   */
  extractInteraction(input: ExtractionInput): Promise<ExtractionResult>;

  /**
   * Evaluates user query against scoped person memory context and generates an evidence-grounded
   * Reality Check response using Gemma.
   */
  runRealityCheck(input: RealityCheckAIInput): Promise<RealityCheckResult>;
}
