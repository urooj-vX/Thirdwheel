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
import { Plus, Sparkles, BookOpen, Search, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [persons, setPersons] = useState<PersonCardSummary[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<GetPersonDetailsResponse | null>(null);

  const [activeTab, setActiveTab] = useState<'journal' | 'receipts' | 'reality_check' | 'add_receipt'>('journal');
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
    setActiveTab('journal');
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
      setActiveTab('journal');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const activePerson = persons.find((p) => p.person_id === activePersonId);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans selection:bg-[#C85A32]/20 selection:text-[#1C1917]">
      {/* Header */}
      <Header
        persons={persons}
        activePersonId={activePersonId}
        onSelectPerson={(id) => {
          setActivePersonId(id);
          setActiveTab('journal');
        }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-8 py-10 sm:py-16 space-y-16">
        {/* Error Banner */}
        {error && (
          <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-mono text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline font-medium uppercase tracking-wider">
              Dismiss
            </button>
          </div>
        )}

        {/* HOMEPAGE VIEW (When no person is selected) */}
        {!activePersonId && (
          <div className="space-y-20 animate-fade-in">
            {/* EDITORIAL HERO (Sketched Composition: Boy Doodle + THIRD WHEEL + Girl Doodle) */}
            <section className="relative pt-6 pb-12 border-b border-[#E7E1D8] space-y-10">
              {/* Flanking Doodles & Central Wordmark */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center">
                {/* Left Doodle (Boy) */}
                <div className="hidden md:block w-36 h-36 shrink-0 transition-transform hover:scale-105 duration-300">
                  <img 
                    src="/illustrations/boy-doodle.svg" 
                    alt="Boy doodle looking at wordmark" 
                    className="w-full h-full object-contain opacity-90"
                  />
                </div>

                {/* Central Brand Headline */}
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="inline-block">
                    <span className="text-[11px] font-mono tracking-widest text-[#C85A32] uppercase bg-[#FBF0EC] px-3.5 py-1 rounded-sm border border-[#C85A32]/30">
                      PRIVATE MEMORY JOURNAL // NO ALGORITHMIC VIBES
                    </span>
                  </div>
                  <h1 className="font-serif text-5xl sm:text-7xl font-normal tracking-tight text-[#1C1917] leading-[1.05]">
                    THIRD WHEEL
                  </h1>
                  <p className="font-serif italic text-2xl sm:text-3xl text-[#78716C]">
                    &ldquo;Receipts, not vibes.&rdquo;
                  </p>
                  <p className="font-serif text-xl sm:text-2xl text-[#1C1917] leading-relaxed pt-2">
                    Remember what happened.<br />
                    <span className="italic text-[#78716C] font-normal">Not what you think happened.</span>
                  </p>
                  <p className="text-sm text-[#57534E] font-sans leading-relaxed max-w-xl mx-auto pt-1">
                    Third Wheel is your private AI relationship companion. It maintains an unvarnished, isolated memory ledger for each person in your life—separating recorded facts from unproven assumptions.
                  </p>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={handleSeedDemo}
                      disabled={isSeeding}
                      className="rounded-full bg-[#1C1917] hover:bg-[#332F2B] px-6 py-3 text-xs font-mono uppercase tracking-wider text-[#FAF8F5] transition shadow-xs inline-flex items-center gap-2"
                    >
                      <span>{isSeeding ? 'Loading demo...' : 'Explore Arjun Demo'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#C85A32]" />
                    </button>
                    <button
                      onClick={() => setIsAddPersonOpen(true)}
                      className="rounded-full border border-[#E7E1D8] bg-[#FFFFFF] hover:bg-[#F4EFEA] px-6 py-3 text-xs font-mono uppercase tracking-wider text-[#1C1917] transition"
                    >
                      + Add Person
                    </button>
                  </div>
                </div>

                {/* Right Doodle (Girl) */}
                <div className="hidden md:block w-36 h-36 shrink-0 transition-transform hover:scale-105 duration-300">
                  <img 
                    src="/illustrations/girl-doodle.svg" 
                    alt="Girl doodle leaning on letter" 
                    className="w-full h-full object-contain opacity-90"
                  />
                </div>
              </div>

              {/* Three Core Archival Principles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-[#E7E1D8]/60 text-left">
                <div className="space-y-1.5 p-4 rounded-md bg-[#FFFFFF] border border-[#E7E1D8]">
                  <span className="text-[11px] font-mono text-[#C85A32] uppercase tracking-widest block">01 / LITERAL RECEIPTS</span>
                  <h4 className="font-serif text-lg font-medium text-[#1C1917]">Recorded Conversations</h4>
                  <p className="text-xs text-[#78716C] leading-relaxed">Verbatim quotes and facts, completely isolated per person.</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-md bg-[#FFFFFF] border border-[#E7E1D8]">
                  <span className="text-[11px] font-mono text-[#C85A32] uppercase tracking-widest block">02 / PROVENANCE ANCHORS</span>
                  <h4 className="font-serif text-lg font-medium text-[#1C1917]">Traceable Claims</h4>
                  <p className="text-xs text-[#78716C] leading-relaxed">Every fact links back to its original raw interaction transcript.</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-md bg-[#FFFFFF] border border-[#E7E1D8]">
                  <span className="text-[11px] font-mono text-[#C85A32] uppercase tracking-widest block">03 / ANTI-METRICS</span>
                  <h4 className="font-serif text-lg font-medium text-[#1C1917]">Zero Dating Scores</h4>
                  <p className="text-xs text-[#78716C] leading-relaxed">No compatibility percentages, no match meters, zero gamification.</p>
                </div>
              </div>
            </section>

            {/* YOUR PEOPLE SECTION */}
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#E7E1D8] pb-4">
                <div>
                  <span className="text-[11px] font-mono tracking-widest text-[#C85A32] uppercase">ARCHIVE SECTION // DOSSIERS</span>
                  <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1917] mt-0.5">
                    Your People
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddPersonOpen(true)}
                  className="text-xs font-mono tracking-wider uppercase text-[#C85A32] hover:underline"
                >
                  + Add person
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 rounded-lg border border-[#E7E1D8] bg-[#FFFFFF] animate-pulse" />
                  ))}
                </div>
              ) : persons.length === 0 ? (
                <div className="rounded-lg border border-[#E7E1D8] bg-[#FFFFFF] p-12 text-center space-y-6">
                  <img src="/illustrations/empty-waiting.svg" alt="Empty ledger" className="w-20 h-20 mx-auto opacity-75" />
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="font-serif text-2xl font-medium text-[#1C1917]">Your ledger is empty</h3>
                    <p className="text-sm text-[#78716C] font-sans">
                      Add the first person in your life to start recording receipts and keeping your memory grounded.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-4">
                    <button
                      onClick={handleSeedDemo}
                      disabled={isSeeding}
                      className="rounded-md border border-[#E7E1D8] bg-[#FAF8F5] px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-[#78716C] hover:text-[#1C1917] transition"
                    >
                      {isSeeding ? 'Loading demo...' : 'Load Arjun demo'}
                    </button>
                    <button
                      onClick={() => setIsAddPersonOpen(true)}
                      className="rounded-md bg-[#1C1917] hover:bg-[#332F2B] px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-[#FAF8F5] transition shadow-xs"
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
                        setActiveTab('journal');
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* PERSON PAGE VIEW (Conversational Journal when a person is selected) */}
        {activePersonId && activePerson && personDetails && personDetails.person && (
          <div className="space-y-10 animate-fade-in">
            {/* Person Header Banner */}
            <section className="space-y-6 border-b border-[#E7E1D8] pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border border-[#E7E1D8] flex items-center justify-center p-2 shrink-0">
                    <img 
                      src={
                        personDetails.person.name.toLowerCase().includes('arjun')
                          ? '/illustrations/coffee-doodle.svg'
                          : personDetails.person.name.toLowerCase().includes('rahul')
                          ? '/illustrations/tennis-doodle.svg'
                          : '/illustrations/third-wheel-mascot.svg'
                      } 
                      alt={personDetails.person.name} 
                      className="w-full h-full object-contain opacity-85" 
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#1C1917] tracking-tight">
                        {personDetails.person.name}
                      </h1>
                      {personDetails.person.relationship_status && (
                        <span className="text-xs font-mono tracking-widest text-[#C85A32] uppercase px-2.5 py-0.5 rounded-sm bg-[#FBF0EC] border border-[#C85A32]/30">
                          {personDetails.person.relationship_status}
                        </span>
                      )}
                    </div>
                    {personDetails.person.summary && (
                      <p className="text-sm text-[#78716C] font-serif italic mt-1 max-w-xl">
                        &ldquo;{personDetails.person.summary}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab('add_receipt')}
                    className="rounded-md bg-[#1C1917] hover:bg-[#332F2B] px-5 py-2 text-xs font-mono uppercase tracking-wider text-[#FAF8F5] transition shadow-xs inline-flex items-center gap-2"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#C85A32]" />
                    <span>Log receipt</span>
                  </button>
                </div>
              </div>

              {/* Conversational Journal Navigation Bar */}
              <div className="flex items-center gap-8 pt-4 text-xs font-mono tracking-wider border-t border-[#E7E1D8]/60 uppercase">
                <button
                  onClick={() => setActiveTab('journal')}
                  className={`pb-2 transition inline-flex items-center gap-2 ${
                    activeTab === 'journal'
                      ? 'text-[#C85A32] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Conversational Journal</span>
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`pb-2 transition inline-flex items-center gap-2 ${
                    activeTab === 'receipts'
                      ? 'text-[#C85A32] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <span>Receipts ({personDetails.memories?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('reality_check')}
                  className={`pb-2 transition inline-flex items-center gap-2 ${
                    activeTab === 'reality_check'
                      ? 'text-[#C85A32] font-semibold border-b-2 border-[#C85A32]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Reality Check</span>
                </button>
              </div>
            </section>

            {/* TAB CONTENTS */}

            {/* CONVERSATIONAL JOURNAL STREAM (Core Page Feature) */}
            {activeTab === 'journal' && (
              <div className="space-y-10">
                {/* Journal Inquiry Banner */}
                <section className="rounded-lg border border-[#E7E1D8] bg-[#FFFFFF] p-7 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-widest text-[#C85A32] uppercase">
                      MEMORY SPACE // {personDetails.person.name.toUpperCase()}
                    </span>
                    <img src="/illustrations/third-wheel-mascot.svg" alt="Mascot" className="w-8 h-8 opacity-80" />
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#1C1917]">
                    Ask your memory: &ldquo;What did {personDetails.person.name} say?&rdquo;
                  </h3>
                  <p className="text-sm text-[#78716C] font-sans leading-relaxed">
                    Check what happened without emotional guesswork. Third Wheel compares your inquiry against all recorded receipt transcripts.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('reality_check')}
                      className="rounded-md bg-[#C85A32] hover:bg-[#A23E18] px-6 py-2.5 text-xs font-mono uppercase tracking-wider text-white transition inline-flex items-center gap-2"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Run Reality Check →</span>
                    </button>
                  </div>
                </section>

                {/* Timeline Journal Stream */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between border-b border-[#E7E1D8] pb-3">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                      Journal Entry Stream & Provenance
                    </h3>
                    <button
                      onClick={() => setActiveTab('receipts')}
                      className="text-xs font-mono text-[#C85A32] hover:underline uppercase"
                    >
                      View all receipts &rarr;
                    </button>
                  </div>

                  {(!personDetails.memories || personDetails.memories.length === 0) ? (
                    <div className="py-12 text-center rounded-lg border border-[#E7E1D8] bg-[#FFFFFF]">
                      <img src="/illustrations/remembering.svg" alt="No entries" className="w-14 h-14 mx-auto opacity-70 mb-3" />
                      <p className="font-serif italic text-base text-[#78716C]">
                        No receipts logged yet for {personDetails.person.name}.
                      </p>
                      <button
                        onClick={() => setActiveTab('add_receipt')}
                        className="mt-4 text-xs font-mono text-[#C85A32] hover:underline uppercase"
                      >
                        + Log first receipt
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-[#E7E1D8]">
                      {personDetails.memories.map((mem, index) => {
                        const formattedDate = new Date(mem.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <article key={mem.memory_id} className="relative pl-10 space-y-2">
                            {/* Dot on timeline */}
                            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-[#C85A32] border-2 border-[#FAF8F5]" />

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono text-[#78716C] uppercase tracking-wider">
                                {formattedDate}
                              </span>
                              <span className="text-[10px] font-mono text-[#C85A32] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#FBF0EC] border border-[#C85A32]/20">
                                {mem.memory_type || 'FACT'}
                              </span>
                            </div>

                            <div className="rounded-lg border border-[#E7E1D8] bg-[#FFFFFF] p-6 space-y-2">
                              <p className="font-serif text-xl text-[#1C1917] leading-relaxed italic">
                                &ldquo;{mem.content}&rdquo;
                              </p>
                              <div className="text-[11px] font-mono text-[#A8A29E] pt-2 border-t border-[#E7E1D8]/60 flex items-center justify-between">
                                <span>Anchor: interaction #{mem.source_interaction_id.slice(-6)}</span>
                                <button
                                  onClick={() => setActiveTab('receipts')}
                                  className="text-[#C85A32] hover:underline uppercase"
                                >
                                  View provenance &rarr;
                                </button>
                              </div>
                            </div>
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
                  setActiveTab('journal');
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

