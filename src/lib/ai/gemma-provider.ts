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
    this.modelName = config?.modelName || process.env.GEMMA_MODEL_NAME || 'gemma-4-31b-it';
    this.endpointUrl = config?.endpointUrl || process.env.GEMMA_ENDPOINT_URL;
  }

  async extractInteraction(input: ExtractionInput): Promise<ExtractionResult> {
    const userPrompt = buildExtractionUserPrompt(input);

    let rawOutput = await this.callGemmaEndpoint(SYSTEM_EXTRACTION_INSTRUCTIONS, userPrompt);
    let parsedJson = this.safeParseJson(rawOutput);

    // Initial Zod validation attempt
    let validation =
      parsedJson !== null
        ? ExtractionResultSchema.safeParse(parsedJson)
        : { success: false, error: new Error('Invalid JSON format') };

    // Single retry with repair instruction if initial parsing or Zod validation failed
    if (!validation.success) {
      const repairPrompt = `The previous response failed schema validation. Output ONLY raw JSON matching this structure without Markdown formatting:\n\n${userPrompt}`;
      rawOutput = await this.callGemmaEndpoint(SYSTEM_EXTRACTION_INSTRUCTIONS, repairPrompt);
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

    let rawOutput = await this.callGemmaEndpoint(SYSTEM_REALITY_CHECK_INSTRUCTIONS, userPrompt);
    let parsedJson = this.safeParseJson(rawOutput);

    let validation =
      parsedJson !== null
        ? RealityCheckResultSchema.safeParse(parsedJson)
        : { success: false, error: new Error('Invalid JSON format') };

    if (!validation.success) {
      const repairPrompt = `The previous response failed schema validation. Output ONLY raw JSON matching this structure without Markdown formatting:\n\n${userPrompt}`;
      rawOutput = await this.callGemmaEndpoint(SYSTEM_REALITY_CHECK_INSTRUCTIONS, repairPrompt);
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

  private async callGemmaEndpoint(
    systemInstruction: string,
    prompt: string,
    useJsonMimeType: boolean = false
  ): Promise<string> {
    const targetUrl =
      this.endpointUrl ||
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

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

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemma API call failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const nonThoughtParts = parts.filter((p: { thought?: boolean; text?: string }) => !p.thought);
    const targetParts = nonThoughtParts.length > 0 ? nonThoughtParts : parts;
    const content = targetParts
      .map((p: { text?: string }) => p.text || '')
      .join('\n')
      .trim();

    if (!content) {
      throw new Error('Gemma API returned empty response content.');
    }

    return content;
  }

  private safeParseJson(text: string): unknown | null {
    try {
      let cleaned = text.trim();

      // Extract content inside ```json ... ``` code blocks if present
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      // Isolate outermost JSON object bounds ({ ... }) to bypass any conversational preambles/postscripts
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
