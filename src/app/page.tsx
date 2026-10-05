'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { Header } from '@/components/Header';
import { PersonCard } from '@/components/PersonCard';
import { getAvatarForPerson } from '@/lib/avatars';
import { AddPersonModal } from '@/components/AddPersonModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { AwwwardsHero } from '@/components/AwwwardsHero';
import { EditorialStorySection } from '@/components/EditorialStorySection';
import { PersonChatView } from '@/components/PersonChatView';

import {
  getPersonsAction,
  createPersonAction,
  updatePersonSectionAction,
  deletePersonPermanentlyAction,
  getPersonDetailsAction,
  seedDemoPersonAction,
  PersonCardSummary,
  GetPersonDetailsResponse,
} from '@/app/actions/person.action';
import { Plus, ChevronDown, ChevronUp, Archive, Trash2 } from 'lucide-react';

export default function HomePage() {
  const [persons, setPersons] = useState<PersonCardSummary[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<GetPersonDetailsResponse | null>(null);
  const [isAppStarted, setIsAppStarted] = useState(false);

  const [activeTab, setActiveTab] = useState<'journal' | 'receipts' | 'reality_check' | 'add_receipt'>('journal');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section expand/collapse state
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [isDeletedExpanded, setIsDeletedExpanded] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPersonId, setDraggedPersonId] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'soft' | 'permanent';
    personId: string;
    personName: string;
  }>({
    isOpen: false,
    type: 'soft',
    personId: '',
    personName: '',
  });

  // Transition overlay & gallery container refs
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

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
        if (selectPersonId) {
          setIsAppStarted(true);
        }
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

  // Section updates
  const handleUpdateSection = async (personId: string, targetSection: 'active' | 'archived' | 'deleted') => {
    if (targetSection === 'deleted') {
      const person = persons.find((p) => p.person_id === personId);
      setConfirmModal({
        isOpen: true,
        type: 'soft',
        personId,
        personName: person?.name || 'this person',
      });
      return;
    }

    try {
      const res = await updatePersonSectionAction({ personId, section: targetSection });
      if (res.success) {
        await loadPersons();
      } else {
        setError(res.error || 'Failed to update section');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating section');
    }
  };

  const handleConfirmSoftDelete = async () => {
    const { personId } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const res = await updatePersonSectionAction({ personId, section: 'deleted' });
      if (res.success) {
        await loadPersons();
      } else {
        setError(res.error || 'Failed to move to deleted');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting person');
    }
  };

  const handleRequestPermanentDelete = (personId: string) => {
    const person = persons.find((p) => p.person_id === personId);
    setConfirmModal({
      isOpen: true,
      type: 'permanent',
      personId,
      personName: person?.name || 'this person',
    });
  };

  const handleConfirmPermanentDelete = async () => {
    const { personId } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const res = await deletePersonPermanentlyAction({ personId });
      if (res.success) {
        await loadPersons();
      } else {
        setError(res.error || 'Failed to delete person permanently');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting person');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, personId: string) => {
    setIsDragging(true);
    setDraggedPersonId(personId);
    e.dataTransfer.setData('text/plain', personId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedPersonId(null);
  };

  const handleDropOnSection = async (targetSection: 'active' | 'archived' | 'deleted') => {
    if (!draggedPersonId) return;
    const pId = draggedPersonId;
    setIsDragging(false);
    setDraggedPersonId(null);

    const person = persons.find((p) => p.person_id === pId);
    if (!person || person.section === targetSection) return;

    if (targetSection === 'deleted') {
      handleUpdateSection(pId, 'deleted');
    } else {
      await handleUpdateSection(pId, targetSection);
    }
  };

  // Add new person handler
  const handleAddPerson = async (data: { name: string; relationshipLabel?: string; summary?: string }) => {
    const res = await createPersonAction({
      name: data.name,
      relationshipLabel: data.relationshipLabel,
      summary: data.summary,
      section: 'active',
    });
    if (!res.success || !res.person) {
      throw new Error(res.error || 'Failed to create person');
    }
    await loadPersons(res.person.person_id);
    setActivePersonId(res.person.person_id);
    setIsAppStarted(true);
    setActiveTab('journal');
  };

  // Seed Arjun Demo handler
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
      setIsAppStarted(true);
      setActiveTab('journal');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const hasAnimatedDashboardRef = useRef(false);

  // GSAP Card Stagger Animation when Dashboard opens
  useEffect(() => {
    if (isAppStarted && !activePersonId && cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll('.person-card');
      if (cards.length === 0) return;

      if (hasAnimatedDashboardRef.current) {
        gsap.set(cards, { opacity: 1, y: 0, clearProps: 'opacity,transform' });
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        hasAnimatedDashboardRef.current = true;
        gsap.set(cards, { opacity: 1, y: 0, clearProps: 'opacity,transform' });
        return;
      }

      const ctx = gsap.context(() => {
        hasAnimatedDashboardRef.current = true;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.08,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(cards, { opacity: 1, y: 0, clearProps: 'opacity,transform' });
            },
          }
        );
      }, cardsContainerRef);

      return () => ctx.revert();
    }
  }, [isAppStarted, activePersonId, persons]);

  // Cleanup transition overlay
  useEffect(() => {
    return () => {
      setIsTransitioning(false);
      if (transitionOverlayRef.current) {
        gsap.killTweensOf(transitionOverlayRef.current);
        transitionOverlayRef.current.style.display = 'none';
      }
    };
  }, [activePersonId]);

  // Handler: Get Started transition
  const handleGetStarted = async () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsAppStarted(true);
      setIsTransitioning(false);
      if (persons.length === 0) {
        await handleSeedDemo();
      }
      return;
    }

    setIsTransitioning(true);
    
    const safetyTimer = setTimeout(() => {
      setIsAppStarted(true);
      setIsTransitioning(false);
      if (transitionOverlayRef.current) {
        transitionOverlayRef.current.style.display = 'none';
      }
    }, 850);

    if (transitionOverlayRef.current) {
      transitionOverlayRef.current.style.display = 'block';
      gsap.fromTo(
        transitionOverlayRef.current,
        { scale: 0, opacity: 1, display: 'block' },
        {
          scale: 2.8,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: async () => {
            clearTimeout(safetyTimer);
            setIsAppStarted(true);
            if (persons.length === 0) {
              await handleSeedDemo();
            }
            if (transitionOverlayRef.current) {
              gsap.to(transitionOverlayRef.current, {
                opacity: 0,
                duration: 0.35,
                onComplete: () => {
                  setIsTransitioning(false);
                  if (transitionOverlayRef.current) {
                    transitionOverlayRef.current.style.display = 'none';
                  }
                },
              });
            } else {
              setIsTransitioning(false);
            }
          },
        }
      );
    } else {
      clearTimeout(safetyTimer);
      setIsAppStarted(true);
      setIsTransitioning(false);
      if (persons.length === 0) {
        await handleSeedDemo();
      }
    }
  };

  const activePersons = persons.filter((p) => (p.section || 'active') === 'active');
  const archivedPersons = persons.filter((p) => p.section === 'archived');
  const deletedPersons = persons.filter((p) => p.section === 'deleted');

  const activePerson = persons.find((p) => p.person_id === activePersonId);

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#18181B] flex flex-col font-sans selection:bg-[#C85A32]/20 selection:text-[#18181B]">
      {/* Butter-Yellow Transition Overlay Circle */}
      {isTransitioning && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div
            ref={transitionOverlayRef}
            className="w-[120vw] h-[120vw] rounded-full bg-[#FEF8E0] shadow-2xl pointer-events-none"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}

      {/* Header */}
      <Header
        persons={persons}
        activePersonId={activePersonId}
        isAppStarted={isAppStarted || Boolean(activePersonId)}
        onSelectPerson={(id) => {
          setActivePersonId(id);
          if (id === null) {
            setIsAppStarted(true);
          }
          setActiveTab('journal');
        }}
        onGoToLanding={() => {
          setActivePersonId(null);
          setIsAppStarted(false);
        }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col items-center">
        {/* Error Banner */}
        {error && (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6">
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-sans text-rose-800 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="underline font-medium">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* 1. LANDING PAGE VIEW */}
        {!activePersonId && (
          <div className={`w-full ${isAppStarted ? 'hidden' : 'block'}`}>
            <AwwwardsHero onGetStarted={handleGetStarted} isSeeding={isSeeding} />
            <EditorialStorySection onGetStarted={handleGetStarted} isSeeding={isSeeding} />
          </div>
        )}

        {/* 2. PEOPLE DASHBOARD VIEW */}
        {isAppStarted && !activePersonId && (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            {/* Gallery Main Heading */}
            <div className="flex items-baseline gap-3 border-b border-[#18181B]/15 pb-4">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#18181B]">
                Your people
              </h1>
              <span className="font-sans text-xs italic text-[#78716C] tracking-wide">
                remember what matters
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-[16px] border-[1.5px] border-[#18181B]/30 bg-[#FFFFFF] animate-pulse" />
                ))}
              </div>
            ) : persons.length === 0 ? (
              /* Zero State */
              <div className="rounded-[24px] border-[1.5px] border-[#18181B] bg-[#FFFFFF] p-10 text-center space-y-6 shadow-[6px_6px_0px_#18181B] max-w-xl mx-auto my-8">
                <img
                  src="/illustrations/undraw_nice-to-meet-you_sqin.svg"
                  alt="Add someone"
                  className="w-40 h-40 mx-auto object-contain select-none"
                />
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-[#18181B]">
                    Add someone to start keeping receipts.
                  </h3>
                  <p className="text-xs text-[#78716C] font-sans max-w-md mx-auto">
                    Keep your memories grounded in facts, not assumptions.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-4">
                  <button
                    onClick={handleSeedDemo}
                    disabled={isSeeding}
                    className="rounded-full border border-[#18181B] bg-[#FEF8E0] px-6 py-2.5 text-xs font-sans font-medium text-[#18181B] hover:bg-[#FDE68A] transition cursor-pointer"
                  >
                    {isSeeding ? 'Loading demo...' : 'Load Arjun demo'}
                  </button>
                  <button
                    onClick={() => setIsAddPersonOpen(true)}
                    className="rounded-full border border-[#18181B] bg-[#18181B] hover:bg-[#C85A32] hover:border-[#C85A32] px-6 py-2.5 text-xs font-sans font-medium text-[#F8F6F1] transition shadow-xs cursor-pointer"
                  >
                    + Add person
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10" ref={cardsContainerRef}>
                {/* SECTION 1: Active Connections */}
                <section
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnSection('active')}
                  className={`space-y-4 rounded-2xl p-2 transition-colors ${
                    isDragging ? 'border-2 border-dashed border-[#C85A32]/50 bg-[#FEF8E0]/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-[#18181B] flex items-center gap-2">
                      <span>Active connections</span>
                      <span className="text-sm font-sans font-medium text-[#78716C] bg-[#E7E1D8] px-2.5 py-0.5 rounded-full border border-[#18181B]/10">
                        {activePersons.length}
                      </span>
                    </h2>
                  </div>

                  {/* 3 cards per row desktop, 2 tablet, 1 mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activePersons.map((p) => (
                      <PersonCard
                        key={p.person_id}
                        person={p}
                        isActive={p.person_id === activePersonId}
                        onSelect={(id) => {
                          setActivePersonId(id);
                          setActiveTab('journal');
                        }}
                        onUpdateSection={handleUpdateSection}
                        onDeletePermanently={handleRequestPermanentDelete}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}

                    {/* Smaller Dashed "Add person" Tile */}
                    <div
                      onClick={() => setIsAddPersonOpen(true)}
                      className="person-card group border-[2px] border-dashed border-[#18181B]/35 hover:border-[#18181B] bg-[#FAF8F5]/80 hover:bg-[#FFFFFF] rounded-[16px] p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_#18181B]"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FEF8E0] border border-[#18181B]/20 flex items-center justify-center text-[#C85A32] group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="font-sans font-bold text-xs text-[#18181B] mt-2.5 group-hover:text-[#C85A32]">
                        + Add person
                      </span>
                    </div>
                  </div>
                </section>


                {/* SECTION 2: Archived */}
                {(archivedPersons.length > 0 || isDragging) && (
                  <section
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnSection('archived')}
                    className={`rounded-[18px] border-[1.5px] border-[#18181B] bg-[#FFFFFF] p-4 transition-all shadow-[3px_3px_0px_#18181B] ${
                      isDragging ? 'border-2 border-dashed border-[#C85A32] bg-[#FEF8E0]' : ''
                    }`}
                  >
                    <div
                      onClick={() => setIsArchivedExpanded((prev) => !prev)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-[#78716C]" />
                        <h2 className="font-serif text-xl font-bold text-[#18181B]">Archived</h2>
                        <span className="text-xs font-sans font-medium text-[#78716C] bg-[#E7E1D8] px-2 py-0.5 rounded-full border border-[#18181B]/10">
                          {archivedPersons.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDragging && (
                          <span className="text-xs font-sans font-bold text-[#C85A32] animate-pulse">
                            Drop to archive
                          </span>
                        )}
                        <button className="p-1 text-[#78716C] hover:text-[#18181B]">
                          {isArchivedExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Drag drop zone prompt when dragging and section empty */}
                    {isDragging && archivedPersons.length === 0 && !isArchivedExpanded && (
                      <div className="mt-3 p-4 border-2 border-dashed border-[#C85A32] rounded-xl text-center text-xs font-sans font-bold text-[#C85A32] bg-[#FEF8E0]/60">
                        Drop to archive
                      </div>
                    )}

                    {/* Collapsed Compact Strip */}
                    {!isArchivedExpanded && archivedPersons.length > 0 && (
                      <div className="mt-3 flex items-center gap-2.5 flex-wrap pt-2 border-t border-[#18181B]/10">
                        {archivedPersons.map((p) => {
                          const { doodleSrc, avatarBg } = getAvatarForPerson(p);
                          return (
                            <div
                              key={p.person_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsArchivedExpanded(true);
                              }}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#18181B]/20 hover:border-[#18181B] hover:bg-[#FEF8E0] transition cursor-pointer text-xs font-sans font-medium text-[#18181B]"
                            >
                              <div className={`w-6 h-6 rounded-full ${avatarBg} border border-[#18181B]/20 p-0.5 overflow-hidden shrink-0`}>
                                <img src={doodleSrc} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <span>{p.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expanded Grid */}
                    {isArchivedExpanded && archivedPersons.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-3 border-t border-[#18181B]/10">
                        {archivedPersons.map((p) => (
                          <PersonCard
                            key={p.person_id}
                            person={p}
                            isActive={p.person_id === activePersonId}
                            onSelect={(id) => {
                              setActivePersonId(id);
                              setActiveTab('journal');
                            }}
                            onUpdateSection={handleUpdateSection}
                            onDeletePermanently={handleRequestPermanentDelete}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}


                {/* SECTION 3: Deleted */}
                {(deletedPersons.length > 0 || isDragging) && (
                  <section
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnSection('deleted')}
                    className={`rounded-[18px] border-[1.5px] border-[#18181B]/60 bg-[#FAF8F5] p-4 transition-all shadow-[3px_3px_0px_#18181B]/40 opacity-90 ${
                      isDragging ? 'border-2 border-dashed border-rose-600 bg-rose-50/50' : ''
                    }`}
                  >
                    <div
                      onClick={() => setIsDeletedExpanded((prev) => !prev)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-700" />
                        <h2 className="font-serif text-xl font-bold text-[#18181B]">Deleted</h2>
                        <span className="text-xs font-sans font-medium text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                          {deletedPersons.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDragging && (
                          <span className="text-xs font-sans font-bold text-rose-700 animate-pulse">
                            Drop to move to trash
                          </span>
                        )}
                        <button className="p-1 text-[#78716C] hover:text-[#18181B]">
                          {isDeletedExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Drag drop zone prompt when dragging and section empty */}
                    {isDragging && deletedPersons.length === 0 && !isDeletedExpanded && (
                      <div className="mt-3 p-4 border-2 border-dashed border-rose-500 rounded-xl text-center text-xs font-sans font-bold text-rose-700 bg-rose-50">
                        Drop to move to trash
                      </div>
                    )}

                    {/* Collapsed Compact Strip */}
                    {!isDeletedExpanded && deletedPersons.length > 0 && (
                      <div className="mt-3 flex items-center gap-2.5 flex-wrap pt-2 border-t border-[#18181B]/10">
                        {deletedPersons.map((p) => {
                          const { doodleSrc, avatarBg } = getAvatarForPerson(p);
                          return (
                            <div
                              key={p.person_id}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#18181B]/20 text-xs font-sans font-medium text-[#18181B]"
                            >
                              <div className={`w-6 h-6 rounded-full ${avatarBg} border border-[#18181B]/20 p-0.5 overflow-hidden shrink-0`}>
                                <img src={doodleSrc} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <span>{p.name}</span>
                              <div className="flex items-center gap-1.5 ml-1 border-l border-[#18181B]/15 pl-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateSection(p.person_id, 'active');
                                  }}
                                  className="text-[11px] text-[#C85A32] font-bold hover:underline"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestPermanentDelete(p.person_id);
                                  }}
                                  className="text-[11px] text-rose-700 font-bold hover:underline"
                                >
                                  Delete permanently
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expanded Grid */}
                    {isDeletedExpanded && deletedPersons.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-3 border-t border-[#18181B]/10">
                        {deletedPersons.map((p) => (
                          <PersonCard
                            key={p.person_id}
                            person={p}
                            isActive={p.person_id === activePersonId}
                            onSelect={(id) => {
                              setActivePersonId(id);
                              setActiveTab('journal');
                            }}
                            onUpdateSection={handleUpdateSection}
                            onDeletePermanently={handleRequestPermanentDelete}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* PERSON PAGE VIEW */}
        {activePersonId && activePerson && (
          <PersonChatView
            person={activePerson}
            initialMemories={personDetails?.memories || []}
            initialInteractions={personDetails?.interactions || []}
            initialRealityChecks={personDetails?.realityChecks || []}
            onBack={() => setActivePersonId(null)}
            onRefreshPersonDetails={() => loadPersons(activePersonId)}
          />
        )}
      </main>

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onAddPerson={handleAddPerson}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'soft' ? 'Move to Trash?' : `Delete ${confirmModal.personName} permanently?`}
        message={
          confirmModal.type === 'soft'
            ? `Are you sure you want to move ${confirmModal.personName} to Deleted? You can restore them anytime from the Deleted section.`
            : `Are you sure you want to permanently delete ${confirmModal.personName}? This will remove ${confirmModal.personName} AND all of their saved receipts, memories, and open threads. This action cannot be undone.`
        }
        confirmLabel={confirmModal.type === 'soft' ? 'Move to Trash' : 'Delete permanently'}
        confirmVariant={confirmModal.type === 'soft' ? 'warning' : 'danger'}
        onConfirm={confirmModal.type === 'soft' ? handleConfirmSoftDelete : handleConfirmPermanentDelete}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


