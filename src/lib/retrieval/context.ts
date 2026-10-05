import { getPersonRepository } from '@/repositories/person.repository';
import { getMemoryRepository } from '@/repositories/memory.repository';
import { getEventRepository } from '@/repositories/event.repository';
import { getOpenThreadRepository } from '@/repositories/open-thread.repository';
import { Db } from 'mongodb';

export interface RetrievePersonContextParams {
  userId: string;
  personId: string;
  query: string;
}

export interface PersonContext {
  personId: string;
  personName: string;
  relationshipStatus: string;
  summary?: string;
  facts: string[];
  assumptions: string[];
  uncertainties: string[];
  events: Array<{ title: string; description?: string; event_date?: Date }>;
  openThreads: string[];
}

/**
 * Scoped Person Memory Context Retrieval.
 * 
 * SYSTEM INVARIANT:
 * Strictly enforces user_id AND person_id matching across all collections.
 * Never retrieves memories belonging to another person or another user.
 */
export async function retrievePersonContext(
  params: RetrievePersonContextParams,
  customDb?: Db
): Promise<PersonContext> {
  const { userId, personId } = params;

  if (!userId || !personId) {
    throw new Error('Both userId and personId are required for context retrieval');
  }

  const personRepo = await getPersonRepository(customDb);
  const memoryRepo = await getMemoryRepository(customDb);
  const eventRepo = await getEventRepository(customDb);
  const openThreadRepo = await getOpenThreadRepository(customDb);

  // 1. Verify target person exists for authenticated user
  const person = await personRepo.getPersonById(personId);
  if (!person || person.user_id !== userId) {
    throw new Error(`Person not found or access denied for person_id: ${personId}`);
  }

  // 2. Fetch scoped memories for this person
  const [facts, assumptions, uncertainties, events, threads] = await Promise.all([
    memoryRepo.getMemoriesForPerson(personId, 'fact'),
    memoryRepo.getMemoriesForPerson(personId, 'assumption'),
    memoryRepo.getMemoriesForPerson(personId, 'uncertainty'),
    eventRepo.getEventsForPerson(personId),
    openThreadRepo.getOpenThreadsForPerson(personId, 'open'),
  ]);

  return {
    personId: person.person_id,
    personName: person.name,
    relationshipStatus: person.relationship_label || person.relationship_status || '',
    summary: person.summary,
    facts: facts.map((m) => m.content),
    assumptions: assumptions.map((m) => m.content),
    uncertainties: uncertainties.map((m) => m.content),
    events: events.map((e) => ({
      title: e.title,
      description: e.description,
      event_date: e.event_date,
    })),
    openThreads: threads.map((t) => t.topic),
  };
}
