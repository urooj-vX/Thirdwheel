import { Db } from 'mongodb';

export async function initializeDatabaseIndexes(db: Db): Promise<void> {
  // Collection: persons (Unique compound index per user)
  await db.collection('persons').createIndex(
    { user_id: 1, person_id: 1 },
    { unique: true, name: 'idx_persons_user_person_unique' }
  );

  // Collection: interactions (Compound query index)
  await db.collection('interactions').createIndex(
    { user_id: 1, person_id: 1, timestamp: -1 },
    { name: 'idx_interactions_user_person_time' }
  );

  // Collection: memories (Compound query index by category)
  await db.collection('memories').createIndex(
    { user_id: 1, person_id: 1, category: 1 },
    { name: 'idx_memories_user_person_category' }
  );
  await db.collection('memories').createIndex(
    { user_id: 1, person_id: 1, memory_id: 1 },
    { name: 'idx_memories_user_person_memory_id' }
  );

  // Collection: events (Compound query index by event date)
  await db.collection('events').createIndex(
    { user_id: 1, person_id: 1, event_date: -1 },
    { name: 'idx_events_user_person_date' }
  );

  // Collection: open_threads (Compound query index by status)
  await db.collection('open_threads').createIndex(
    { user_id: 1, person_id: 1, status: 1 },
    { name: 'idx_threads_user_person_status' }
  );

  // Collection: embeddings (Compound query index for RAG)
  await db.collection('embeddings').createIndex(
    { user_id: 1, person_id: 1, memory_id: 1 },
    { name: 'idx_embeddings_user_person_memory' }
  );
}
