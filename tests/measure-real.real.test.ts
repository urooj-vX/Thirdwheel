import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { getPersonRepository } from '../src/repositories/person.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { runRealityCheckAction } from '../src/app/actions/reality-check.action';
import { closeDbConnection, getDb } from '../src/lib/db';
import { setAIProviderOverride, GemmaAIProvider } from '../src/lib/ai';

describe('Real Gemma/Gemini Performance Measurement Benchmark [REAL]', () => {
  let mongoServer: MongoMemoryServer;
  let db: Db;
  let personId: string;

  const USER_REAL = { user_id: 'usr_real_perf_777', email: 'real.perf@example.com', name: 'RealPerfUser' };

  beforeAll(async () => {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, 'utf8');
      envText.split('\n').forEach((line) => {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim();
      });
    }

    process.env.USE_REAL_GEMMA = 'true';
    setAIProviderOverride(new GemmaAIProvider());

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();
    db = await getDb();

    await initializeDatabaseIndexes(db);
    setAuthUserOverride(USER_REAL);

    const personRepo = await getPersonRepository(db);
    const p = await personRepo.createPerson({ name: 'Arjun_RealTest', relationship_label: 'Talking' });
    personId = p.person_id;
  }, 30000);

  afterAll(async () => {
    if (personId && db) {
      try {
        const personRepo = await getPersonRepository(db);
        await personRepo.deletePerson(personId);
      } catch {}
    }
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  it('Message 1 [REAL]: (a) Save two facts', async () => {
    const rawContent = 'Arjun said he likes Arsenal and works out at 7 AM every morning.';
    console.log(`\n[REAL BENCHMARK] Message 1: "${rawContent}"`);
    const tStart = performance.now();
    const res = await ingestInteractionAction({
      personId,
      sourceType: 'pasted_text',
      rawContent,
    });
    const duration = performance.now() - tStart;
    console.log(`[REAL BENCHMARK RESULT] Message 1 Wall-Clock Duration: ${duration.toFixed(2)} ms | Primary Extraction Model: gemini-3.5-flash-lite | Success: ${res.success}`);
    expect(res.success).toBe(true);
  }, 45000);

  it('Message 2 [REAL]: (b) Contradicting fact', async () => {
    const rawContent = 'Arjun said he hates soccer and never goes to the gym.';
    console.log(`\n[REAL BENCHMARK] Message 2: "${rawContent}"`);
    const tStart = performance.now();
    const res = await ingestInteractionAction({
      personId,
      sourceType: 'pasted_text',
      rawContent,
    });
    const duration = performance.now() - tStart;
    console.log(`[REAL BENCHMARK RESULT] Message 2 Wall-Clock Duration: ${duration.toFixed(2)} ms | Primary Extraction Model: gemini-3.5-flash-lite | Success: ${res.success}`);
    expect(res.success).toBe(true);
  }, 45000);

  it('Message 3 [REAL]: (c) Advice question & Reality Check', async () => {
    const query = 'Should I ask Arjun to watch the Arsenal game with me or is there a contradiction?';
    console.log(`\n[REAL BENCHMARK] Message 3: "${query}"`);
    const tStart = performance.now();
    const res = await runRealityCheckAction({
      personId,
      query,
      newMessageContent: query,
    });
    const duration = performance.now() - tStart;
    console.log(`[REAL BENCHMARK RESULT] Message 3 Wall-Clock Duration: ${duration.toFixed(2)} ms | Primary Reality Check Model: gemini-3.6-flash | Success: ${res.success}`);
    if (res.result) {
      console.log(`[REAL AI ADVICE CONCLUSION]: ${res.result.conclusion}`);
    }
    expect(res.success).toBe(true);
  }, 45000);
});
