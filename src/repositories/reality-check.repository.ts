import { Db } from 'mongodb';
import { RealityCheckDocument } from '@/types';
import { RealityCheckResult } from '@/lib/validation/schemas';
import { getAuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export interface CreateRealityCheckInput {
  person_id: string;
  interaction_id?: string;
  query: string;
  result: RealityCheckResult;
}

export class RealityCheckRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Person-specific operation: Creates a Reality Check document scoped by user_id AND person_id.
   */
  async createRealityCheck(input: CreateRealityCheckInput): Promise<RealityCheckDocument> {
    const authUser = await getAuthUser();
    if (!input.person_id || !input.query || !input.result) {
      throw new Error('person_id, query, and result are required');
    }

    // Verify target person belongs to the authenticated user
    const person = await this.db.collection('persons').findOne({
      user_id: authUser.user_id,
      person_id: input.person_id,
    });

    if (!person) {
      throw new Error(`Person not found or access denied for person_id: ${input.person_id}`);
    }

    const realityCheckId = generateId('rc');
    const now = new Date();

    const doc: RealityCheckDocument = {
      user_id: authUser.user_id,
      person_id: input.person_id,
      reality_check_id: realityCheckId,
      interaction_id: input.interaction_id,
      query: input.query,
      conclusion: input.result.conclusion,
      known_facts: input.result.known_facts || [],
      assumptions: input.result.assumptions || [],
      unknowns: input.result.unknowns || [],
      evidence_strength: input.result.evidence_strength,
      closing_quote: input.result.closing_quote,
      created_at: now,
    };

    await this.db.collection<RealityCheckDocument>('reality_checks').insertOne(doc);
    return doc;
  }

  /**
   * Person-specific operation: Fetches all Reality Check documents for a person scoped by user_id AND person_id.
   */
  async getRealityChecksForPerson(personId: string): Promise<RealityCheckDocument[]> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    return await this.db
      .collection<RealityCheckDocument>('reality_checks')
      .find({
        user_id: authUser.user_id,
        person_id: personId,
      })
      .sort({ created_at: -1 })
      .toArray();
  }

  /**
   * Scoped operation: Fetches a single Reality Check document for a specific interaction scoped by user_id, person_id, AND interaction_id.
   */
  async getRealityCheckForInteraction(
    personId: string,
    interactionId: string
  ): Promise<RealityCheckDocument | null> {
    const authUser = await getAuthUser();
    if (!personId || !interactionId) {
      throw new Error('Both person_id and interaction_id are required');
    }

    return await this.db.collection<RealityCheckDocument>('reality_checks').findOne({
      user_id: authUser.user_id,
      person_id: personId,
      interaction_id: interactionId,
    });
  }
}

export async function getRealityCheckRepository(customDb?: Db): Promise<RealityCheckRepository> {
  const db = customDb || (await getDb());
  return new RealityCheckRepository(db);
}
