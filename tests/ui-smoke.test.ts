import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { initializeDatabaseIndexes } from '@/lib/db-init';
import { closeDbConnection, getDb } from '@/lib/db';
import { setAuthUserOverride } from '@/lib/auth';
import { setAIProviderOverride, MockAIProvider } from '@/lib/ai';
import {
  getPersonsAction,
  createPersonAction,
  getPersonDetailsAction,
  seedDemoPersonAction,
} from '@/app/actions/person.action';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import { runRealityCheckAction } from '@/app/actions/reality-check.action';

describe('Phase 5: Multi-Person Isolation & UI Switching Test Suite', () => {
  let mongoServer: MongoMemoryServer;

  const USER_DEMO = { user_id: 'usr_demo_888', email: 'demo_user@thirdwheel.ai', name: 'Demo User' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();

    const db = await getDb();
    await initializeDatabaseIndexes(db);

    setAuthUserOverride(USER_DEMO);
    setAIProviderOverride(new MockAIProvider());
  });

  afterAll(async () => {
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  it('Executes 10-step Person Creation, Switching, Receipt Ingestion, and Reality Check Flow', async () => {
    setAuthUserOverride(USER_DEMO);

    // Step 1: Existing person is visible (Seed Arjun)
    const seedRes = await seedDemoPersonAction();
    expect(seedRes.success).toBe(true);
    const arjunId = seedRes.personId;

    let personsListRes = await getPersonsAction();
    expect(personsListRes.persons.some((p) => p.person_id === arjunId)).toBe(true);

    // Step 2 & 3: Create a completely new person "Rahul"
    const rahulRes = await createPersonAction({
      name: 'Rahul',
      relationshipStatus: 'dating',
      summary: 'Met at gym',
    });
    expect(rahulRes.success).toBe(true);
    expect(rahulRes.person).toBeDefined();
    const rahulId = rahulRes.person!.person_id;

    // Step 4 & 5: Select Rahul and fetch memory space
    let rahulDetails = await getPersonDetailsAction({ personId: rahulId });
    expect(rahulDetails.success).toBe(true);
    expect(rahulDetails.person?.name).toBe('Rahul');
    expect(rahulDetails.memories?.length).toBe(0);

    // Step 6: Switch back to original person (Arjun)
    let arjunDetails = await getPersonDetailsAction({ personId: arjunId });
    expect(arjunDetails.success).toBe(true);
    expect(arjunDetails.person?.name).toBe('Arjun');
    expect(arjunDetails.memories?.some((m) => m.content.toLowerCase().includes('arsenal'))).toBe(true);

    // Step 7: Switch to Rahul again
    rahulDetails = await getPersonDetailsAction({ personId: rahulId });
    expect(rahulDetails.success).toBe(true);
    expect(rahulDetails.memories?.length).toBe(0);

    // Step 8: Run Reality Check on Rahul
    const rahulRC = await runRealityCheckAction({
      personId: rahulId,
      query: 'Does Rahul like playing tennis?',
    });
    expect(rahulRC.success).toBe(true);
    expect(rahulRC.result?.evidence_strength).toBe('INSUFFICIENT');

    // Step 9: Add a receipt to Rahul
    const ingestRes = await ingestInteractionAction({
      personId: rahulId,
      sourceType: 'pasted_text',
      rawContent: 'Rahul said he loves playing tennis on Saturdays and goes to gym every morning.',
    });
    expect(ingestRes.success).toBe(true);

    // Verify Rahul now has extracted memory
    rahulDetails = await getPersonDetailsAction({ personId: rahulId });
    expect(rahulDetails.memories?.length).toBeGreaterThan(0);
    expect(rahulDetails.memories?.some((m) => m.content.toLowerCase().includes('rahul'))).toBe(true);

    // Step 10: Return to original person (Arjun) and verify strict memory isolation
    arjunDetails = await getPersonDetailsAction({ personId: arjunId });
    expect(arjunDetails.memories?.some((m) => m.content.toLowerCase().includes('tennis'))).toBe(false);
    expect(arjunDetails.memories?.some((m) => m.content.toLowerCase().includes('arsenal'))).toBe(true);
  });
});
