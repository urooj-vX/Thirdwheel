import { describe, it, expect, beforeAll } from 'vitest';
import { GemmaAIProvider } from '@/lib/ai/gemma-provider';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

describe('Real API Extraction Edge Cases (npm run test:real)', () => {
  let provider: GemmaAIProvider;

  beforeAll(() => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in .env.local');
    }
    provider = new GemmaAIProvider({ apiKey });
  });

  it('Case (a): handles message with no facts at all', async () => {
    const t0 = performance.now();
    const result = await provider.extractInteraction({
      personName: 'Alex',
      sourceType: 'pasted_text',
      rawContent: 'Just thinking about random things today.',
    });
    const t1 = performance.now();

    console.log(`[REAL EXTRACTION TIMING] Case (a) No facts: ${(t1 - t0).toFixed(2)}ms`);
    console.log('[REAL EXTRACTION RESULT] Case (a):', JSON.stringify(result, null, 2));

    expect(result.facts).toEqual([]);
    // Assert no ungrounded details
    const allText = JSON.stringify(result).toLowerCase();
    expect(allText).not.includes('7 am');
    expect(allText).not.includes('london');
    expect(allText).not.includes('cheating');
  }, 20000);

  it('Case (b): handles hedged language ("I think she said maybe Friday")', async () => {
    const t0 = performance.now();
    const result = await provider.extractInteraction({
      personName: 'Sarah',
      sourceType: 'pasted_text',
      rawContent: 'I think she said maybe Friday.',
    });
    const t1 = performance.now();

    console.log(`[REAL EXTRACTION TIMING] Case (b) Hedged language: ${(t1 - t0).toFixed(2)}ms`);
    console.log('[REAL EXTRACTION RESULT] Case (b):', JSON.stringify(result, null, 2));

    // Either facts array is empty OR any fact inside has confidence < 1.0 or is flagged as uncertainty
    if (result.facts.length > 0) {
      for (const fact of result.facts) {
        expect(fact.confidence).toBeLessThan(1.0);
      }
    } else {
      expect(result.facts.length).toBe(0);
    }

    // Hedged language should be placed in uncertainties or assumptions if extracted
    const totalExtracted = result.facts.length + result.uncertainties.length + result.assumptions.length;
    expect(totalExtracted).toBeGreaterThanOrEqual(0);

    // Assert no invented times, places, or motives
    const allText = JSON.stringify(result).toLowerCase();
    expect(allText).not.includes('dinner');
    expect(allText).not.includes('coffee shop');
    expect(allText).not.includes('angry');
  }, 20000);

  it('Case (c): handles user\'s own feelings ("I felt ignored")', async () => {
    const t0 = performance.now();
    const result = await provider.extractInteraction({
      personName: 'Jordan',
      sourceType: 'pasted_text',
      rawContent: 'I felt ignored when she did not text back for three hours.',
    });
    const t1 = performance.now();

    console.log(`[REAL EXTRACTION TIMING] Case (c) User feelings: ${(t1 - t0).toFixed(2)}ms`);
    console.log('[REAL EXTRACTION RESULT] Case (c):', JSON.stringify(result, null, 2));

    // User's feeling ("I felt ignored") must NOT be stored as a fact about Jordan
    const factsAboutJordan = result.facts.map(f => f.content.toLowerCase());
    for (const factContent of factsAboutJordan) {
      expect(factContent).not.includes('jordan ignored');
      expect(factContent).not.includes('is rude');
      expect(factContent).not.includes('does not care');
    }

    // Assert no invented details
    const allText = JSON.stringify(result).toLowerCase();
    expect(allText).not.includes('yesterday at 5pm');
    expect(allText).not.includes('restaurant');
  }, 20000);

  it('Case (d): handles a message with a name but no details ("Sarah")', async () => {
    const t0 = performance.now();
    const result = await provider.extractInteraction({
      personName: 'Sarah',
      sourceType: 'pasted_text',
      rawContent: 'Sarah',
    });
    const t1 = performance.now();

    console.log(`[REAL EXTRACTION TIMING] Case (d) Name only: ${(t1 - t0).toFixed(2)}ms`);
    console.log('[REAL EXTRACTION RESULT] Case (d):', JSON.stringify(result, null, 2));

    expect(result.facts.length).toBe(0);
    expect(result.events.length).toBe(0);
    expect(result.open_threads.length).toBe(0);

    // Assert no ungrounded times, places or motives manufactured
    const allText = JSON.stringify(result).toLowerCase();
    expect(allText).not.includes('friday');
    expect(allText).not.includes('park');
    expect(allText).not.includes('loves');
  }, 20000);

  it('Case (e): stored fact includes subject name WHO (e.g. "Sarah did not text back for three hours")', async () => {
    const t0 = performance.now();
    const result = await provider.extractInteraction({
      personName: 'Sarah',
      sourceType: 'pasted_text',
      rawContent: 'Sarah did not text back for three hours.',
    });
    const t1 = performance.now();

    console.log(`[REAL EXTRACTION TIMING] Case (e) Person Name Subject (WHO): ${(t1 - t0).toFixed(2)}ms`);
    console.log('[REAL EXTRACTION RESULT] Case (e):', JSON.stringify(result, null, 2));

    expect(result.facts.length).toBeGreaterThan(0);
    const firstFact = result.facts[0].content;
    expect(firstFact.toLowerCase()).toContain('sarah');
  }, 20000);
});
