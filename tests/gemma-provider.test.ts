import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GemmaAIProvider } from '../src/lib/ai/gemma-provider';

describe('GemmaAIProvider Unit Test Suite (Mocked Network)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('1. Initializes with default gemma-4-31b-it model and native generateContent endpoint structure', () => {
    const provider = new GemmaAIProvider({ apiKey: 'test_api_key' });
    expect(provider.modelName).toBe('gemma-4-31b-it');
  });

  it('2. Throws explicit configuration error if API key is missing', async () => {
    const provider = new GemmaAIProvider({ apiKey: '' });
    await expect(
      provider.extractInteraction({
        rawContent: 'Test content',
        sourceType: 'pasted_text',
        personName: 'Arjun',
      })
    ).rejects.toThrow('Gemma API Key or local endpoint URL not configured');
  });

  it('3. Successfully parses native generateContent response and validates through Zod', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  facts: [
                    {
                      content: 'Likes Arsenal',
                      memory_type: 'interest',
                      confidence: 0.95,
                    },
                  ],
                  events: [],
                  open_threads: [{ topic: 'Coffee plan' }],
                  assumptions: [],
                  uncertainties: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const provider = new GemmaAIProvider({ apiKey: 'mock_api_key' });
    const result = await provider.extractInteraction({
      rawContent: 'Arjun likes Arsenal and discussed coffee.',
      sourceType: 'pasted_text',
      personName: 'Arjun',
    });

    expect(result.facts.length).toBe(1);
    expect(result.facts[0].content).toBe('Likes Arsenal');
    expect(result.open_threads.length).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('4. Retries once with repair prompt if initial response fails Zod schema validation', async () => {
    const invalidMockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Invalid JSON response string' }],
          },
        },
      ],
    };

    const validMockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  facts: [
                    {
                      content: 'Repaired fact',
                      memory_type: 'fact',
                      confidence: 0.9,
                    },
                  ],
                  events: [],
                  open_threads: [],
                  assumptions: [],
                  uncertainties: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidMockResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validMockResponse,
      } as Response);

    const provider = new GemmaAIProvider({ apiKey: 'mock_api_key' });
    const result = await provider.extractInteraction({
      rawContent: 'Test text needing repair',
      sourceType: 'narrative',
      personName: 'Arjun',
    });

    expect(result.facts[0].content).toBe('Repaired fact');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
