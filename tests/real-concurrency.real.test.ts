import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db } from 'mongodb';
import { closeDbConnection, getDb } from '@/lib/db';
import { initializeDatabaseIndexes } from '@/lib/db-init';
import { setAuthUserOverride } from '@/lib/auth';
import { setAIProviderOverride, GemmaAIProvider } from '@/lib/ai';
import { PersonRepository } from '@/repositories/person.repository';
import { MemoryRepository } from '@/repositories/memory.repository';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import { runRealityCheckAction } from '@/app/actions/reality-check.action';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

describe('Real API Concurrency Test (npm run test:real)', () => {
  let mongoServer: MongoMemoryServer;
  let db: Db;
  const testUser = { user_id: 'usr_real_concurrency_999', email: 'concurrency@example.com', name: 'ConcurrencyUser' };
  let personId: string;

  beforeAll(async () => {
    process.env.USE_REAL_GEMMA = 'true';
    process.env.GEMMA_MODEL_NAME = 'gemini-3.6-flash';
    process.env.GEMMA_EXTRACTION_MODEL_NAME = 'gemini-3.5-flash-lite';
    setAIProviderOverride(new GemmaAIProvider());

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;

    await closeDbConnection();
    db = await getDb();
    await initializeDatabaseIndexes(db);
    setAuthUserOverride(testUser);

    const personRepo = new PersonRepository(db);
    const person = await personRepo.createPerson({
      name: 'Maya Real',
      relationship_status: 'dating',
    });
    personId = person.person_id;
  }, 30000);

  afterAll(async () => {
    if (personId && db) {
      try {
        const personRepo = new PersonRepository(db);
        await personRepo.deletePerson(personId);
      } catch {}
    }
    await closeDbConnection();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('detects contradiction between a saved receipt and a new message running concurrently with ingestion', async () => {
    const t0 = performance.now();

    // Step 1: Save first interaction & extract receipts ("free on Friday evening")
    const msg1 = 'Maya said she is completely free on Friday evening and wants to grab dinner.';
    const ingestRes1 = await ingestInteractionAction({
      personId,
      sourceType: 'pasted_text',
      rawContent: msg1,
    });

    expect(ingestRes1.success).toBe(true);
    const t1 = performance.now();
    console.log(`[REAL TEST TIMING] Step 1 (Save 'free on Friday'): ${(t1 - t0).toFixed(2)}ms`);

    // Verify memory was saved in DB
    const memoryRepo = new MemoryRepository(db);
    const memories = await memoryRepo.getMemoriesForPerson(personId);
    expect(memories.length).toBeGreaterThan(0);
    console.log(`[REAL TEST] Saved initial memory count: ${memories.length} | First: "${memories[0].content}"`);

    // Step 2: Send second message ("Today she said she has an exam on Friday and can't meet")
    // Run ingestion and Reality Check concurrently via Promise.all
    const msg2 = "Today she said she has an exam on Friday and can't meet.";

    const tConcurrentStart = performance.now();
    const [ingestRes2, realityRes] = await Promise.all([
      ingestInteractionAction({
        personId,
        sourceType: 'pasted_text',
        rawContent: msg2,
      }),
      runRealityCheckAction({
        personId,
        query: msg2,
        newMessageContent: msg2,
      }),
    ]);
    const tConcurrentEnd = performance.now();

    console.log(
      `[REAL TEST TIMING] Step 2 Concurrent Ingestion + Reality Check: ${(tConcurrentEnd - tConcurrentStart).toFixed(2)}ms`
    );
    console.log(`[REAL TEST RESULT] Reality Check Conclusion:\n"${realityRes.result?.conclusion}"`);

    expect(ingestRes2.success).toBe(true);
    expect(realityRes.success).toBe(true);
    expect(realityRes.result).toBeDefined();

    const conclusion = (realityRes.result?.conclusion || '').toLowerCase();
    const knownFacts = (realityRes.result?.known_facts || []).join(' ').toLowerCase();
    const combinedText = `${conclusion} ${knownFacts}`;

    // Assert reply mentions Friday conflict / contradiction
    const mentionsFriday = combinedText.includes('friday');
    const mentionsConflictOrExam =
      combinedText.includes('exam') ||
      combinedText.includes('contradict') ||
      combinedText.includes('conflict') ||
      combinedText.includes("can't meet") ||
      combinedText.includes('cannot meet') ||
      combinedText.includes('cannot both be true');

    expect(mentionsFriday).toBe(true);
    expect(mentionsConflictOrExam).toBe(true);
  }, 45000);
});
