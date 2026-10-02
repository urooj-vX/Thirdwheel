import { Db } from 'mongodb';
import { MemoryDocument, MemoryCategory } from '@/types';
import { getAuthUser } from '@/lib/auth';
import {
  CreateMemoryInput,
  CreateMemoryInputSchema,
  UpdateMemoryInput,
  UpdateMemoryInputSchema,
} from '@/lib/validation/schemas';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export class MemoryRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Person-specific operation: Creates a single memory document scoped by user_id AND person_id.
   * Distinctly preserves category ('fact' | 'assumption' | 'uncertainty').
   */
  async createMemory(input: CreateMemoryInput): Promise<MemoryDocument> {
    const authUser = await getAuthUser();
    const validated = CreateMemoryInputSchema.parse(input);

    // Verify person exists for authenticated user
    const person = await this.db.collection('persons').findOne({
      user_id: authUser.user_id,
      person_id: validated.person_id,
    });

    if (!person) {
      throw new Error(`Person not found or access denied for person_id: ${validated.person_id}`);
    }

    const memoryId = generateId('mem');
    const now = new Date();

    const doc: MemoryDocument = {
      user_id: authUser.user_id,
      person_id: validated.person_id,
      memory_id: memoryId,
      source_interaction_id: validated.source_interaction_id,
      category: validated.category,
      memory_type: validated.memory_type,
      content: validated.content,
      confidence: validated.confidence, // Extraction confidence that claim is supported by source text
      user_verified: validated.user_verified,
      created_at: now,
      updated_at: now,
    };

    await this.db.collection<MemoryDocument>('memories').insertOne(doc);
    return doc;
  }

  /**
   * Person-specific operation: Batch inserts extracted memories for a person.
   */
  async createBatchMemories(inputs: CreateMemoryInput[]): Promise<MemoryDocument[]> {
    if (inputs.length === 0) return [];
    const results: MemoryDocument[] = [];
    for (const input of inputs) {
      const doc = await this.createMemory(input);
      results.push(doc);
    }
    return results;
  }

  /**
   * Person-specific operation: Fetches memories for a target person scoped by user_id AND person_id.
   * Optional category filter ('fact' | 'assumption' | 'uncertainty').
   */
  async getMemoriesForPerson(
    personId: string,
    category?: MemoryCategory
  ): Promise<MemoryDocument[]> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    const query: Record<string, unknown> = {
      user_id: authUser.user_id,
      person_id: personId,
    };

    if (category) {
      query.category = category;
    }

    return await this.db
      .collection<MemoryDocument>('memories')
      .find(query)
      .sort({ created_at: -1 })
      .toArray();
  }

  /**
   * Person-specific operation: Updates a memory record scoped by user_id AND person_id.
   */
  async updateMemory(input: UpdateMemoryInput): Promise<MemoryDocument | null> {
    const authUser = await getAuthUser();
    const validated = UpdateMemoryInputSchema.parse(input);

    const filter = {
      user_id: authUser.user_id,
      person_id: validated.person_id,
      memory_id: validated.memory_id,
    };

    const updateFields: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (validated.content !== undefined) updateFields.content = validated.content;
    if (validated.category !== undefined) updateFields.category = validated.category;
    if (validated.confidence !== undefined) updateFields.confidence = validated.confidence;
    if (validated.user_verified !== undefined) updateFields.user_verified = validated.user_verified;

    const res = await this.db
      .collection<MemoryDocument>('memories')
      .findOneAndUpdate(filter, { $set: updateFields }, { returnDocument: 'after' });

    return res || null;
  }

  /**
   * Person-specific operation: Deletes a single memory record scoped by user_id AND person_id.
   */
  async deleteMemory(personId: string, memoryId: string): Promise<boolean> {
    const authUser = await getAuthUser();
    if (!personId || !memoryId) {
      throw new Error('Both person_id and memory_id are required');
    }

    const res = await this.db.collection('memories').deleteOne({
      user_id: authUser.user_id,
      person_id: personId,
      memory_id: memoryId,
    });

    return res.deletedCount === 1;
  }
}

export async function getMemoryRepository(customDb?: Db): Promise<MemoryRepository> {
  const db = customDb || (await getDb());
  return new MemoryRepository(db);
}
