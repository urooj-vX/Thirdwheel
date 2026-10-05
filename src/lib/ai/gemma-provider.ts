import { AIProvider, ExtractionInput, RealityCheckAIInput } from './types';
import {
  ExtractionResult,
  ExtractionResultSchema,
  RealityCheckResult,
  RealityCheckResultSchema,
} from '@/lib/validation/schemas';
import {
  SYSTEM_EXTRACTION_INSTRUCTIONS,
  buildExtractionUserPrompt,
  SYSTEM_REALITY_CHECK_INSTRUCTIONS,
  buildRealityCheckUserPrompt,
} from './prompts';
import {
  DEFAULT_REALITY_CHECK_MODEL,
  EXCLUDED_MODELS,
  getRealityCheckCandidateModels,
  getExtractionCandidateModels,
  REALITY_CHECK_PER_ATTEMPT_TIMEOUT_MS,
  EXTRACTION_PER_ATTEMPT_TIMEOUT_MS,
  OVERALL_DEADLINE_MS,
} from '@/config/model.config';

export interface GemmaProviderConfig {
  apiKey?: string;
  endpointUrl?: string;
  modelName?: string;
}

export class GemmaAIProvider implements AIProvider {
  private apiKey: string;
  private endpointUrl?: string;
  public modelName: string;

  constructor(config?: GemmaProviderConfig) {
    this.apiKey = config?.apiKey || process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY || '';

    let rawModel = config?.modelName;
    if (!rawModel) {
      if (process.env.USE_REAL_GEMMA === 'false') {
        rawModel = DEFAULT_REALITY_CHECK_MODEL;
      } else {
        rawModel = process.env.GEMMA_MODEL_NAME || DEFAULT_REALITY_CHECK_MODEL;
      }
    }
    if (EXCLUDED_MODELS.includes(rawModel)) {
      rawModel = DEFAULT_REALITY_CHECK_MODEL;
    }

    this.modelName = rawModel;
    this.endpointUrl = config?.endpointUrl || process.env.GEMMA_ENDPOINT_URL;
  }

  async extractInteraction(input: ExtractionInput): Promise<ExtractionResult> {
    const userPrompt = buildExtractionUserPrompt(input);
    const candidateModels = getExtractionCandidateModels(process.env.GEMMA_EXTRACTION_MODEL_NAME);

    console.log(
      `[TIMING] [AI Provider] Extraction Startup | Candidate model order: [${candidateModels.join(', ')}]`
    );

    let rawOutput = await this.callGemmaEndpoint({
      systemInstruction: SYSTEM_EXTRACTION_INSTRUCTIONS,
      prompt: userPrompt,
      useJsonMimeType: true,
      candidateModels,
      perAttemptTimeoutMs: EXTRACTION_PER_ATTEMPT_TIMEOUT_MS,
      actionLabel: 'Extraction',
    });
    let parsedJson = this.safeParseJson(rawOutput);

    // Initial Zod validation attempt
    let validation =
      parsedJson !== null
        ? ExtractionResultSchema.safeParse(parsedJson)
        : { success: false, error: new Error('Invalid JSON format') };

    // Single retry with repair instruction if initial parsing or Zod validation failed
    if (!validation.success) {
      const repairPrompt = `The previous response failed schema validation. Output ONLY raw JSON matching this structure without Markdown formatting:\n\n${userPrompt}`;
      rawOutput = await this.callGemmaEndpoint({
        systemInstruction: SYSTEM_EXTRACTION_INSTRUCTIONS,
        prompt: repairPrompt,
        useJsonMimeType: true,
        candidateModels,
        perAttemptTimeoutMs: EXTRACTION_PER_ATTEMPT_TIMEOUT_MS,
        actionLabel: 'Extraction-Repair',
      });
      parsedJson = this.safeParseJson(rawOutput);
      validation =
        parsedJson !== null
          ? ExtractionResultSchema.safeParse(parsedJson)
          : { success: false, error: new Error('Invalid JSON format on retry') };
    }

    if (!validation.success) {
      const errMsg = 'error' in validation && validation.error ? validation.error.message : 'Invalid JSON format';
      throw new Error(`Gemma extraction schema validation failed: ${errMsg}`);
    }

    return (validation as { success: true; data: ExtractionResult }).data;
  }

