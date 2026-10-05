import { describe, it, expect, vi } from 'vitest';
import { transcribeAudioAction } from '@/app/actions/transcribe.action';

describe('Voice Transcription Action Unit Test Suite', () => {
  it('1. Returns success and transcript in test environment mock fallback', async () => {
    const res = await transcribeAudioAction({
      base64Audio: 'SGVsbG8gd29ybGQ=',
      mimeType: 'audio/webm',
    });

    expect(res.success).toBe(true);
    expect(res.transcript).toBeDefined();
    expect(typeof res.transcript).toBe('string');
  });

  it('2. Handles empty base64 audio gracefully with clean error message', async () => {
    const originalApiKey = process.env.DEEPGRAM_API_KEY;
    process.env.DEEPGRAM_API_KEY = 'mock_test_key_123';

    try {
      const res = await transcribeAudioAction({
        base64Audio: '',
        mimeType: 'audio/webm',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Couldn't transcribe that. Try again.");
    } finally {
      process.env.DEEPGRAM_API_KEY = originalApiKey;
    }
  });

  it('3. Handles API failure without crashing or leaking raw stack trace', async () => {
    const originalApiKey = process.env.DEEPGRAM_API_KEY;
    process.env.DEEPGRAM_API_KEY = 'invalid_mock_key';

    // Mock fetch to simulate 401/500 error from Deepgram
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    try {
      const res = await transcribeAudioAction({
        base64Audio: 'dGVzdGF1ZGlvYnVmZmVy',
        mimeType: 'audio/webm',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Couldn't transcribe that. Try again.");
    } finally {
      global.fetch = originalFetch;
      process.env.DEEPGRAM_API_KEY = originalApiKey;
    }
  });
});
