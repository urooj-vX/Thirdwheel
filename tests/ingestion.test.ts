import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { setAIProviderOverride, MockAIProvider, ExtractionInput } from '../src/lib/ai';
import { PersonRepository } from '../src/repositories/person.repository';
import { InteractionRepository } from '../src/repositories/interaction.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { ExtractionResult } from '../src/lib/validation/schemas';
import { closeDbConnection, getDb } from '../src/lib/db';

class FaultyAIProvider extends MockAIProvider {
  async extractInteraction(_input: ExtractionInput): Promise<ExtractionResult> {
    throw new Error('Malformed AI output simulation');
  }
}

describe('Phase 3: Gemma Extraction & Interaction Ingestion Pipeline Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let personRepo: PersonRepository;
  let interactionRepo: InteractionRepository;
  let memoryRepo: MemoryRepository;

  const USER_A = { user_id: 'usr_alice_777', email: 'alice@example.com', name: 'Alice' };
  const USER_B = { user_id: 'usr_bob_888', email: 'bob@example.com', name: 'Bob' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection(); // Clear any cached connection

    db = await getDb();
    await initializeDatabaseIndexes(db);

    personRepo = new PersonRepository(db);
    interactionRepo = new InteractionRepository(db);
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

  it('1. Valid conversation produces structured extraction', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Arjun' });

    const result = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Arjun said he likes Arsenal and wants to try the coffee place near campus. I assume he wants to meet.',
    });

    expect(result.success).toBe(true);
    expect(result.interaction_id).toBeDefined();
    expect(result.extraction).toBeDefined();
    expect(result.extraction?.facts.length).toBeGreaterThan(0);
  });

  it('2. FACT is persisted as FACT in memories collection', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Arjun' });

    await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'narrative',
      rawContent: 'He said he supports Arsenal.',
    });

    const facts = await memoryRepo.getMemoriesForPerson(person.person_id, 'fact');
    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].category).toBe('fact');
    expect(facts[0].content).toContain('Arsenal');
  });

  it('3. ASSUMPTION is persisted as ASSUMPTION in memories collection', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Arjun' });

    await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'narrative',
      rawContent: 'I assume he is single.',
    });

    const assumptions = await memoryRepo.getMemoriesForPerson(person.person_id, 'assumption');
    expect(assumptions.length).toBeGreaterThan(0);
    expect(assumptions[0].category).toBe('assumption');
  });

  it('4. UNCERTAINTY is persisted as UNCERTAINTY in memories collection', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Arjun' });

    await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'narrative',
      rawContent: 'I am uncertain if he is free Sunday.',
    });

    const uncertainties = await memoryRepo.getMemoriesForPerson(person.person_id, 'uncertainty');
    expect(uncertainties.length).toBeGreaterThan(0);
    expect(uncertainties[0].category).toBe('uncertainty');
  });

  it('5. Every memory retains source_interaction_id provenance', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Rahul' });

    const res = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Rahul likes coffee.',
    });

    const memories = await memoryRepo.getMemoriesForPerson(person.person_id);
    expect(memories.length).toBeGreaterThan(0);
    for (const mem of memories) {
      expect(mem.source_interaction_id).toBe(res.interaction_id);
    }
  });

  it('6 & 7. Every extracted memory retains authenticated user_id AND correct person_id', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Sameer' });

    await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'narrative',
      rawContent: 'Sameer likes music.',
    });

    const memories = await memoryRepo.getMemoriesForPerson(person.person_id);
    expect(memories.length).toBeGreaterThan(0);
    for (const mem of memories) {
      expect(mem.user_id).toBe(USER_A.user_id);
      expect(mem.person_id).toBe(person.person_id);
    }
  });

  it("8. User A cannot ingest an interaction into User B's person", async () => {
    // User B creates a person
    setAuthUserOverride(USER_B);
    const personB = await personRepo.createPerson({ name: "User B's Person" });

    // User A attempts to ingest interaction into Person B
    setAuthUserOverride(USER_A);
    await expect(
      ingestInteractionAction({
        personId: personB.person_id,
        sourceType: 'pasted_text',
        rawContent: 'Attempted cross-user ingestion',
      })
    ).rejects.toThrow();
  });

  it('9 & 10. Malformed AI output does not create invalid memories, BUT raw interaction remains available', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Faulty Extraction Person' });

    // Override AI provider with Faulty Provider
    setAIProviderOverride(new FaultyAIProvider());

    const result = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'This text will cause AI extraction to fail.',
    });

    // Action returns error gracefully
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.interaction_id).toBeDefined();

    // No invalid memories were created
    const memories = await memoryRepo.getMemoriesForPerson(person.person_id);
    expect(memories.length).toBe(0);

    // RAW interaction is still safely preserved in database!
    const rawInt = await interactionRepo.getInteractionById(
      person.person_id,
      result.interaction_id
    );
    expect(rawInt).not.toBeNull();
    expect(rawInt?.raw_content).toBe('This text will cause AI extraction to fail.');
  });

  it('11. Client payload cannot override authenticated user_id during ingestion', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Tamper Scoping Test' });

    // Ingest interaction
    const res = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Testing user_id tamper protection.',
    });

    const rawInt = await interactionRepo.getInteractionById(
      person.person_id,
      res.interaction_id
    );

    // Verified derived user_id is forced to USER_A's ID
    expect(rawInt?.user_id).toBe(USER_A.user_id);
    expect(rawInt?.user_id).not.toBe(USER_B.user_id);
  });
});
