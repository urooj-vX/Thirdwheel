const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// 1. Load .env.local variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

process.env.USE_REAL_GEMMA = 'true';

async function runRealBenchmark() {
  console.log('===============================================================');
  console.log('       REAL GEMMA/GEMINI PERFORMANCE MEASUREMENT BENCHMARK     ');
  console.log('===============================================================');
  console.log(`[MODE] PROVIDER: REAL (API Key configured from .env.local)`);
  console.log(`[MODE] EXTRACTION MODEL: ${process.env.GEMMA_EXTRACTION_MODEL_NAME || 'gemini-3.5-flash-lite'}`);
  console.log(`[MODE] REALITY CHECK MODEL: ${process.env.GEMMA_MODEL_NAME || 'gemini-3.8-flash'}`);
  console.log('---------------------------------------------------------------\n');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  const { closeDbConnection, getDb } = require('../src/lib/db');
  const { initializeDatabaseIndexes } = require('../src/lib/db-init');
  const { setAuthUserOverride } = require('../src/lib/auth');
  const { getPersonRepository } = require('../src/repositories/person.repository');
  const { ingestInteractionAction } = require('../src/app/actions/ingest.action');
  const { runRealityCheckAction } = require('../src/app/actions/reality-check.action');

  await closeDbConnection();
  const db = await getDb();
  await initializeDatabaseIndexes(db);

  const USER_REAL = { user_id: 'usr_real_benchmark_888', email: 'real@example.com', name: 'RealBenchmarker' };
  setAuthUserOverride(USER_REAL);

  const personRepo = await getPersonRepository(db);
  const freshPerson = await personRepo.createPerson({ name: 'Arjun_RealBench', relationship_label: 'Talking' });
  const personId = freshPerson.person_id;

  const results = [];

  // -------------------------------------------------------------------
  // Message 1: (a) Save two facts
  // -------------------------------------------------------------------
  const msg1Content = 'Arjun said he likes Arsenal and works out at 7 AM every morning.';
  console.log(`\n[REAL] Processing Message 1: "${msg1Content}"`);
  const t1Start = performance.now();
  const res1 = await ingestInteractionAction({
    personId,
    sourceType: 'pasted_text',
    rawContent: msg1Content,
  });
  const t1Duration = performance.now() - t1Start;
  console.log(`[REAL] Message 1 Total Duration: ${t1Duration.toFixed(2)} ms | Success: ${res1.success}`);

  results.push({
    messageLabel: 'Message 1 (Save 2 facts)',
    mode: 'REAL',
    modelName: process.env.GEMMA_EXTRACTION_MODEL_NAME || 'gemini-3.5-flash-lite',
    totalDurationMs: t1Duration.toFixed(2),
    success: res1.success,
  });

  // -------------------------------------------------------------------
  // Message 2: (b) Contradicting fact
  // -------------------------------------------------------------------
  const msg2Content = 'Arjun said he hates soccer and never goes to the gym.';
  console.log(`\n[REAL] Processing Message 2: "${msg2Content}"`);
  const t2Start = performance.now();
  const res2 = await ingestInteractionAction({
    personId,
    sourceType: 'pasted_text',
    rawContent: msg2Content,
  });
  const t2Duration = performance.now() - t2Start;
  console.log(`[REAL] Message 2 Total Duration: ${t2Duration.toFixed(2)} ms | Success: ${res2.success}`);

  results.push({
    messageLabel: 'Message 2 (Contradicting fact)',
    mode: 'REAL',
    modelName: process.env.GEMMA_EXTRACTION_MODEL_NAME || 'gemini-3.5-flash-lite',
    totalDurationMs: t2Duration.toFixed(2),
    success: res2.success,
  });

  // -------------------------------------------------------------------
  // Message 3: (c) Advice / Reality Check Question
  // -------------------------------------------------------------------
  const msg3Query = 'Does Arjun like soccer and working out, or is there a contradiction?';
  console.log(`\n[REAL] Processing Message 3: "${msg3Query}"`);
  const t3Start = performance.now();
  const res3 = await runRealityCheckAction({
    personId,
    query: msg3Query,
    newMessageContent: msg3Query,
  });
  const t3Duration = performance.now() - t3Start;
  console.log(`[REAL] Message 3 Total Duration: ${t3Duration.toFixed(2)} ms | Success: ${res3.success}`);

  results.push({
    messageLabel: 'Message 3 (Advice Question)',
    mode: 'REAL',
    modelName: process.env.GEMMA_MODEL_NAME || 'gemini-3.8-flash',
    totalDurationMs: t3Duration.toFixed(2),
    success: res3.success,
  });

  console.log('\n===============================================================');
  console.log('             SUMMARY TABLE: REAL PROVIDER BENCHMARK            ');
  console.log('===============================================================');
  console.table(results);

  if (res3.result) {
    console.log('\n[REAL AI ADVICE CONCLUSION]:');
    console.log(res3.result.conclusion);
  }

  await closeDbConnection();
  await mongoServer.stop();
}

runRealBenchmark().catch((err) => {
  console.error('[REAL BENCHMARK ERROR]', err);
  process.exit(1);
});
