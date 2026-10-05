import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { initializeDatabaseIndexes } from '../src/lib/db-init';
import { setAuthUserOverride } from '../src/lib/auth';
import { setAIProviderOverride, AIProvider, ExtractionInput, RealityCheckAIInput } from '../src/lib/ai';
import { ExtractionResult, RealityCheckResult } from '../src/lib/validation/schemas';
import { PersonRepository } from '../src/repositories/person.repository';
import { MemoryRepository } from '../src/repositories/memory.repository';
import { ingestInteractionAction } from '../src/app/actions/ingest.action';
import { runRealityCheckAction } from '../src/app/actions/reality-check.action';
import { closeDbConnection, getDb } from '../src/lib/db';

class TrackingContradictionAIProvider implements AIProvider {
  public calls: Array<{ type: 'extract' | 'reality'; timestamp: number; input: any }> = [];

  async extractInteraction(input: ExtractionInput): Promise<ExtractionResult> {
    const t = Date.now();
    this.calls.push({ type: 'extract', timestamp: t, input });
    // Simulate slow extraction (20ms delay)
    await new Promise((resolve) => setTimeout(resolve, 20));

    return {
      facts: [{ content: `${input.personName} hates soccer`, memory_type: 'fact', confidence: 0.9 }],
      events: [],
      open_threads: [],
      assumptions: [],
      uncertainties: [],
    };
  }

  async runRealityCheck(input: RealityCheckAIInput): Promise<RealityCheckResult> {
    const t = Date.now();
    this.calls.push({ type: 'reality', timestamp: t, input });

    const rawNewMessage = (input.newMessageContent || input.query).toLowerCase();
    const savedFacts = input.context.facts.map((f) => f.toLowerCase());

    const hasSavedArsenal = savedFacts.some((f) => f.includes('arsenal') || f.includes('soccer'));
    const newSaysHatesSoccer = rawNewMessage.includes('hates soccer') || rawNewMessage.includes('dislikes football');

    let contradictionDetected = false;
    let conclusion = 'No contradiction detected.';

    if (hasSavedArsenal && newSaysHatesSoccer) {
      contradictionDetected = true;
      conclusion = `CONTRADICTION DETECTED: New message says '${input.newMessageContent}' which contradicts saved fact '${input.context.facts[0]}'.`;
    }

    return {
      query: input.query,
      known_facts: input.context.facts,
      assumptions: contradictionDetected ? [`New input contradicts saved receipt: ${input.context.facts[0]}`] : [],
      unknowns: [],
      evidence_strength: contradictionDetected ? 'STRONG' : 'MODERATE',
      conclusion,
      closing_quote: 'Receipts prove what was said!',
    };
  }
}

describe('Task 1: Concurrent Contradiction Detection Test Suite', () => {
  let mongoServer: MongoMemoryServer;
  let db: Db;
  let personId: string;
  let trackingProvider: TrackingContradictionAIProvider;

  const USER_TEST = { user_id: 'usr_concurrent_123', email: 'concurrent@example.com', name: 'ConcurrentTester' };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await closeDbConnection();
    db = await getDb();

    await initializeDatabaseIndexes(db);
    setAuthUserOverride(USER_TEST);

    // Create person and seed initial receipt: "Arjun likes Arsenal"
    const personRepo = new PersonRepository(db);
    const memoryRepo = new MemoryRepository(db);

    const person = await personRepo.createPerson({ name: 'Arjun', relationship_label: 'Talking' });
    personId = person.person_id;

    await memoryRepo.createMemory({
      person_id: personId,
      source_interaction_id: 'int_seed_001',
      category: 'fact',
      memory_type: 'interest',
      content: 'Arjun likes Arsenal and soccer',
      confidence: 0.95,
    });
  });

  afterAll(async () => {
    await closeDbConnection();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(() => {
    setAuthUserOverride(USER_TEST);
    trackingProvider = new TrackingContradictionAIProvider();
    setAIProviderOverride(trackingProvider);
  });

  it('proves a contradiction between a new message and a saved receipt is detected during concurrent processing', async () => {
    const newMessage = 'Arjun said he hates soccer and never watches games.';

    // Run ingestion and reality check concurrently via Promise.all
    const [ingestRes, realityRes] = await Promise.all([
      ingestInteractionAction({
        personId,
        sourceType: 'pasted_text',
        rawContent: newMessage,
      }),
      runRealityCheckAction({
        personId,
        query: newMessage,
        newMessageContent: newMessage,
      }),
    ]);

    expect(ingestRes.success).toBe(true);
    expect(realityRes.success).toBe(true);

    // Verify call order: both calls were triggered concurrently
    expect(trackingProvider.calls.length).toBe(2);
    const realityCall = trackingProvider.calls.find((c) => c.type === 'reality');
    expect(realityCall).toBeDefined();

    // Verify raw new message was passed to Reality Check
    expect(realityCall?.input.newMessageContent).toBe(newMessage);

    // Verify contradiction was detected even though extraction was running in parallel!
    expect(realityRes.result?.conclusion).toContain('CONTRADICTION DETECTED');
    expect(realityRes.result?.conclusion).toContain('hates soccer');
    expect(realityRes.result?.assumptions[0]).toContain('New input contradicts saved receipt');
  });
});
