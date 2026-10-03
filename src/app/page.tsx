'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { PersonCard } from '@/components/PersonCard';
import { AddPersonModal } from '@/components/AddPersonModal';
import { AddReceiptSection } from '@/components/AddReceiptSection';
import { RealityCheckSection } from '@/components/RealityCheckSection';
import { MemoryVaultSection } from '@/components/MemoryVaultSection';
import {
  getPersonsAction,
  createPersonAction,
  getPersonDetailsAction,
  seedDemoPersonAction,
  PersonCardSummary,
  GetPersonDetailsResponse,
} from '@/app/actions/person.action';
import { Plus } from 'lucide-react';

export default function HomePage() {
  const [persons, setPersons] = useState<PersonCardSummary[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<GetPersonDetailsResponse | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'reality_check' | 'add_receipt'>('overview');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load people list from server action
  const loadPersons = useCallback(async (selectPersonId?: string) => {
    try {
      setError(null);
      const res = await getPersonsAction();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch persons');
      }

      setPersons(res.persons);

      if (selectPersonId !== undefined) {
        setActivePersonId(selectPersonId || null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading people');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch details for currently selected active person
  const loadActivePersonDetails = useCallback(async () => {
    if (!activePersonId) return;

    try {
      const details = await getPersonDetailsAction({ personId: activePersonId });
      if (details.success) {
        setPersonDetails(details);
      } else {
        setError(details.error || 'Failed to load details for person');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading details');
    }
  }, [activePersonId]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  useEffect(() => {
    if (activePersonId) {
      loadActivePersonDetails();
    }
  }, [activePersonId, loadActivePersonDetails]);

  // Handler: Add new person
  const handleAddPerson = async (data: {
    name: string;
    relationshipStatus: 'talking' | 'dating' | 'ex' | 'friend' | 'paused';
    summary?: string;
  }) => {
    const res = await createPersonAction(data);
    if (!res.success || !res.person) {
      throw new Error(res.error || 'Failed to create person');
    }
    await loadPersons(res.person.person_id);
    setActivePersonId(res.person.person_id);
    setActiveTab('overview');
  };

  // Handler: Seed Arjun Demo
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      setError(null);
      const res = await seedDemoPersonAction();
      if (!res.success || !res.personId) {
        throw new Error(res.error || 'Failed to seed demo');
      }
      await loadPersons(res.personId);
      setActivePersonId(res.personId);
      setActiveTab('overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const activePerson = persons.find((p) => p.person_id === activePersonId);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1B1A] flex flex-col font-sans">
      {/* Header */}
      <Header
        persons={persons}
        activePersonId={activePersonId}
        onSelectPerson={(id) => {
          setActivePersonId(id);
          setActiveTab('overview');
        }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline font-medium">
              Dismiss
            </button>
          </div>
        )}

        {/* HOMEPAGE VIEW (When no person is open) */}
        {!activePersonId && (
          <div className="space-y-14 animate-fade-in">
            {/* Editorial Hero */}
            <section className="space-y-4 max-w-2xl">
              <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#1C1B1A] leading-[1.15]">
                Remember what happened.<br />
                <span className="italic font-normal text-[#6E6A63]">Not what you think happened.</span>
              </h1>
              <p className="text-base text-[#6E6A63] font-sans leading-relaxed pt-2">
                Third Wheel is a private relationship journal. It replaces anxiety and guesswork with evidence-grounded clarity, separating what was actually said from what you inferred.
              </p>
            </section>

            {/* People List Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-3">
                <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
                  People
                </h2>
                <button
                  onClick={() => setIsAddPersonOpen(true)}
                  className="text-xs font-medium text-[#C85A32] hover:underline"
                >
                  + Add person
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 rounded-2xl border border-[#E6E1DA] bg-white animate-pulse" />
                  ))}
                </div>
              ) : persons.length === 0 ? (
                <div className="rounded-2xl border border-[#E6E1DA] bg-white p-10 text-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-medium text-[#1C1B1A]">Your journal is empty</h3>
                    <p className="text-sm text-[#6E6A63] max-w-md mx-auto font-sans">
                      Add the first person in your life to start recording receipts and keeping your thoughts grounded.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={handleSeedDemo}
                      disabled={isSeeding}
                      className="rounded-full border border-[#E6E1DA] bg-[#FBF9F5] px-5 py-2 text-xs font-medium text-[#6E6A63] hover:text-[#1C1B1A] transition"
                    >
                      {isSeeding ? 'Loading demo...' : 'Load Arjun demo'}
                    </button>
                    <button
                      onClick={() => setIsAddPersonOpen(true)}
                      className="rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-5 py-2 text-xs font-medium text-white transition shadow-sm"
                    >
                      + Add person
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {persons.map((p) => (
                    <PersonCard
                      key={p.person_id}
                      person={p}
                      isActive={p.person_id === activePersonId}
                      onSelect={(id) => {
                        setActivePersonId(id);
                        setActiveTab('overview');
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* PERSON PAGE VIEW (When a person is selected) */}
        {activePersonId && activePerson && personDetails && personDetails.person && (
          <div className="space-y-10 animate-fade-in">
            {/* Person Header */}
            <section className="space-y-4 border-b border-[#E6E1DA] pb-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1C1B1A] tracking-tight">
                      {personDetails.person.name}
                    </h1>
                    {personDetails.person.relationship_status && (
                      <span className="text-sm font-sans text-[#6E6A63] capitalize">
                        {personDetails.person.relationship_status}
                      </span>
                    )}
                  </div>
                  {personDetails.person.summary && (
                    <p className="text-sm text-[#6E6A63] font-serif italic mt-2 max-w-xl">
                      {personDetails.person.summary}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('add_receipt')}
                  className="self-start sm:self-auto rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-5 py-2 text-xs font-medium text-white transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log receipt
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-6 pt-4 text-sm font-sans border-t border-[#F2ECE4]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-1 transition ${
                    activeTab === 'overview'
                      ? 'text-[#1C1B1A] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#6E6A63] hover:text-[#1C1B1A]'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`pb-1 transition ${
                    activeTab === 'receipts'
                      ? 'text-[#1C1B1A] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#6E6A63] hover:text-[#1C1B1A]'
                  }`}
                >
                  Receipts ({personDetails.memories?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('reality_check')}
                  className={`pb-1 transition ${
                    activeTab === 'reality_check'
                      ? 'text-[#1C1B1A] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#6E6A63] hover:text-[#1C1B1A]'
                  }`}
                >
                  Reality Check
                </button>
              </div>
            </section>

            {/* TAB CONTENTS */}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-12">
                {/* Reality Check Teaser */}
                <section className="rounded-2xl border border-[#E6E1DA] bg-white p-7 sm:p-8 space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C85A32]">
                    Reality Check
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-[#1C1B1A]">
                    Something on your mind about {personDetails.person.name}?
                  </h3>
                  <p className="text-sm text-[#6E6A63] font-sans leading-relaxed">
                    Check your assumptions against the actual receipts recorded in your journal.
                  </p>
                  <button
                    onClick={() => setActiveTab('reality_check')}
                    className="rounded-full bg-[#1C1B1A] hover:bg-[#3E3B36] px-6 py-2.5 text-xs font-medium text-white transition inline-block"
                  >
                    Run Reality Check →
                  </button>
                </section>

                {/* Recent Receipts Summary */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-3">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
                      Recent Receipts
                    </h3>
                    <button
                      onClick={() => setActiveTab('receipts')}
                      className="text-xs font-medium text-[#C85A32] hover:underline"
                    >
                      View all receipts →
                    </button>
                  </div>

                  {(!personDetails.memories || personDetails.memories.length === 0) ? (
                    <div className="py-8 text-center">
                      <p className="font-serif italic text-sm text-[#A09B93]">
                        No receipts logged yet. Record a conversation snippet or date notes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {personDetails.memories.slice(0, 3).map((mem) => {
                        const formattedDate = new Date(mem.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                        });
                        return (
                          <article key={mem.memory_id} className="border-b border-[#F2ECE4] pb-6 space-y-1.5">
                            <div className="text-xs font-sans text-[#6E6A63] uppercase tracking-wider">
                              {formattedDate}
                            </div>
                            <p className="font-serif text-lg text-[#1C1B1A] leading-relaxed italic">
                              &ldquo;{mem.content}&rdquo;
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* RECEIPTS TAB */}
            {activeTab === 'receipts' && (
              <MemoryVaultSection
                key={activePersonId}
                personName={personDetails.person.name}
                memories={personDetails.memories || []}
                openThreads={personDetails.openThreads || []}
                events={personDetails.events || []}
              />
            )}

            {/* REALITY CHECK TAB */}
            {activeTab === 'reality_check' && (
              <RealityCheckSection
                key={activePersonId}
                personId={activePersonId}
                personName={personDetails.person.name}
              />
            )}

            {/* ADD RECEIPT TAB */}
            {activeTab === 'add_receipt' && (
              <AddReceiptSection
                key={activePersonId}
                personId={activePersonId}
                personName={personDetails.person.name}
                onInteractionIngested={async () => {
                  await loadActivePersonDetails();
                  await loadPersons(activePersonId);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onAddPerson={handleAddPerson}
      />
    </div>
  );
}