  async runRealityCheck(input: RealityCheckAIInput): Promise<RealityCheckResult> {
    const userPrompt = buildRealityCheckUserPrompt(input);
    const candidateModels = getRealityCheckCandidateModels(this.modelName);

    console.log(
      `[TIMING] [AI Provider] RealityCheck Startup | Candidate model order: [${candidateModels.join(', ')}]`
    );

    let rawOutput = await this.callGemmaEndpoint({
      systemInstruction: SYSTEM_REALITY_CHECK_INSTRUCTIONS,
      prompt: userPrompt,
      useJsonMimeType: true,
      candidateModels,
      perAttemptTimeoutMs: REALITY_CHECK_PER_ATTEMPT_TIMEOUT_MS,
      actionLabel: 'RealityCheck',
    });
    let parsedJson = this.safeParseJson(rawOutput);

    let validation =
      parsedJson !== null
        ? RealityCheckResultSchema.safeParse(parsedJson)
        : { success: false, error: new Error('Invalid JSON format') };

    if (!validation.success) {
      const repairPrompt = `The previous response failed schema validation. Output ONLY raw JSON matching this structure without Markdown formatting:\n\n${userPrompt}`;
      rawOutput = await this.callGemmaEndpoint({
        systemInstruction: SYSTEM_REALITY_CHECK_INSTRUCTIONS,
        prompt: repairPrompt,
        useJsonMimeType: true,
        candidateModels,
        perAttemptTimeoutMs: REALITY_CHECK_PER_ATTEMPT_TIMEOUT_MS,
        actionLabel: 'RealityCheck-Repair',
      });
      parsedJson = this.safeParseJson(rawOutput);
      validation =
        parsedJson !== null
          ? RealityCheckResultSchema.safeParse(parsedJson)
          : { success: false, error: new Error('Invalid JSON format on retry') };
    }

    if (!validation.success) {
      const errMsg = 'error' in validation && validation.error ? validation.error.message : 'Invalid JSON format';
      throw new Error(`Gemma Reality Check schema validation failed: ${errMsg}`);
    }

    return (validation as { success: true; data: RealityCheckResult }).data;
  }

  private async callGemmaEndpoint(params: {
    systemInstruction: string;
    prompt: string;
    useJsonMimeType?: boolean;
    candidateModels: string[];
    perAttemptTimeoutMs: number;
    actionLabel: string;
  }): Promise<string> {
    const {
      systemInstruction,
      prompt,
      useJsonMimeType = false,
      candidateModels,
      perAttemptTimeoutMs,
      actionLabel = 'ModelCall',
    } = params;

    if (!this.apiKey && (!this.endpointUrl || !this.endpointUrl.includes('localhost'))) {
      throw new Error(
        'Gemma API Key or local endpoint URL not configured. Set GEMMA_API_KEY or GEMMA_ENDPOINT_URL in environment.'
      );
    }

    const generationConfig: Record<string, unknown> = {
      temperature: 0.1,
    };

    if (useJsonMimeType) {
      generationConfig.responseMimeType = 'application/json';
    }

    const combinedPrompt = `${systemInstruction}\n\n${prompt}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: combinedPrompt }],
        },
      ],
      generationConfig,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const promptCharCount = combinedPrompt.length;
    let overallLastError: Error | null = null;
    const attemptsHistory: string[] = [];

    // Shared 25-second overall deadline AbortController across entire candidate fallback chain
    const overallController = new AbortController();
    const overallTimeoutId = setTimeout(() => {
      overallController.abort();
    }, OVERALL_DEADLINE_MS);

    try {
      for (const activeModel of candidateModels) {
        let attempt = 0;
        const max500Retries = 1; // Retry same model ONLY on quick 500/503, max once

        while (attempt <= max500Retries) {
          if (overallController.signal.aborted) {
            console.warn(
              `[TIMING] [OVERALL 25s DEADLINE EXPIRED] Aborting model chain. Attempts: ${attemptsHistory.join(' -> ')}`
            );
            throw new Error("Couldn't get an answer right now. Your receipts are safe.");
          }

          if (attempt > 0) {
            console.log(`[TIMING] [Gemma AI] Retry attempt 2/2 for model ${activeModel} after 500ms backoff on 500/503...`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          const attemptRecord = `${activeModel} (Attempt ${attempt + 1})`;
          attemptsHistory.push(attemptRecord);

          console.log(
            `[TIMING] [REAL AI Model] ${actionLabel} started | Model: ${activeModel} | Timeout: ${perAttemptTimeoutMs}ms | Attempt: ${attempt + 1}`
          );

          const callStartTime = performance.now();
          const targetUrl =
            this.endpointUrl ||
            `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;

          try {
            const perCallController = new AbortController();
            const perCallTimeoutId = setTimeout(() => perCallController.abort(), perAttemptTimeoutMs);

            const onOverallAbort = () => perCallController.abort();
            overallController.signal.addEventListener('abort', onOverallAbort);

            const fetchStart = performance.now();
            let response: Response;
            try {
              response = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: perCallController.signal,
              });
            } finally {
              clearTimeout(perCallTimeoutId);
              overallController.signal.removeEventListener('abort', onOverallAbort);
            }

