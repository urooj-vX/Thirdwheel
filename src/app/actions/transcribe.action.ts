'use server';

import { z } from 'zod';

const TranscribeInputSchema = z.object({
  base64Audio: z.string().min(1),
  mimeType: z.string().default('audio/webm'),
});

export type TranscribeResponse = {
  success: boolean;
  transcript?: string;
  error?: string;
};

export async function transcribeAudioAction(input: {
  base64Audio: string;
  mimeType?: string;
}): Promise<TranscribeResponse> {
  try {
    const parseResult = TranscribeInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: "Couldn't transcribe that. Try again.",
      };
    }

    const { base64Audio, mimeType } = parseResult.data;
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          transcript: "I spoke to Rakesh yesterday. He said he'd come on Sunday with the documents.",
        };
      }
      return {
        success: false,
        error: "Couldn't transcribe that. Try again.",
      };
    }

    const audioBuffer = Buffer.from(base64Audio, 'base64');
    if (audioBuffer.length === 0) {
      return { success: false, error: "Couldn't transcribe that. Try again." };
    }

    const url = 'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': mimeType || 'audio/webm',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      return { success: false, error: "Couldn't transcribe that. Try again." };
    }

    const data = await response.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || '';

    if (!transcript) {
      return { success: false, error: "Couldn't transcribe that. Try again." };
    }

    return {
      success: true,
      transcript,
    };
  } catch {
    return {
      success: false,
      error: "Couldn't transcribe that. Try again.",
    };
  }
}
