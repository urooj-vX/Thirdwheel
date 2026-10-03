import { AIProvider } from './types';
import { MockAIProvider } from './mock-provider';
import { GemmaAIProvider } from './gemma-provider';

export * from './types';
export * from './prompts';
export * from './mock-provider';
export * from './gemma-provider';

let overrideProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (overrideProvider) {
    return overrideProvider;
  }

  // Use real Gemma provider if explicitly configured or API key present
  if (process.env.USE_REAL_GEMMA === 'true' || process.env.GEMMA_API_KEY) {
    return new GemmaAIProvider();
  }

  // Default to deterministic Mock AI Provider for local development & testing
  return new MockAIProvider();
}

export function setAIProviderOverride(provider: AIProvider | null): void {
  overrideProvider = provider;
}
