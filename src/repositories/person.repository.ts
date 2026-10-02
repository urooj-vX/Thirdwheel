import { Db } from 'mongodb';
import { PersonDocument } from '@/types';
import { getAuthUser } from '@/lib/auth';
import { CreatePersonInput, CreatePersonInputSchema } from '@/lib/validation/schemas';
import { getDb } from '@/lib/db';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

export class PersonRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Account-level operation: Creates a new person scoped to the authenticated user_id.
   * Client payload user_id is ignored.
   */
  async createPerson(input: CreatePersonInput): Promise<PersonDocument> {
    const authUser = await getAuthUser();
    const validated = CreatePersonInputSchema.parse(input);

    const personId = generateId('person');
    const now = new Date();

    const doc: PersonDocument = {
      user_id: authUser.user_id,
      person_id: personId,
      name: validated.name,
      relationship_status: validated.relationship_status,
      summary: validated.summary,
      created_at: now,
      updated_at: now,
    };

    await this.db.collection<PersonDocument>('persons').insertOne(doc);
    return doc;
  }

  /**
   * Account-level operation: Lists all people belonging to the authenticated user_id.
   */
  async getPersonsByUser(): Promise<PersonDocument[]> {
    const authUser = await getAuthUser();
    return await this.db
      .collection<PersonDocument>('persons')
      .find({ user_id: authUser.user_id })
      .sort({ created_at: -1 })
      .toArray();
  }

  /**
   * Person-specific operation: Fetches a single person scoped by user_id AND person_id.
   */
  async getPersonById(personId: string): Promise<PersonDocument | null> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    return await this.db.collection<PersonDocument>('persons').findOne({
      user_id: authUser.user_id,
      person_id: personId,
    });
  }

  /**
   * Person-specific operation: Purges a person and all associated data scoped by user_id AND person_id.
   */
  async deletePerson(personId: string): Promise<boolean> {
    const authUser = await getAuthUser();
    if (!personId) throw new Error('person_id is required');

    const filter = { user_id: authUser.user_id, person_id: personId };

    // Batch purge all collections for this person
    const res = await this.db.collection('persons').deleteOne(filter);
    if (res.deletedCount > 0) {
      await Promise.all([
        this.db.collection('interactions').deleteMany(filter),
        this.db.collection('memories').deleteMany(filter),
        this.db.collection('events').deleteMany(filter),
        this.db.collection('open_threads').deleteMany(filter),
        this.db.collection('embeddings').deleteMany(filter),
      ]);
      return true;
    }
    return false;
  }
}

export async function getPersonRepository(customDb?: Db): Promise<PersonRepository> {
  const db = customDb || (await getDb());
  return new PersonRepository(db);
}
