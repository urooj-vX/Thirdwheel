import { AIProvider, ExtractionInput, RealityCheckAIInput } from './types';
import {
  ExtractionResult,
  ExtractionResultSchema,
  RealityCheckResult,
  RealityCheckResultSchema,
} from '@/lib/validation/schemas';

export class MockAIProvider implements AIProvider {
  /**
   * Deterministic mock extractor for testing without live Gemma API calls.
   */
  async extractInteraction(input: ExtractionInput): Promise<ExtractionResult> {
    const text = input.rawContent;

    const result: ExtractionResult = {
      facts: [],
      events: [],
      open_threads: [],
      assumptions: [],
      uncertainties: [],
    };

    if (text.toLowerCase().includes('arsenal')) {
      result.facts.push({
        content: `${input.personName} likes Arsenal`,
        memory_type: 'interest',
        confidence: 0.95,
      });
    }

    if (text.toLowerCase().includes('coffee')) {
      result.facts.push({
        content: `${input.personName} wants to try the coffee place near campus`,
        memory_type: 'preference',
        confidence: 0.9,
      });
      result.open_threads.push({
        topic: 'Possible Sunday coffee plan',
      });
    }

    if (
      text.toLowerCase().includes('assum') ||
      text.toLowerCase().includes('think he') ||
      text.toLowerCase().includes('maybe he')
    ) {
      result.assumptions.push({
        content: `User interpretation regarding ${input.personName}`,
        confidence: 0.7,
      });
    }

    if (
      text.toLowerCase().includes('uncertain') ||
      text.toLowerCase().includes('not sure') ||
      text.toLowerCase().includes('wondering')
    ) {
      result.uncertainties.push({
        content: `Uncertain whether ${input.personName} will confirm weekend plans`,
        confidence: 0.6,
      });
    }

    if (
      text.toLowerCase().includes('sunday') ||
      text.toLowerCase().includes('date') ||
      text.toLowerCase().includes('met')
    ) {
      result.events.push({
        title: `Interaction with ${input.personName}`,
        description: 'Mentioned in submitted conversation',
      });
    }

    if (
      result.facts.length === 0 &&
      result.assumptions.length === 0 &&
      result.uncertainties.length === 0 &&
      result.open_threads.length === 0 &&
      result.events.length === 0
    ) {
      result.facts.push({
        content: `Extracted fact from interaction with ${input.personName}`,
        memory_type: 'fact',
        confidence: 0.85,
      });
    }

    return ExtractionResultSchema.parse(result);
  }

  /**
   * Deterministic mock Reality Check engine for testing.
   */
  async runRealityCheck(input: RealityCheckAIInput): Promise<RealityCheckResult> {
    const ctx = input.context;
    const queryLower = input.query.toLowerCase();

    const knownFacts: string[] = [...ctx.facts];
    const userAssumptions: string[] = [...ctx.assumptions];
    const missingUnknowns: string[] = [];

    let evidenceStrength: 'INSUFFICIENT' | 'LOW' | 'MODERATE' | 'STRONG' = 'INSUFFICIENT';

    if (queryLower.includes('like me') || queryLower.includes('feel') || queryLower.includes('story')) {
      userAssumptions.push('Viewing a story or delayed response implies romantic loss of interest.');
      missingUnknowns.push(`Why ${ctx.personName} has not replied yet.`);
      missingUnknowns.push(`${ctx.personName}'s actual schedule or internal feelings.`);
      evidenceStrength = 'INSUFFICIENT';
    } else if (knownFacts.length > 0) {
      evidenceStrength = 'MODERATE';
    }

    const result: RealityCheckResult = {
      query: input.query,
      known_facts: knownFacts,
      assumptions: userAssumptions,
      unknowns: missingUnknowns.length > 0 ? missingUnknowns : [`Current intentions of ${ctx.personName}`],
      evidence_strength: evidenceStrength,
      conclusion:
        evidenceStrength === 'INSUFFICIENT'
          ? `There is insufficient evidence to determine whether ${ctx.personName} is losing interest. Avoid double-texting based on story views.`
          : `Based on recorded memories, ${ctx.personName} has discussed ${ctx.facts.slice(0, 2).join(', ')}.`,
      closing_quote: 'Go drink some water and put down your phone! 😂',
    };

    return RealityCheckResultSchema.parse(result);
  }
}
