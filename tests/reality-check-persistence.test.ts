import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { setAIProviderOverride, MockAIProvider, RealityCheckAIInput } from '../src/lib/ai';
import { PersonRepository } from '../src/repositories/person.repository';
import { getRealityCheckRepository } from '../src/repositories/reality-check.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { runRealityCheckAction } from '../src/app/actions/reality-check.action';
import { getPersonDetailsAction } from '../src/app/actions/person.action';
import { RealityCheckResult } from '../src/lib/validation/schemas';
import { closeDbConnection, getDb } from '../src/lib/db';

class CountingMockAIProvider extends MockAIProvider {
  public realityCheckCallCount = 0;

  async runRealityCheck(input: RealityCheckAIInput): Promise<RealityCheckResult> {
    this.realityCheckCallCount++;
    return {
      query: input.query,
      known_facts: ['Raj likes coffee', 'Raj works near campus'],
      assumptions: ['Assuming Raj wants to meet'],
      unknowns: ['Whether Raj is single'],
      evidence_strength: 'MODERATE',
      conclusion: 'Raj enjoys spending time near campus but feelings are unconfirmed.',
      closing_quote: 'Ask Raj to grab coffee together near campus.',
    };
  }
}

describe('Requirement 10: Lossless Reality Check Persistence & Restoration Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let db: Db;
  let personRepo: PersonRepository;
  let mockAi: CountingMockAIProvider;

  const USER_A = { user_id: 'usr_alice_persist_100', email: 'alice.persist@example.com', name: 'Alice Persist' };
  const USER_B = { user_id: 'usr_bob_persist_200', email: 'bob.persist@example.com', name: 'Bob Persist' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();

    db = await getDb();
    await initializeDatabaseIndexes(db);
    personRepo = new PersonRepository(db);
  }, 30000);

  afterAll(async () => {
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    setAuthUserOverride(USER_A);
    mockAi = new CountingMockAIProvider();
    setAIProviderOverride(mockAi);
  });

  it('10a. Send question -> Lossless Reality Check response persisted in MongoDB', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Raj' });

    // Step 1: Ingest question interaction
    const ingestRes = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Does Raj like me?',
    });

    expect(ingestRes.success).toBe(true);

    // Step 2: Run Reality Check associated with interactionId
    const rcRes = await runRealityCheckAction({
      personId: person.person_id,
      query: 'Does Raj like me?',
      newMessageContent: 'Does Raj like me?',
      interactionId: ingestRes.interaction_id,
    });

    expect(rcRes.success).toBe(true);
    expect(rcRes.result).toBeDefined();
    expect(rcRes.realityCheckDocument).toBeDefined();

    // Verify lossless field-by-field persistence directly in reality_checks collection
    const rcRepo = await getRealityCheckRepository(db);
    const persisted = await rcRepo.getRealityCheckForInteraction(person.person_id, ingestRes.interaction_id);

    expect(persisted).not.toBeNull();
    expect(persisted?.user_id).toBe(USER_A.user_id);
    expect(persisted?.person_id).toBe(person.person_id);
    expect(persisted?.interaction_id).toBe(ingestRes.interaction_id);
    expect(persisted?.query).toBe('Does Raj like me?');
    expect(persisted?.conclusion).toBe('Raj enjoys spending time near campus but feelings are unconfirmed.');
    expect(persisted?.known_facts).toEqual(['Raj likes coffee', 'Raj works near campus']);
    expect(persisted?.assumptions).toEqual(['Assuming Raj wants to meet']);
    expect(persisted?.unknowns).toEqual(['Whether Raj is single']);
    expect(persisted?.evidence_strength).toBe('MODERATE');
    expect(persisted?.closing_quote).toBe('Ask Raj to grab coffee together near campus.');
    expect(persisted?.created_at).toBeInstanceOf(Date);
  });

  it('10b. Reload/reopen conversation -> all UI fields restored losslessly', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Raj' });

    const ingestRes = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Does Raj like me?',
    });

    const rcRes = await runRealityCheckAction({
      personId: person.person_id,
      query: 'Does Raj like me?',
      newMessageContent: 'Does Raj like me?',
      interactionId: ingestRes.interaction_id,
    });

    // Reopen conversation by calling getPersonDetailsAction
    const details = await getPersonDetailsAction({ personId: person.person_id });

    expect(details.success).toBe(true);
    expect(details.realityChecks).toBeDefined();
    expect(details.realityChecks!.length).toBeGreaterThan(0);

    const restoredRC = details.realityChecks!.find((r) => r.interaction_id === ingestRes.interaction_id);
    expect(restoredRC).toBeDefined();
    expect(restoredRC?.query).toBe(rcRes.result?.query);
    expect(restoredRC?.conclusion).toBe(rcRes.result?.conclusion);
    expect(restoredRC?.known_facts).toEqual(rcRes.result?.known_facts);
    expect(restoredRC?.assumptions).toEqual(rcRes.result?.assumptions);
    expect(restoredRC?.unknowns).toEqual(rcRes.result?.unknowns);
    expect(restoredRC?.evidence_strength).toBe(rcRes.result?.evidence_strength);
    expect(restoredRC?.closing_quote).toBe(rcRes.result?.closing_quote);
  });

  it('10c. Reopening conversation does NOT trigger another AI request', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Raj' });

    const ingestRes = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Does Raj like me?',
    });

    await runRealityCheckAction({
      personId: person.person_id,
      query: 'Does Raj like me?',
      newMessageContent: 'Does Raj like me?',
      interactionId: ingestRes.interaction_id,
    });

    const callsCountBefore = mockAi.realityCheckCallCount;

    // Simulate leaving and reopening the conversation multiple times
    await getPersonDetailsAction({ personId: person.person_id });
    await getPersonDetailsAction({ personId: person.person_id });
    await getPersonDetailsAction({ personId: person.person_id });

    // Assert zero additional AI Reality Check calls were executed during historical chat loading
    expect(mockAi.realityCheckCallCount).toBe(callsCountBefore);
  });

  it('10d. A different user cannot retrieve another person’s Reality Check (multi-tenant isolation)', async () => {
    setAuthUserOverride(USER_A);
    const personA = await personRepo.createPerson({ name: 'Raj' });

    const ingestRes = await ingestInteractionAction({
      personId: personA.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Does Raj like me?',
    });

    await runRealityCheckAction({
      personId: personA.person_id,
      query: 'Does Raj like me?',
      newMessageContent: 'Does Raj like me?',
      interactionId: ingestRes.interaction_id,
    });

    // Switch to User B trying to access User A's person details or reality check
    setAuthUserOverride(USER_B);
    const rcRepo = await getRealityCheckRepository(db);

    const crossRc = await rcRepo.getRealityCheckForInteraction(personA.person_id, ingestRes.interaction_id);
    expect(crossRc).toBeNull();

    const userBDetails = await getPersonDetailsAction({ personId: personA.person_id });
    expect(userBDetails.success).toBe(false);
    expect(userBDetails.realityChecks).toBeUndefined();
  });

  it('10e. Interaction with no Reality Check still loads correctly without manufactured checks', async () => {
    setAuthUserOverride(USER_A);
    const person = await personRepo.createPerson({ name: 'Sam' });

    // Ingest plain statement interaction with NO Reality Check
    const ingestRes = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent: 'Sam likes pizza.',
    });

    expect(ingestRes.success).toBe(true);

    const details = await getPersonDetailsAction({ personId: person.person_id });
    expect(details.success).toBe(true);
    expect(details.interactions?.length).toBe(1);

    const rcForInteraction = (details.realityChecks || []).find((r) => r.interaction_id === ingestRes.interaction_id);
    expect(rcForInteraction).toBeUndefined();
  });
});
