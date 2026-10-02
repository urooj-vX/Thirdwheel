import { Db } from 'mongodb';
import { EventDocument } from '@/types';
import { getAuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export interface CreateEventInput {
  person_id: string;
  source_interaction_id: string;
  title: string;
  description?: string;
  event_date?: Date;
}

export class EventRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Person-specific operation: Creates an event document scoped by user_id AND person_id.
   */
  async createEvent(input: CreateEventInput): Promise<EventDocument> {
    const authUser = await getAuthUser();
    if (!input.person_id || !input.source_interaction_id || !input.title) {
      throw new Error('person_id, source_interaction_id, and title are required');
    }

    const eventId = generateId('event');
    const now = new Date();

    const doc: EventDocument = {
      user_id: authUser.user_id,
      person_id: input.person_id,
      event_id: eventId,
      source_interaction_id: input.source_interaction_id,
      title: input.title,
      description: input.description,
      event_date: input.event_date,
      created_at: now,
    };

    await this.db.collection<EventDocument>('events').insertOne(doc);
    return doc;
  }

  /**
   * Person-specific operation: Fetches all events for a person scoped by user_id AND person_id.
   */
  async getEventsForPerson(personId: string): Promise<EventDocument[]> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    return await this.db
      .collection<EventDocument>('events')
      .find({ user_id: authUser.user_id, person_id: personId })
      .sort({ created_at: -1 })
      .toArray();
  }
}

export async function getEventRepository(customDb?: Db): Promise<EventRepository> {
  const db = customDb || (await getDb());
  return new EventRepository(db);
}
