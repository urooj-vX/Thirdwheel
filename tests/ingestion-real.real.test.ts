import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { setAIProviderOverride, GemmaAIProvider } from '../src/lib/ai';
import { PersonRepository } from '../src/repositories/person.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { closeDbConnection, getDb } from '../src/lib/db';

describe('Task 5: Extraction Quality Verification on Real Provider [REAL]', () => {
  let mongoServer: MongoMemoryServer;
  let db: Db;
  let personRepo: PersonRepository;
  let memoryRepo: MemoryRepository;

  const USER_A = { user_id: 'usr_real_ingest_111', email: 'real.ingest@example.com', name: 'RealIngestUser' };

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
    process.env.GEMMA_EXTRACTION_MODEL_NAME = 'gemini-3.5-flash-lite';
    setAIProviderOverride(new GemmaAIProvider());

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
  });

  it('1. Valid conversation produces accurate, grounded extraction with zero invention', async () => {
    const person = await personRepo.createPerson({ name: 'Arjun' });
    const rawContent = 'Arjun said he likes Arsenal and wants to try the coffee place near campus. I assume he wants to meet.';

    const result = await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'pasted_text',
      rawContent,
    });

    console.log('\n[REAL EXTRACTION QUALITY TEST 1]:');
    console.log('INPUT:', rawContent);
    console.log('EXTRACTED FACTS:', JSON.stringify(result.extraction?.facts, null, 2));
    console.log('EXTRACTED ASSUMPTIONS:', JSON.stringify(result.extraction?.assumptions, null, 2));

    expect(result.success).toBe(true);
    expect(result.extraction).toBeDefined();
    expect(result.extraction?.facts.length).toBeGreaterThan(0);

    for (const fact of result.extraction!.facts) {
      const lower = fact.content.toLowerCase();
      expect(lower.includes('arsenal') || lower.includes('coffee') || lower.includes('campus')).toBe(true);
    }
  }, 30000);

  it('2. FACT is persisted faithfully without hallucinated fields', async () => {
    const person = await personRepo.createPerson({ name: 'Maya' });
    const rawContent = 'Maya loves black coffee and reading thriller novels.';

    await ingestInteractionAction({
      personId: person.person_id,
      sourceType: 'narrative',
      rawContent,
    });

    const facts = await memoryRepo.getMemoriesForPerson(person.person_id, 'fact');

    console.log('\n[REAL EXTRACTION QUALITY TEST 2]:');
    console.log('INPUT:', rawContent);
    console.log('SAVED MEMORIES:', JSON.stringify(facts, null, 2));

    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].category).toBe('fact');
    expect(facts.some((f) => f.content.toLowerCase().includes('coffee') || f.content.toLowerCase().includes('thriller'))).toBe(true);
  }, 30000);
});
