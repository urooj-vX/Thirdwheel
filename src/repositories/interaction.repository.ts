import { Db } from 'mongodb';
import { InteractionDocument } from '@/types';
import { getAuthUser } from '@/lib/auth';
import { CreateInteractionInput, CreateInteractionInputSchema } from '@/lib/validation/schemas';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export class InteractionRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Person-specific operation: Creates an interaction document scoped by user_id AND person_id.
   */
  async createInteraction(input: CreateInteractionInput): Promise<InteractionDocument> {
    const authUser = await getAuthUser();
    const validated = CreateInteractionInputSchema.parse(input);

    // Verify target person belongs to the authenticated user
    const person = await this.db.collection('persons').findOne({
      user_id: authUser.user_id,
      person_id: validated.person_id,
    });

    if (!person) {
      throw new Error(`Person not found or access denied for person_id: ${validated.person_id}`);
    }

    const interactionId = generateId('int');
    const now = new Date();

    const doc: InteractionDocument = {
      user_id: authUser.user_id,
      person_id: validated.person_id,
      interaction_id: interactionId,
      source_type: validated.source_type,
      raw_content: validated.raw_content,
      timestamp: now,
      created_at: now,
    };

    await this.db.collection<InteractionDocument>('interactions').insertOne(doc);
    return doc;
  }

  /**
   * Person-specific operation: Fetches all interactions for a target person scoped by user_id AND person_id.
   */
  async getInteractionsForPerson(personId: string): Promise<InteractionDocument[]> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    return await this.db
      .collection<InteractionDocument>('interactions')
      .find({
        user_id: authUser.user_id,
        person_id: personId,
      })
      .sort({ timestamp: -1 })
      .toArray();
  }

  /**
   * Person-specific operation: Fetches a single interaction scoped by user_id AND person_id.
   */
  async getInteractionById(
    personId: string,
    interactionId: string
  ): Promise<InteractionDocument | null> {
    const authUser = await getAuthUser();
    if (!personId || !interactionId) {
      throw new Error('Both person_id and interaction_id are required');
    }

    return await this.db.collection<InteractionDocument>('interactions').findOne({
      user_id: authUser.user_id,
      person_id: personId,
      interaction_id: interactionId,
    });
  }
}

export async function getInteractionRepository(customDb?: Db): Promise<InteractionRepository> {
  const db = customDb || (await getDb());
  return new InteractionRepository(db);
}
