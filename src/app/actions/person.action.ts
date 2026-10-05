'use server';

import { getAuthUser } from '@/lib/auth';
import { getPersonRepository } from '@/repositories/person.repository';
import { getMemoryRepository } from '@/repositories/memory.repository';
import { getOpenThreadRepository } from '@/repositories/open-thread.repository';
import { getEventRepository } from '@/repositories/event.repository';
import { getInteractionRepository } from '@/repositories/interaction.repository';
import { getRealityCheckRepository } from '@/repositories/reality-check.repository';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import {
  PersonDocument,
  MemoryDocument,
  OpenThreadDocument,
  EventDocument,
  InteractionDocument,
  RealityCheckDocument,
} from '@/types';

import { serialize } from '@/lib/serialize';

export interface PersonCardSummary {
  person_id: string;
  name: string;
  section: 'active' | 'archived' | 'deleted';
  relationship_label?: string;
  relationship_status?: string;
  summary?: string;
  deleted_at?: Date;
  created_at: Date;
  factCount: number;
  assumptionCount: number;
  uncertaintyCount: number;
  lastInteractionTimestamp: Date;
  latestReceipt?: string;
}

export interface GetPersonDetailsResponse {
  success: boolean;
  person?: PersonDocument;
  memories?: MemoryDocument[];
  openThreads?: OpenThreadDocument[];
  events?: EventDocument[];
  interactions?: InteractionDocument[];
  realityChecks?: RealityCheckDocument[];
  stats?: {
    factCount: number;
    assumptionCount: number;
    uncertaintyCount: number;
    threadCount: number;
    eventCount: number;
    interactionCount: number;
    realityCheckCount: number;
  };
  error?: string;
}

/**
 * Action: Fetch all people for the authenticated user along with their memory counts and section.
 */
export async function getPersonsAction(): Promise<{ success: boolean; persons: PersonCardSummary[]; error?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const memoryRepo = await getMemoryRepository();
    const interactionRepo = await getInteractionRepository();

    const persons = await personRepo.getPersonsByUser();

    const summaries: PersonCardSummary[] = await Promise.all(
      persons.map(async (p) => {
        const memories = await memoryRepo.getMemoriesForPerson(p.person_id);
        const interactions = await interactionRepo.getInteractionsForPerson(p.person_id);

        const factCount = memories.filter((m) => m.category === 'fact').length;
        const assumptionCount = memories.filter((m) => m.category === 'assumption').length;
        const uncertaintyCount = memories.filter((m) => m.category === 'uncertainty').length;

        const latestInteraction = interactions.length > 0 ? interactions[0].timestamp : p.created_at;
        const latestReceipt = memories.length > 0 ? memories[0].content : interactions.length > 0 ? interactions[0].raw_content : undefined;

        const relLabel =
          p.relationship_label?.trim() ||
          (p.relationship_status
            ? p.relationship_status.charAt(0).toUpperCase() + p.relationship_status.slice(1)
            : undefined);

        return {
          person_id: p.person_id,
          name: p.name,
          section: p.section || 'active',
          relationship_label: relLabel,
          relationship_status: p.relationship_status,
          summary: p.summary,
          deleted_at: p.deleted_at,
          created_at: p.created_at,
          factCount,
          assumptionCount,
          uncertaintyCount,
          lastInteractionTimestamp: latestInteraction,
          latestReceipt,
        };
      })
    );

    return serialize({ success: true, persons: summaries });
  } catch (err: unknown) {
    return serialize({ success: false, persons: [], error: err instanceof Error ? err.message : 'Failed to fetch persons' });
  }
}

/**
 * Action: Create a new Person document for the authenticated user.
 */
export async function createPersonAction(params: {
  name: string;
  relationshipLabel?: string;
  relationshipStatus?: 'talking' | 'dating' | 'ex' | 'friend' | 'paused';
  summary?: string;
  section?: 'active' | 'archived' | 'deleted';
}): Promise<{ success: boolean; person?: PersonDocument; error?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const person = await personRepo.createPerson({
      name: params.name,
      relationship_label: params.relationshipLabel,
      relationship_status: params.relationshipStatus,
      summary: params.summary,
      section: params.section || 'active',
    });

    return serialize({ success: true, person });
  } catch (err: unknown) {
    return serialize({ success: false, error: err instanceof Error ? err.message : 'Failed to create person' });
  }
}

