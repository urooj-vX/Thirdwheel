import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { setAIProviderOverride, MockAIProvider, AIProvider, RealityCheckAIInput } from '../src/lib/ai';
import { PersonRepository } from '../src/repositories/person.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';
import { retrievePersonContext } from '../src/lib/retrieval/context';
import { runRealityCheckAction } from '../src/app/actions/reality-check.action';
import { RealityCheckResult } from '../src/lib/validation/schemas';
import { closeDbConnection, getDb } from '../src/lib/db';

class FaultyRealityCheckAIProvider extends MockAIProvider {
  async runRealityCheck(_input: RealityCheckAIInput): Promise<RealityCheckResult> {
    throw new Error('Malformed Reality Check output');
  }
}

describe('Phase 4: Scoped Memory Context Retrieval & Reality Check Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let personRepo: PersonRepository;
  let memoryRepo: MemoryRepository;

  const USER_A = { user_id: 'usr_alice_999', email: 'alice@example.com', name: 'Alice' };
  const USER_B = { user_id: 'usr_bob_000', email: 'bob@example.com', name: 'Bob' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();

    db = await getDb();
    await initializeDatabaseIndexes(db);

    personRepo = new PersonRepository(db);
    memoryRepo = new MemoryRepository(db);
  });

  afterAll(async () => {
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    setAuthUserOverride(USER_A);
    setAIProviderOverride(new MockAIProvider());
  });

  it('1. Retrieves Person A memories correctly', async () => {
    setAuthUserOverride(USER_A);
    const personA = await personRepo.createPerson({ name: 'Arjun' });

    await memoryRepo.createMemory({
      person_id: personA.person_id,
      source_interaction_id: 'int_01',
      category: 'fact',
      memory_type: 'interest',
      content: 'Likes Arsenal',
      confidence: 0.95,
    });

    const ctx = await retrievePersonContext({
      userId: USER_A.user_id,
      personId: personA.person_id,
      query: 'football',
    });

    expect(ctx.personId).toBe(personA.person_id);
    expect(ctx.personName).toBe('Arjun');
    expect(ctx.facts).toContain('Likes Arsenal');
  });

  it('2. Person A cannot retrieve Person B memories (cross-person isolation)', async () => {
    setAuthUserOverride(USER_A);
    const personA1 = await personRepo.createPerson({ name: 'Person A1' });
    const personA2 = await personRepo.createPerson({ name: 'Person A2' });

    await memoryRepo.createMemory({
      person_id: personA1.person_id,
      source_interaction_id: 'int_02',
      category: 'fact',
      memory_type: 'preference',
      content: 'Likes coffee',
      confidence: 0.9,
    });

    const ctxA2 = await retrievePersonContext({
      userId: USER_A.user_id,
      personId: personA2.person_id,
      query: 'coffee',
    });

    // Person A1 memory MUST NOT leak into Person A2 context
    expect(ctxA2.facts).not.toContain('Likes coffee');
    expect(ctxA2.facts.length).toBe(0);
  });

  it('3. User A cannot retrieve User B memories (multi-tenant isolation)', async () => {
    setAuthUserOverride(USER_B);
    const personB = await personRepo.createPerson({ name: "User B's Person" });
    await memoryRepo.createMemory({
      person_id: personB.person_id,
      source_interaction_id: 'int_03',
      category: 'fact',
      memory_type: 'fact',
      content: 'Secret user B memory',
      confidence: 0.99,
    });

    // Switch to User A attempting to query User B's person
    setAuthUserOverride(USER_A);
    await expect(
      retrievePersonContext({
        userId: USER_A.user_id,
        personId: personB.person_id,
        query: 'secret',
      })
    ).rejects.toThrow('Person not found or access denied');
  });

  it('4. Reality Check receives only the active person context', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Rahul' });

    await memoryRepo.createMemory({
      person_id: person.person_id,
      source_interaction_id: 'int_04',
      category: 'fact',
      memory_type: 'preference',
      content: 'Loves spicy food',
      confidence: 0.9,
    });

    const response = await runRealityCheckAction({
      personId: person.person_id,
      query: 'What does Rahul like to eat?',
    });

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
    expect(response.result?.known_facts).toContain('Loves spicy food');
  });

  it('5. Insufficient evidence produces an INSUFFICIENT evidence strength and unknown conclusion', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Sameer' });

    // No memories logged yet
    const response = await runRealityCheckAction({
      personId: person.person_id,
      query: 'He viewed my story but hasn’t replied in 5 hours. Does he like me?',
    });

    expect(response.success).toBe(true);
    expect(response.result?.evidence_strength).toBe('INSUFFICIENT');
    expect(response.result?.unknowns.length).toBeGreaterThan(0);
    expect(response.result?.conclusion).toContain('insufficient evidence');
  });

  it('6. Malformed AI output is rejected by schema validation', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Faulty Test' });

    setAIProviderOverride(new FaultyRealityCheckAIProvider());

    await expect(
      runRealityCheckAction({
        personId: person.person_id,
        query: 'Faulty test query',
      })
    ).rejects.toThrow('Malformed Reality Check output');
  });
});
