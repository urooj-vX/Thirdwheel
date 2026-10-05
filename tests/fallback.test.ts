import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GemmaAIProvider } from '../src/lib/ai/gemma-provider';

describe('Fallback & Timeout Behavior Unit Test Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('7. Primary model hangs/never responds -> Fallback answers in under 25s total without 500 error', async () => {
    const fallbackResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  conclusion: 'Fallback model answered successfully after primary timed out.',
                  known_facts: ['Arjun likes coffee'],
                  assumptions: [],
                  unknowns: [],
                }),
              },
            ],
          },
        },
      ],
    };

    // Custom mock fetch:
    // If URL contains primary model 'gemini-3.6-flash', simulate hanging until per-attempt signal aborts
    // If URL contains fallback model ('gemini-3.5-flash-lite' or 'gemini-3.8-flash'), answer immediately
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('gemini-3.6-flash')) {
        return new Promise((_, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => fallbackResponse,
      } as Response);
    });

    const provider = new GemmaAIProvider({
      apiKey: 'mock_api_key_test',
      modelName: 'gemini-3.6-flash',
    });

    const startTime = performance.now();
    const result = await provider.runRealityCheck({
      query: 'Does Arjun like coffee?',
      context: {
        personName: 'Arjun',
        relationshipStatus: 'talking',
        summary: 'Met at coffee shop',
        facts: ['Arjun likes coffee'],
        assumptions: [],
        uncertainties: [],
        openThreads: [],
        events: [],
      },
    });
    const totalDuration = performance.now() - startTime;

    console.log(`[TEST RESULT] Fallback Test Total Wall-Clock Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`[TEST RESULT] Conclusion: "${result.conclusion}"`);

    // Assert fallback answered in under 25s (overall deadline)
    expect(totalDuration).toBeLessThan(25000);
    // Assert fallback answer is valid and non-null
    expect(result).toBeDefined();
    expect(result.conclusion).toContain('Fallback model answered successfully');
  }, 30000);
});
