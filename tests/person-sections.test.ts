import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { PersonRepository } from '../src/repositories/person.repository';
import { InteractionRepository } from '../src/repositories/interaction.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';
import { OpenThreadRepository } from '../src/repositories/open-thread.repository';

describe('Phase 6: Person Section & Relationship Label Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let personRepo: PersonRepository;
  let interactionRepo: InteractionRepository;
  let memoryRepo: MemoryRepository;
  let threadRepo: OpenThreadRepository;

  const USER_A = { user_id: 'usr_alice_789', email: 'alice.sections@example.com', name: 'Alice' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_third_wheel_sections');

    await initializeDatabaseIndexes(db);

    personRepo = new PersonRepository(db);
    interactionRepo = new InteractionRepository(db);
    memoryRepo = new MemoryRepository(db);
    threadRepo = new OpenThreadRepository(db);
  });

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(() => {
    setAuthUserOverride(USER_A);
  });

  it('1. Person defaults section to active and stores free-text relationship_label', async () => {
    const person = await personRepo.createPerson({
      name: 'Elena',
      relationship_label: 'met at a hackathon',
    });

    expect(person.section).toBe('active');
    expect(person.relationship_label).toBe('met at a hackathon');
  });

  it('2. Person migrates relationship_status to capitalized relationship_label if missing', async () => {
    const person = await personRepo.createPerson({
      name: 'Marcus',
      relationship_status: 'talking',
    });

    expect(person.relationship_label).toBe('Talking');
  });

  it('3. Section can be updated to archived and restored to active', async () => {
    const person = await personRepo.createPerson({ name: 'Chloe' });

    // Update section to archived
    const resArchived = await personRepo.updatePersonSection(person.person_id, 'archived');
    expect(resArchived).toBe(true);

    const fetchedArchived = await personRepo.getPersonById(person.person_id);
    expect(fetchedArchived?.section).toBe('archived');

    // Restore to active
    const resActive = await personRepo.updatePersonSection(person.person_id, 'active');
    expect(resActive).toBe(true);

    const fetchedActive = await personRepo.getPersonById(person.person_id);
    expect(fetchedActive?.section).toBe('active');
  });

  it('4. Soft deletion sets section to deleted and populates deleted_at timestamp', async () => {
    const person = await personRepo.createPerson({ name: 'Julian' });

    const softDelRes = await personRepo.updatePersonSection(person.person_id, 'deleted');
    expect(softDelRes).toBe(true);

    const fetched = await personRepo.getPersonById(person.person_id);
    expect(fetched?.section).toBe('deleted');
    expect(fetched?.deleted_at).toBeDefined();
    expect(fetched?.deleted_at).toBeInstanceOf(Date);
  });

  it('5. Permanent deletion removes person AND all interactions, memories, and threads', async () => {
    const person = await personRepo.createPerson({ name: 'Samira' });

    const interaction = await interactionRepo.createInteraction({
      person_id: person.person_id,
      source_type: 'pasted_text',
      raw_content: 'Met at coffee shop',
    });

    await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: interaction.interaction_id,
      category: 'fact',
      memory_type: 'interest',
      content: 'Loves cold brew',
      confidence: 0.9,
    });

    await threadRepo.createOpenThread({
      person_id: person.person_id,
      topic: 'Coffee date plans',
      source_interaction_id: interaction.interaction_id,
    });

    // Delete permanently
    const permDelRes = await personRepo.deletePerson(person.person_id);
    expect(permDelRes).toBe(true);

    // Verify person is gone
    const fetchedPerson = await personRepo.getPersonById(person.person_id);
    expect(fetchedPerson).toBeNull();

    // Verify memories, interactions, and threads are purged
    const mems = await memoryRepo.getMemoriesForPerson(person.person_id);
    expect(mems.length).toBe(0);

    const ints = await interactionRepo.getInteractionsForPerson(person.person_id);
    expect(ints.length).toBe(0);

    const threads = await threadRepo.getOpenThreadsForPerson(person.person_id);
    expect(threads.length).toBe(0);
  });
});
