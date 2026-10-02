export interface UserDocument {
  _id?: string;
  user_id: string;
  email: string;
  name: string;
  created_at: Date;
}

export type RelationshipStatus = 'talking' | 'dating' | 'ex' | 'friend' | 'paused';

export interface PersonDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  name: string;
  relationship_status: RelationshipStatus;
  summary?: string;
  created_at: Date;
  updated_at: Date;
}

export type InteractionSourceType = 'pasted_text' | 'narrative';

export interface InteractionDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  interaction_id: string;
  source_type: InteractionSourceType;
  raw_content: string;
  timestamp: Date;
  created_at: Date;
}

export type MemoryCategory = 'fact' | 'assumption' | 'uncertainty';

export type MemoryType =
  | 'fact'
  | 'interest'
  | 'pattern'
  | 'preference'
  | 'boundary'
  | 'assumption'
  | 'uncertainty';

export interface MemoryDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  memory_id: string;
  source_interaction_id: string;
  category: MemoryCategory;
  memory_type: MemoryType;
  content: string;
  confidence: number; // Extraction confidence (0.0 to 1.0) that claim is supported by source text
  user_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EventDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  event_id: string;
  source_interaction_id: string;
  title: string;
  description?: string;
  event_date?: Date;
  created_at: Date;
}

export type ThreadStatus = 'open' | 'resolved' | 'abandoned';

export interface OpenThreadDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  thread_id: string;
  source_interaction_id: string;
  topic: string;
  status: ThreadStatus;
  last_updated: Date;
}

export interface EmbeddingDocument {
  _id?: string;
  user_id: string;
  person_id: string;
  memory_id: string;
  vector: number[];
  content: string;
  created_at: Date;
}

export interface UserScopedQuery {
  user_id: string;
}

export interface PersonScopedQuery {
  user_id: string;
  person_id: string;
}

export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
}
