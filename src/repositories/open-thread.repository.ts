import { Db } from 'mongodb';
import { OpenThreadDocument, ThreadStatus } from '@/types';
import { getAuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export interface CreateOpenThreadInput {
  person_id: string;
  source_interaction_id: string;
  topic: string;
  status?: ThreadStatus;
}

export class OpenThreadRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Person-specific operation: Creates an open thread document scoped by user_id AND person_id.
   */
  async createOpenThread(input: CreateOpenThreadInput): Promise<OpenThreadDocument> {
    const authUser = await getAuthUser();
    if (!input.person_id || !input.source_interaction_id || !input.topic) {
      throw new Error('person_id, source_interaction_id, and topic are required');
    }

    const threadId = generateId('thread');
    const now = new Date();

    const doc: OpenThreadDocument = {
      user_id: authUser.user_id,
      person_id: input.person_id,
      thread_id: threadId,
      source_interaction_id: input.source_interaction_id,
      topic: input.topic,
      status: input.status || 'open',
      last_updated: now,
    };

    await this.db.collection<OpenThreadDocument>('open_threads').insertOne(doc);
    return doc;
  }

  /**
   * Person-specific operation: Fetches open threads for a person scoped by user_id AND person_id.
   */
  async getOpenThreadsForPerson(
    personId: string,
    status?: ThreadStatus
  ): Promise<OpenThreadDocument[]> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    const query: Record<string, unknown> = {
      user_id: authUser.user_id,
      person_id: personId,
    };

    if (status) {
      query.status = status;
    }

    return await this.db
      .collection<OpenThreadDocument>('open_threads')
      .find(query)
      .sort({ last_updated: -1 })
      .toArray();
  }
}

export async function getOpenThreadRepository(customDb?: Db): Promise<OpenThreadRepository> {
  const db = customDb || (await getDb());
  return new OpenThreadRepository(db);
}
