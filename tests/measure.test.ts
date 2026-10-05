import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { getPersonRepository } from '../src/repositories/person.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { runRealityCheckAction } from '../src/app/actions/reality-check.action';
import { closeDbConnection, getDb } from '../src/lib/db';

describe('Performance Measurement - 3 Test Messages Benchmark', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let personId: string;

  const USER_BENCHMARK = { user_id: 'usr_bench_999', email: 'bench@example.com', name: 'BenchmarkUser' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();
    db = await getDb();

    await initializeDatabaseIndexes(db);
    setAuthUserOverride(USER_BENCHMARK);

    const personRepo = await getPersonRepository(db);
    const p = await personRepo.createPerson({ name: 'Arjun', relationship_status: 'talking' });
    personId = p.person_id;
  });

  afterAll(async () => {
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  it('Measures Message 1: Ingesting receipts', async () => {
    const rawContent = 'Arjun said he likes Arsenal and wants to try the campus coffee shop.';
    const tStart = performance.now();
    const res = await ingestInteractionAction({
      personId,
      sourceType: 'pasted_text',
      rawContent,
    });
    const duration = performance.now() - tStart;
    console.log(`[BENCHMARK] Message 1 (Ingestion): ${duration.toFixed(2)} ms | Success: ${res.success}`);
    expect(res.success).toBe(true);
    expect(duration).toBeLessThan(10000); // Target < 10s
  }, 30000);

  it('Measures Message 2: Advice / Reality Check Query', async () => {
    const query = 'What team does Arjun like and what coffee shop does he want to visit?';
    const tStart = performance.now();
    const res = await runRealityCheckAction({
      personId,
      query,
    });
    const duration = performance.now() - tStart;
    console.log(`[BENCHMARK] Message 2 (Advice / Reality Check): ${duration.toFixed(2)} ms | Success: ${res.success}`);
    expect(res.success).toBe(true);
    expect(duration).toBeLessThan(15000); // Target < 15s
  }, 30000);

  it('Measures Message 3: Contradiction Ingestion & Advice', async () => {
    const rawContent = 'Arjun said he hates soccer and never drinks coffee.';
    const tStart = performance.now();
    const ingestRes = await ingestInteractionAction({
      personId,
      sourceType: 'pasted_text',
      rawContent,
    });
    const realityRes = await runRealityCheckAction({
      personId,
      query: rawContent,
    });
    const duration = performance.now() - tStart;
    console.log(`[BENCHMARK] Message 3 (Contradiction Ingest + Check): ${duration.toFixed(2)} ms | Success: ${ingestRes.success && realityRes.success}`);
    expect(ingestRes.success).toBe(true);
    expect(realityRes.success).toBe(true);
    expect(duration).toBeLessThan(15000); // Target < 15s
  }, 30000);
});
