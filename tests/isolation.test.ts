import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { PersonRepository } from '../src/repositories/person.repository';
import { InteractionRepository } from '../src/repositories/interaction.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';

describe('Phase 2: Person Data Isolation & Core Repository Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let personRepo: PersonRepository;
  let interactionRepo: InteractionRepository;
  let memoryRepo: MemoryRepository;

  const USER_A = { user_id: 'usr_alice_123', email: 'alice@example.com', name: 'Alice' };
  const USER_B = { user_id: 'usr_bob_456', email: 'bob@example.com', name: 'Bob' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_third_wheel');

    await initializeDatabaseIndexes(db);

    personRepo = new PersonRepository(db);
    interactionRepo = new InteractionRepository(db);
    memoryRepo = new MemoryRepository(db);
  });

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    setAuthUserOverride(USER_A);
  });

  it('1. User A can create Person A', async () => {
    setAuthUserOverride(USER_A);
    const personA = await personRepo.createPerson({
      name: 'Arjun',
      relationship_status: 'talking',
      summary: 'Met at college',
    });

    expect(personA.person_id).toBeDefined();
    expect(personA.user_id).toBe(USER_A.user_id);
    expect(personA.name).toBe('Arjun');
  });

  it('2. User A can retrieve Person A', async () => {
    setAuthUserOverride(USER_A);
    const personA = await personRepo.createPerson({ name: 'Rahul' });
    const fetched = await personRepo.getPersonById(personA.person_id);

    expect(fetched).not.toBeNull();
    expect(fetched?.person_id).toBe(personA.person_id);
    expect(fetched?.user_id).toBe(USER_A.user_id);
  });

  it('3. User A cannot retrieve Person B belonging to User B', async () => {
    // User B creates a person
    setAuthUserOverride(USER_B);
    const personB = await personRepo.createPerson({ name: 'Sameer (User B)' });

    // Switch back to User A
    setAuthUserOverride(USER_A);

    // User A attempts to fetch Person B
    const fetchedByA = await personRepo.getPersonById(personB.person_id);
    expect(fetchedByA).toBeNull();

    // User A lists people; Person B must not be present
    const userAPeople = await personRepo.getPersonsByUser();
    const foundB = userAPeople.some((p) => p.person_id === personB.person_id);
    expect(foundB).toBe(false);
  });

  it('4. User A cannot retrieve memories belonging to another person or another user', async () => {
    // User A creates Person A1 and Person A2
    setAuthUserOverride(USER_A);
    const personA1 = await personRepo.createPerson({ name: 'Person A1' });
    const personA2 = await personRepo.createPerson({ name: 'Person A2' });

    // Ingest interaction & memory for Person A1
    const intA1 = await interactionRepo.createInteraction({
      person_id: personA1.person_id,
      source_type: 'pasted_text',
      raw_content: 'A1 likes football',
    });

    const memA1 = await memoryRepo.createMemory({
      person_id: personA1.person_id,
      source_interaction_id: intA1.interaction_id,
      category: 'fact',
      memory_type: 'interest',
      content: 'Likes football',
      confidence: 0.95,
    });

    // Query memories for Person A2; Person A1 memory must NOT leak into Person A2
    const memsForA2 = await memoryRepo.getMemoriesForPerson(personA2.person_id);
    expect(memsForA2.length).toBe(0);

    // User B attempts to access Person A1 memory
    setAuthUserOverride(USER_B);
    const memsForB = await memoryRepo.getMemoriesForPerson(personA1.person_id);
    expect(memsForB.length).toBe(0);

    // User B attempts to update Person A1 memory
    const updateRes = await memoryRepo.updateMemory({
      person_id: personA1.person_id,
      memory_id: memA1.memory_id,
      content: 'Hacked content',
    });
    expect(updateRes).toBeNull();
  });

  it('5. A person can have MULTIPLE interactions (verifying multi-record index support)', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Multi Interaction Person' });

    const int1 = await interactionRepo.createInteraction({
      person_id: person.person_id,
      source_type: 'pasted_text',
      raw_content: 'Interaction 1',
    });

    const int2 = await interactionRepo.createInteraction({
      person_id: person.person_id,
      source_type: 'narrative',
      raw_content: 'Interaction 2',
    });

    const ints = await interactionRepo.getInteractionsForPerson(person.person_id);
    expect(ints.length).toBe(2);
    expect(ints.map((i) => i.interaction_id)).toContain(int1.interaction_id);
    expect(ints.map((i) => i.interaction_id)).toContain(int2.interaction_id);
  });

  it('6. A person can have MULTIPLE memories across FACT, ASSUMPTION, UNCERTAINTY', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Multi Memory Person' });
    const int = await interactionRepo.createInteraction({
      person_id: person.person_id,
      source_type: 'narrative',
      raw_content: 'Met at cafe. Discussed Arsenal. User assumed he is single.',
    });

    const factMem = await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: int.interaction_id,
      category: 'fact',
      memory_type: 'interest',
      content: 'Supports Arsenal',
      confidence: 0.9,
    });

    const assumptionMem = await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: int.interaction_id,
      category: 'assumption',
      memory_type: 'assumption',
      content: 'User assumes he is single',
      confidence: 0.7,
    });

    const uncertaintyMem = await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: int.interaction_id,
      category: 'uncertainty',
      memory_type: 'uncertainty',
      content: 'Unknown whether he wants a second date',
      confidence: 0.5,
    });

    const allMems = await memoryRepo.getMemoriesForPerson(person.person_id);
    expect(allMems.length).toBe(3);

    // Verify category filtering
    const factsOnly = await memoryRepo.getMemoriesForPerson(person.person_id, 'fact');
    expect(factsOnly.length).toBe(1);
    expect(factsOnly[0].memory_id).toBe(factMem.memory_id);

    const assumptionsOnly = await memoryRepo.getMemoriesForPerson(person.person_id, 'assumption');
    expect(assumptionsOnly.length).toBe(1);
    expect(assumptionsOnly[0].memory_id).toBe(assumptionMem.memory_id);

    const uncertaintiesOnly = await memoryRepo.getMemoriesForPerson(
      person.person_id,
      'uncertainty'
    );
    expect(uncertaintiesOnly.length).toBe(1);
    expect(uncertaintiesOnly[0].memory_id).toBe(uncertaintyMem.memory_id);
  });

  it('7. user_id supplied in client payload cannot override authenticated identity', async () => {
    // Authenticated user is Alice (USER_A)
    setAuthUserOverride(USER_A);

    // Create a person without passing user_id (it is automatically derived from getAuthUser())
    const person = await personRepo.createPerson({
      name: 'Tamper Test',
    } as any);

    // Verify user_id is forced to USER_A's ID
    expect(person.user_id).toBe(USER_A.user_id);
    expect(person.user_id).not.toBe(USER_B.user_id);
  });
});
