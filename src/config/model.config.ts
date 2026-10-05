export const DEFAULT_REALITY_CHECK_MODEL = 'gemini-3.6-flash';
export const DEFAULT_EXTRACTION_MODEL = 'gemini-3.5-flash-lite';

export const REALITY_CHECK_FALLBACKS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
export const EXTRACTION_FALLBACKS = ['gemini-3.6-flash', 'gemini-3.8-flash'];

export const EXCLUDED_MODELS = ['gemma-4-31b-it', 'gemini-3.7-flash'];

export const REALITY_CHECK_PER_ATTEMPT_TIMEOUT_MS = 10000; // 10 seconds
export const EXTRACTION_PER_ATTEMPT_TIMEOUT_MS = 8000;    // 8 seconds
export const OVERALL_DEADLINE_MS = 25000;                  // 25 seconds

/**
 * Returns candidate models for Reality Check in exact fallback order,
 * ensuring that when USE_REAL_GEMMA=false or GEMMA_MODEL_NAME=gemma-4-31b-it,
 * Reality Check uses gemini-3.6-flash as primary.
 */
export function getRealityCheckCandidateModels(primaryOverride?: string): string[] {
  let primary = primaryOverride;
  if (!primary || EXCLUDED_MODELS.includes(primary)) {
    if (process.env.USE_REAL_GEMMA === 'false') {
      primary = DEFAULT_REALITY_CHECK_MODEL;
    } else {
      primary = process.env.GEMMA_MODEL_NAME || DEFAULT_REALITY_CHECK_MODEL;
    }
  }
  if (EXCLUDED_MODELS.includes(primary)) {
    primary = DEFAULT_REALITY_CHECK_MODEL;
  }
  const list = [primary, ...REALITY_CHECK_FALLBACKS];
  const unique = Array.from(new Set(list));
  return unique.filter((m) => !EXCLUDED_MODELS.includes(m));
}

/**
 * Returns candidate models for Extraction in exact fallback order.
 */
export function getExtractionCandidateModels(primaryOverride?: string): string[] {
  let primary = primaryOverride;
  if (!primary || EXCLUDED_MODELS.includes(primary)) {
    primary = process.env.GEMMA_EXTRACTION_MODEL_NAME || DEFAULT_EXTRACTION_MODEL;
  }
  if (EXCLUDED_MODELS.includes(primary)) {
    primary = DEFAULT_EXTRACTION_MODEL;
  }
  const list = [primary, ...EXTRACTION_FALLBACKS];
  const unique = Array.from(new Set(list));
  return unique.filter((m) => !EXCLUDED_MODELS.includes(m));
}