            const fetchDuration = performance.now() - fetchStart;

            if (response.status === 500 || response.status === 503) {
              const errText = await response.text();
              console.error(`[TIMING] [REAL AI Model] HTTP ${response.status} on ${activeModel}:`, errText);
              overallLastError = new Error(`Gemma API call (${activeModel}) failed (${response.status}): ${errText}`);
              if (attempt < max500Retries) {
                attempt++;
                continue; // Retry same model once for 500/503
              } else {
                console.warn(`[FALLBACK] Model ${activeModel} failed on 500/503 retry. Falling back to next candidate model...`);
                break; // Move to next candidate model
              }
            }

            if (!response.ok) {
              const errText = await response.text();
              console.error(`[TIMING] [REAL AI Model] HTTP ${response.status} on ${activeModel}:`, errText);
              overallLastError = new Error(`Gemma API call (${activeModel}) failed (${response.status}): ${errText}`);
              console.warn(`[FALLBACK] Model ${activeModel} returned HTTP ${response.status}. Falling back to next model...`);
              break; // Do not retry non-500/503 errors, move immediately to next candidate model
            }

            const data = await response.json();
            const totalDuration = performance.now() - callStartTime;
            console.log(
              `[TIMING] [REAL AI Model] ${actionLabel} SUCCESS | Model used: ${activeModel} answered | Prompt Chars: ${promptCharCount} (~${Math.round(
                promptCharCount / 4
              )} tokens) | Duration: ${totalDuration.toFixed(2)}ms | HTTP: ${fetchDuration.toFixed(
                2
              )}ms | Total Attempts Executed: [${attemptsHistory.join(', ')}]`
            );

            const parts = data.candidates?.[0]?.content?.parts || [];
            const nonThoughtParts = parts.filter((p: { thought?: boolean; text?: string }) => !p.thought);
            const targetParts = nonThoughtParts.length > 0 ? nonThoughtParts : parts;
            const content = targetParts
              .map((p: { text?: string }) => p.text || '')
              .join('\n')
              .trim();

            if (!content) {
              throw new Error(`Gemma API returned empty response content for model ${activeModel}.`);
            }

            return content;
          } catch (err: unknown) {
            const errObj = err instanceof Error ? err : new Error(String(err));
            overallLastError = errObj;

            if (overallController.signal.aborted) {
              console.warn(
                `[TIMING] [OVERALL 25s DEADLINE EXPIRED] Aborted during ${activeModel}. Attempts: ${attemptsHistory.join(', ')}`
              );
              throw new Error("Couldn't get an answer right now. Your receipts are safe.");
            }

            // Per-attempt timeout or abort -> Move immediately to next model without retrying same model
            console.warn(
              `[FALLBACK] Model ${activeModel} failed/timed out (${errObj.message}). Moving immediately to next candidate model...`
            );
            break; // Try next candidate model immediately
          }
        }
      }

      if (overallController.signal.aborted) {
        throw new Error("Couldn't get an answer right now. Your receipts are safe.");
      }

      throw overallLastError || new Error('Gemma API call failed across all candidate models.');
    } finally {
      clearTimeout(overallTimeoutId);
    }
  }

  private safeParseJson(text: string): unknown | null {
    try {
      let cleaned = text.trim();

      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
