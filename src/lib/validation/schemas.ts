import { z } from 'zod';

export const CreatePersonInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relationship_status: z
    .enum(['talking', 'dating', 'ex', 'friend', 'paused'])
    .default('talking'),
  summary: z.string().max(500).optional(),
});

export type CreatePersonInput = z.input<typeof CreatePersonInputSchema>;

export const CreateInteractionInputSchema = z.object({
  person_id: z.string().min(1, 'person_id is required'),
  source_type: z.enum(['pasted_text', 'narrative']),
  raw_content: z.string().min(1, 'raw_content is required'),
});

export type CreateInteractionInput = z.input<typeof CreateInteractionInputSchema>;

export const CreateMemoryInputSchema = z.object({
  person_id: z.string().min(1, 'person_id is required'),
  source_interaction_id: z.string().min(1, 'source_interaction_id is required'),
  category: z.enum(['fact', 'assumption', 'uncertainty']),
  memory_type: z
    .enum(['fact', 'interest', 'pattern', 'preference', 'boundary', 'assumption', 'uncertainty'])
    .default('fact'),
  content: z.string().min(1, 'content is required'),
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0.0 and 1.0')
    .max(1, 'Confidence must be between 0.0 and 1.0'),
  user_verified: z.boolean().default(false),
});

export type CreateMemoryInput = z.input<typeof CreateMemoryInputSchema>;

export const UpdateMemoryInputSchema = z.object({
  person_id: z.string().min(1, 'person_id is required'),
  memory_id: z.string().min(1, 'memory_id is required'),
  content: z.string().min(1).optional(),
  category: z.enum(['fact', 'assumption', 'uncertainty']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  user_verified: z.boolean().optional(),
});

export type UpdateMemoryInput = z.input<typeof UpdateMemoryInputSchema>;

// Phase 3 Gemma Extraction Schemas
export const ExtractedMemorySchema = z.object({
  content: z.string().describe('Atomic statement of fact, interest, or observation'),
  memory_type: z
    .enum(['fact', 'interest', 'pattern', 'preference', 'boundary'])
    .default('fact'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Extraction confidence that claim is supported by source text'),
});

export const ExtractedEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  event_date: z.string().optional(),
});

export const ExtractedOpenThreadSchema = z.object({
  topic: z.string().describe('Unresolved topic or upcoming plan'),
});

export const ExtractedAssumptionSchema = z.object({
  content: z.string().describe('User assumption or subjective claim made in input'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Extraction confidence that claim is supported by source text'),
});

export const ExtractedUncertaintySchema = z.object({
  content: z.string().describe('Unclear point or missing detail requiring clarification'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Extraction confidence that claim is supported by source text'),
});

export const ExtractionResultSchema = z.object({
  facts: z.array(ExtractedMemorySchema).default([]),
  events: z.array(ExtractedEventSchema).default([]),
  open_threads: z.array(ExtractedOpenThreadSchema).default([]),
  assumptions: z.array(ExtractedAssumptionSchema).default([]),
  uncertainties: z.array(ExtractedUncertaintySchema).default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Phase 4 Reality Check Schemas
export const RealityCheckInputSchema = z.object({
  person_id: z.string().min(1, 'person_id is required'),
  query: z.string().min(1, 'query is required').max(500),
});

export type RealityCheckInput = z.infer<typeof RealityCheckInputSchema>;

export const RealityCheckResultSchema = z.object({
  query: z.string().default(''),
  known_facts: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
  evidence_strength: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['INSUFFICIENT', 'LOW', 'MODERATE', 'STRONG'])
    )
    .catch('INSUFFICIENT'),
  conclusion: z.string().default('Insufficient evidence available to reach a conclusion.'),
  closing_quote: z.string().default(''),
});

export type RealityCheckResult = z.infer<typeof RealityCheckResultSchema>;