/**
 * Action: Update a person's section ('active' | 'archived' | 'deleted').
 */
export async function updatePersonSectionAction(params: {
  personId: string;
  section: 'active' | 'archived' | 'deleted';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const success = await personRepo.updatePersonSection(params.personId, params.section);
    return serialize({ success });
  } catch (err: unknown) {
    return serialize({ success: false, error: err instanceof Error ? err.message : 'Failed to update section' });
  }
}

/**
 * Action: Permanently delete a person and all their saved receipts, memories, threads, and interactions.
 */
export async function deletePersonPermanentlyAction(params: {
  personId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const success = await personRepo.deletePerson(params.personId);
    return serialize({ success });
  } catch (err: unknown) {
    return serialize({ success: false, error: err instanceof Error ? err.message : 'Failed to delete person permanently' });
  }
}

/**
 * Action: Get detailed memory space, threads, events, interactions, and reality checks for a specific person.
 */
export async function getPersonDetailsAction(params: {
  personId: string;
}): Promise<GetPersonDetailsResponse> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const memoryRepo = await getMemoryRepository();
    const threadRepo = await getOpenThreadRepository();
    const eventRepo = await getEventRepository();
    const interactionRepo = await getInteractionRepository();
    const realityCheckRepo = await getRealityCheckRepository();

    const person = await personRepo.getPersonById(params.personId);
    if (!person) {
      return serialize({ success: false, error: `Person not found or access denied: ${params.personId}` });
    }

    const memories = await memoryRepo.getMemoriesForPerson(params.personId);
    const openThreads = await threadRepo.getOpenThreadsForPerson(params.personId);
    const events = await eventRepo.getEventsForPerson(params.personId);
    const interactions = await interactionRepo.getInteractionsForPerson(params.personId);
    const realityChecks = await realityCheckRepo.getRealityChecksForPerson(params.personId);

    const factCount = memories.filter((m) => m.category === 'fact').length;
    const assumptionCount = memories.filter((m) => m.category === 'assumption').length;
    const uncertaintyCount = memories.filter((m) => m.category === 'uncertainty').length;

    return serialize({
      success: true,
      person,
      memories,
      openThreads,
      events,
      interactions,
      realityChecks,
      stats: {
        factCount,
        assumptionCount,
        uncertaintyCount,
        threadCount: openThreads.length,
        eventCount: events.length,
        interactionCount: interactions.length,
        realityCheckCount: realityChecks.length,
      },
    });
  } catch (err: unknown) {
    return serialize({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch person details' });
  }
}

/**
 * Action: Seed or ensure the "Arjun" critical demo state exists for easy presentation.
 */
export async function seedDemoPersonAction(): Promise<{ success: boolean; personId: string; error?: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.user_id) throw new Error('Unauthorized');

    const personRepo = await getPersonRepository();
    const persons = await personRepo.getPersonsByUser();

    let arjun = persons.find((p) => p.name.toLowerCase() === 'arjun');

    if (!arjun) {
      arjun = await personRepo.createPerson({
        name: 'Arjun',
        relationship_status: 'talking',
        summary: 'Met at university coffee shop.',
      });
    }

    // Check if Arjun has any extracted memories yet
    const memoryRepo = await getMemoryRepository();
    const memories = await memoryRepo.getMemoriesForPerson(arjun.person_id);

    if (memories.length === 0) {
      // Ingest the canonical demo receipt
      await ingestInteractionAction({
        personId: arjun.person_id,
        sourceType: 'pasted_text',
        rawContent: 'Arjun said he likes Arsenal and wants to try the coffee shop near campus.',
      });
    }

    return serialize({ success: true, personId: arjun.person_id });
  } catch (err: unknown) {
    return serialize({ success: false, personId: '', error: err instanceof Error ? err.message : 'Failed to seed demo person' });
  }
}
