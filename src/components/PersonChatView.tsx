'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Send, Plus, History, X, AlertTriangle, Quote, Sparkles, RefreshCw } from 'lucide-react';
import { PersonDocument, MemoryDocument, InteractionDocument, RealityCheckDocument } from '@/types';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import { runRealityCheckAction } from '@/app/actions/reality-check.action';
import { getPersonDetailsAction, PersonCardSummary } from '@/app/actions/person.action';
import { getAvatarForPerson } from '@/lib/avatars';
import { RealityCheckResult } from '@/lib/validation/schemas';
import { isQuestion } from '@/lib/ai/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  receipts?: {
    memory_id: string;
    text: string;
    date?: string;
    isContradiction?: boolean;
    category?: 'fact' | 'assumption' | 'uncertainty';
  }[];
  realityCheckResult?: RealityCheckResult;
  isError?: boolean;
}

interface PersonChatViewProps {
  person: PersonCardSummary | PersonDocument;
  initialMemories?: MemoryDocument[];
  initialInteractions?: InteractionDocument[];
  initialRealityChecks?: RealityCheckDocument[];
  onBack: () => void;
  onRefreshPersonDetails?: () => void;
}

export function PersonChatView({
  person,
  initialMemories = [],
  initialInteractions = [],
  initialRealityChecks = [],
  onBack,
  onRefreshPersonDetails,
}: PersonChatViewProps) {
  const [interactions, setInteractions] = useState<InteractionDocument[]>(initialInteractions);
  const [memories, setMemories] = useState<MemoryDocument[]>(initialMemories);
  const [realityChecks, setRealityChecks] = useState<RealityCheckDocument[]>(initialRealityChecks);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realityCheckError, setRealityCheckError] = useState<string | null>(null);
  const [isRetryingCheck, setIsRetryingCheck] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [statusStepMessage, setStatusStepMessage] = useState<string>('Looking at the receipts...');
  const [expandedEvidence, setExpandedEvidence] = useState<{ [msgId: string]: boolean }>({});

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Sync state if initial props change
  useEffect(() => {
    if (initialInteractions && initialInteractions.length > 0) {
      setInteractions(initialInteractions);
    }
    if (initialMemories && initialMemories.length > 0) {
      setMemories(initialMemories);
    }
    if (initialRealityChecks && initialRealityChecks.length > 0) {
      setRealityChecks(initialRealityChecks);
    }
  }, [initialInteractions, initialMemories, initialRealityChecks]);

  // Determine pronoun for placeholder
  const rawStatus = (person.relationship_label || person.relationship_status || '').toLowerCase();
  let pronoun = 'they';
  if (rawStatus.includes('he') || rawStatus.includes('boy')) pronoun = 'he';
  else if (rawStatus.includes('she') || rawStatus.includes('girl')) pronoun = 'she';

  // Determine doodle avatar and pill text
  const { doodleSrc } = getAvatarForPerson(person);
  const statusText =
    person.relationship_label?.trim() ||
    (person.relationship_status
      ? person.relationship_status.charAt(0).toUpperCase() + person.relationship_status.slice(1)
      : 'Active');
  let pillStyle = 'bg-[#FEF8E0] text-[#18181B] border border-[#18181B]/20';

  if (rawStatus.includes('ex') || rawStatus.includes('archive')) {
    pillStyle = 'bg-[#FCE7F3] text-[#18181B] border border-[#18181B]/20';
  } else if (rawStatus.includes('pause') || rawStatus.includes('hold') || rawStatus.includes('break')) {
    pillStyle = 'bg-[#E7E5E4] text-[#18181B] border border-[#18181B]/20';
  }

  // Load fresh details for person (interactions, memories, and reality checks)
  const reloadDetails = useCallback(async () => {
    try {
      const res = await getPersonDetailsAction({ personId: person.person_id });
      if (res.success) {
        if (res.interactions) setInteractions(res.interactions);
        if (res.memories) setMemories(res.memories);
        if (res.realityChecks) setRealityChecks(res.realityChecks);
      }
    } catch {
      // Keep local state
    }
  }, [person.person_id]);

  useEffect(() => {
    reloadDetails();
  }, [reloadDetails]);

  // Construct & Restore Chat Messages when an interaction is selected from history (NO AI CALL ON REOPEN)
  useEffect(() => {
    if (!activeInteractionId) {
      setMessages([]);
      return;
    }

    const currentInteraction = interactions.find((i) => i.interaction_id === activeInteractionId);
    if (!currentInteraction) return;

    // Related memories for this interaction
    const relatedMemories = memories.filter(
      (m) => m.source_interaction_id === currentInteraction.interaction_id
    );

    // Look up persisted Reality Check document associated with this interaction or query
    const relatedRealityCheck = realityChecks.find(
      (r) => r.interaction_id === currentInteraction.interaction_id || r.query === currentInteraction.raw_content
    );

    const userMsg: ChatMessage = {
      id: `user-${currentInteraction.interaction_id}`,
      sender: 'user',
      content: currentInteraction.raw_content,
      timestamp: new Date(currentInteraction.timestamp),
    };

    const receipts = relatedMemories.map((m) => ({
      memory_id: m.memory_id,
      text: m.content,
      date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isContradiction: m.category === 'assumption' || m.category === 'uncertainty',
      category: m.category,
    }));

    const assistantContent =
      relatedMemories.length > 0
        ? `Got it. I'm keeping ${
            relatedMemories.length === 1 ? 'this' : `these ${relatedMemories.length} things`
          } in mind for ${person.name}:`
        : `Got it. I'll remember that for ${person.name}.`;

    const assistantMsg: ChatMessage = {
      id: `assistant-${currentInteraction.interaction_id}`,
      sender: 'assistant',
      content: assistantContent,
      timestamp: new Date(currentInteraction.timestamp),
      receipts,
    };

    const restoredMessages: ChatMessage[] = [userMsg, assistantMsg];

    // Restore persisted Reality Check if one exists for this interaction
    if (relatedRealityCheck) {
      const reconstructedResult: RealityCheckResult = {
        conclusion: relatedRealityCheck.conclusion,
        known_facts: relatedRealityCheck.known_facts || [],
        assumptions: relatedRealityCheck.assumptions || [],
        unknowns: relatedRealityCheck.unknowns || [],
        evidence_strength: (relatedRealityCheck.evidence_strength as any) || 'moderate',
        closing_quote: relatedRealityCheck.closing_quote,
      };

      const realityMsg: ChatMessage = {
        id: `reality-${relatedRealityCheck.reality_check_id}`,
        sender: 'assistant',
        content: relatedRealityCheck.conclusion,
        timestamp: new Date(relatedRealityCheck.created_at),
        realityCheckResult: reconstructedResult,
      };

      restoredMessages.push(realityMsg);
    }

    setMessages(restoredMessages);
  }, [activeInteractionId, interactions, memories, realityChecks, person.name]);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0 || realityCheckError) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, realityCheckError]);

  // GSAP Message Stagger animation
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        const ctx = gsap.context(() => {
          const chatBubbles = messagesContainerRef.current?.querySelectorAll('.chat-bubble');
          if (chatBubbles && chatBubbles.length > 0) {
            gsap.from(chatBubbles, {
              opacity: 0,
              y: 16,
              duration: 0.4,
              stagger: 0.08,
              ease: 'power2.out',
            });
          }
        }, messagesContainerRef);

        return () => ctx.revert();
      }
    }
  }, [messages]);

  // Handle Send / Submission with immediate saved receipt display and persisted reality check
  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() || isLoading) return;

    const trimmedContent = content.trim();
    setLastQuery(trimmedContent);
    setError(null);
    setRealityCheckError(null);
    setIsLoading(true);
    setStatusStepMessage('Checking what we know...');

    // 15s Timeout status message update
    const slowTimer = setTimeout(() => {
      setStatusStepMessage('Still working, your receipts are safe.');
    }, 15000);

    // Optimistically add user message
    const tempUserId = `user-temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserId,
      sender: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    let currentMemories = memories;
    let createdInteractionId: string | undefined;

    try {
      // STEP 1: Ingestion / Extraction FIRST
      const ingestRes = await ingestInteractionAction({
        personId: person.person_id,
        sourceType: 'pasted_text',
        rawContent: trimmedContent,
      });

      if (!ingestRes.success) {
        throw new Error(ingestRes.error || 'Failed to save receipt');
      }

      createdInteractionId = ingestRes.interaction_id;

      // Extraction succeeded! Reload details & set active interaction
      const detailsRes = await getPersonDetailsAction({ personId: person.person_id });
      if (detailsRes.success) {
        if (detailsRes.interactions) setInteractions(detailsRes.interactions);
        if (detailsRes.memories) {
          setMemories(detailsRes.memories);
          currentMemories = detailsRes.memories;
        }
        if (detailsRes.realityChecks) setRealityChecks(detailsRes.realityChecks);
      }
      onRefreshPersonDetails?.();
      setActiveInteractionId(ingestRes.interaction_id);

      // STEP 2: Evaluate if Reality Check should run
      const isQ = isQuestion(trimmedContent);
      const factCount = currentMemories.filter((m) => m.category === 'fact').length;
      const shouldRunCheck = isQ || factCount > 0;

      if (!shouldRunCheck) {
        console.log(`[TIMING] [PersonChatView] Skipping Reality Check for plain statement with no existing facts.`);
        setIsLoading(false);
        clearTimeout(slowTimer);
        return;
      }

      // STEP 3: Run Reality Check and persist it associated with interactionId
      setStatusStepMessage('Looking through receipts...');
      const realityRes = await runRealityCheckAction({
        personId: person.person_id,
        query: trimmedContent,
        newMessageContent: trimmedContent,
        interactionId: createdInteractionId,
      });

      if (realityRes.success && realityRes.result) {
        const checkMsg: ChatMessage = {
          id: `reality-${Date.now()}`,
          sender: 'assistant',
          content: realityRes.result.conclusion,
          timestamp: new Date(),
          realityCheckResult: realityRes.result,
        };
        setMessages((prev) => [...prev, checkMsg]);

        // Reload details to sync persisted reality check document
        await reloadDetails();
      } else {
        // Reality Check failed: show error message below saved receipts
        setRealityCheckError(realityRes.error || "Couldn't get an answer right now. Your receipts are safe.");
      }
    } catch (err: unknown) {
      console.error('[PersonChatView Error]', err);
      setError(err instanceof Error ? err.message : "Couldn't get an answer right now. Your receipts are safe.");
    } finally {
      clearTimeout(slowTimer);
      setIsLoading(false);
    }
  };

  // Re-run ONLY the Reality Check for the current interaction
  const handleRetryRealityCheckOnly = async () => {
    if (!lastQuery || isRetryingCheck) return;

    setIsRetryingCheck(true);
    setRealityCheckError(null);

    try {
      const realityRes = await runRealityCheckAction({
        personId: person.person_id,
        query: lastQuery,
        newMessageContent: lastQuery,
        interactionId: activeInteractionId || undefined,
      });

      if (realityRes.success && realityRes.result) {
        const checkMsg: ChatMessage = {
          id: `reality-${Date.now()}`,
          sender: 'assistant',
          content: realityRes.result.conclusion,
          timestamp: new Date(),
          realityCheckResult: realityRes.result,
        };
        setMessages((prev) => [...prev, checkMsg]);
        await reloadDetails();
      } else {
        setRealityCheckError(realityRes.error || "Couldn't get an answer right now. Your receipts are safe.");
      }
    } catch (err: unknown) {
      setRealityCheckError(err instanceof Error ? err.message : "Couldn't get an answer right now. Your receipts are safe.");
    } finally {
      setIsRetryingCheck(false);
    }
  };

  // Keyboard Enter handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Select chip example
  const handleSelectExample = (exampleText: string) => {
    setInputText(exampleText);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex h-[calc(100vh-5rem)] bg-[#F8F6F1] text-[#18181B] rounded-[24px] border-[1.5px] border-[#18181B] shadow-[6px_6px_0px_#18181B] overflow-hidden my-4">
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-[#18181B]/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR (~290px) - Desktop visible, Mobile Drawer */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[290px] bg-[#FAF8F5] border-r-[1.5px] border-[#18181B] p-5 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
          {/* Mobile Close Button & Header Link */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-bold text-[#18181B] hover:text-[#C85A32] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to your people</span>
            </button>

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden p-1 rounded-full text-[#18181B] hover:bg-[#E7E1D8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              setActiveInteractionId(null);
              setMessages([]);
              setError(null);
              setRealityCheckError(null);
              setIsMobileDrawerOpen(false);
              setTimeout(() => {
                textareaRef.current?.focus();
              }, 50);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-[#18181B] bg-[#18181B] hover:bg-[#C85A32] hover:border-[#C85A32] py-2.5 px-4 text-xs font-sans font-medium uppercase tracking-wider text-[#F8F6F1] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FEF8E0]" />
            <span>New chat</span>
          </button>

          {/* Previous Chats / Entries List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#78716C] px-1">
              CONVERSATIONS ({interactions.length})
            </div>

            {interactions.length === 0 ? (
              <p className="text-xs font-serif italic text-[#78716C] px-1 py-3">
                No previous entries yet.
              </p>
            ) : (
              interactions.map((item) => {
                const isActive = item.interaction_id === activeInteractionId;
                const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={item.interaction_id}
                    onClick={() => {
                      setActiveInteractionId(item.interaction_id);
                      setRealityCheckError(null);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-[#FEF8E0] border-[#18181B] shadow-[2px_2px_0px_#18181B]'
                        : 'bg-[#FFFFFF] border-[#18181B]/20 hover:border-[#18181B] hover:bg-[#FEF8E0]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-sans font-bold text-[#18181B]">
                      <span>{dateStr}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#C85A32]" />}
                    </div>
                    <p className="text-xs font-sans text-[#78716C] line-clamp-1 mt-1 leading-snug">
                      {item.raw_content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Person Info */}
        <div className="pt-4 border-t border-[#18181B]/15 text-xs font-sans text-[#78716C]">
          <span>Remembering <strong className="text-[#18181B]">{person.name}</strong></span>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONVERSATION AREA */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col bg-[#F8F6F1] h-full min-w-0 overflow-hidden relative z-10">
        {/* Main Header */}
        <header className="h-16 border-b-[1.5px] border-[#18181B] bg-[#FAF8F5] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-1 text-xs font-sans font-bold border border-[#18181B] bg-[#FEF8E0] px-3 py-1.5 rounded-full cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            {/* Avatar & Person Name */}
            <div className="w-10 h-10 rounded-full bg-[#FEF8E0] border border-[#18181B]/20 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <img src={doodleSrc} alt={person.name} className="w-full h-full object-contain" />
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-[#18181B] leading-tight">
                {person.name}
              </h2>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-sans font-medium ${pillStyle}`}>
            {statusText}
          </span>
        </header>

        {/* Messages / Canvas View */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0"
        >
          {messages.length === 0 && !isLoading ? (
            /* Empty State for New Chat */
            <div className="my-auto flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 py-8">
              <img
                src="/illustrations/undraw_love-messages_9oca.svg"
                alt="Love messages"
                className="w-52 h-52 object-contain select-none"
              />
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#18181B]">
                  Tell me what happened. I&apos;ll keep the receipt.
                </h3>
                <p className="text-xs font-sans text-[#78716C]">
                  Tell me what you remember, and I&apos;ll help keep track of what actually happened.
                </p>
              </div>

              {/* Example Chips */}
              <div className="space-y-2.5 w-full pt-2">
                <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#78716C]">
                  Try an example:
                </p>
                <div
                  onClick={() =>
                    handleSelectExample(
                      `What did ${person.name} tell me about Sunday?`
                    )
                  }
                  className="p-3 rounded-xl border border-[#18181B]/20 bg-[#FFFFFF] hover:border-[#18181B] hover:bg-[#FEF8E0] text-xs font-serif text-[#18181B] text-left cursor-pointer transition shadow-xs"
                >
                  &ldquo;What did {person.name} tell me about Sunday?&rdquo;
                </div>

                <div
                  onClick={() =>
                    handleSelectExample(
                      `Did I promise ${person.name} anything?`
                    )
                  }
                  className="p-3 rounded-xl border border-[#18181B]/20 bg-[#FFFFFF] hover:border-[#18181B] hover:bg-[#FEF8E0] text-xs font-serif text-[#18181B] text-left cursor-pointer transition shadow-xs"
                >
                  &ldquo;Did I promise {person.name} anything?&rdquo;
                </div>

                <div
                  onClick={() =>
                    handleSelectExample(
                      `When did ${person.name} mention the documents?`
                    )
                  }
                  className="p-3 rounded-xl border border-[#18181B]/20 bg-[#FFFFFF] hover:border-[#18181B] hover:bg-[#FEF8E0] text-xs font-serif text-[#18181B] text-left cursor-pointer transition shadow-xs"
                >
                  &ldquo;When did {person.name} mention the documents?&rdquo;
                </div>
              </div>
            </div>
          ) : (
            /* Render Conversation Bubbles */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#FEF8E0] border border-[#18181B]/30 flex items-center justify-center p-1.5 shrink-0 mt-1">
                    <img src="/illustrations/undraw_chat-text.svg" alt="Third Wheel" className="w-full h-full object-contain" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-5 rounded-[18px] border-[1.5px] border-[#18181B] shadow-[3.5px_3.5px_0px_#18181B] space-y-3.5 ${
                    msg.sender === 'user'
                      ? 'bg-[#FFFFFF] text-[#18181B]'
                      : 'bg-[#FEF8E0] text-[#18181B]'
                  }`}
                >
                  {/* Primary: Main Conversational Content */}
                  <p className="font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal text-[#18181B]">
                    {msg.content}
                  </p>

                  {/* Closing Quote / Next Step if present */}
                  {msg.realityCheckResult?.closing_quote && (
                    <div className="pt-2 border-t border-[#18181B]/15 text-xs font-sans text-[#57534E]">
                      <span className="font-bold text-[#C85A32] block mb-0.5">What I&apos;d do next:</span>
                      <p className="font-serif italic text-sm text-[#18181B]">
                        &ldquo;{msg.realityCheckResult.closing_quote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Reality Check Evidence Chips & Expandable Details */}
                  {msg.realityCheckResult && (
                    <div className="pt-2 border-t border-[#18181B]/15">
                      {(() => {
                        const factCount = msg.realityCheckResult.known_facts.length;
                        const unknownCount =
                          msg.realityCheckResult.assumptions.length + msg.realityCheckResult.unknowns.length;
                        const isExpanded = !!expandedEvidence[msg.id];

                        return (
                          <div className="space-y-2.5">
                            {/* Secondary Evidence Chips */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => toggleEvidence(msg.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#18181B]/20 bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-xs font-sans font-medium text-[#18181B] transition cursor-pointer shadow-2xs"
                              >
                                <span>{factCount} receipt{factCount === 1 ? '' : 's'}</span>
                                <span className="text-[10px] text-[#78716C]">{isExpanded ? '▲ Hide' : '▼ Show'}</span>
                              </button>

                              {unknownCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleEvidence(msg.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#18181B]/20 bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-xs font-sans font-medium text-[#78716C] transition cursor-pointer shadow-2xs"
                                >
                                  <span>{unknownCount} unknown{unknownCount === 1 ? '' : 's'}</span>
                                </button>
                              )}
                            </div>

                            {/* Tertiary Expandable Grounded Evidence */}
                            {isExpanded && (
                              <div className="p-4 rounded-xl bg-[#FFFFFF]/95 border border-[#18181B]/20 text-xs font-sans space-y-3 shadow-xs animate-fade-in">
                                {factCount > 0 ? (
                                  <div className="space-y-1.5">
                                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#C85A32]">
                                      What I know
                                    </span>
                                    <ul className="space-y-1 text-[#18181B]">
                                      {msg.realityCheckResult.known_facts.map((f, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                          <span className="text-[#C85A32]">•</span>
                                          <span>{f}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs font-serif italic text-[#78716C]">
                                    No direct receipts recorded yet for this point.
                                  </p>
                                )}

                                {unknownCount > 0 && (
                                  <div className="space-y-1.5 pt-2 border-t border-[#18181B]/10">
                                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#78716C]">
                                      What I&apos;m not sure about
                                    </span>
                                    <ul className="space-y-1 text-[#78716C]">
                                      {msg.realityCheckResult.assumptions.map((a, idx) => (
                                        <li key={`ass-${idx}`} className="flex items-start gap-1.5">
                                          <span>•</span>
                                          <span>{a}</span>
                                        </li>
                                      ))}
                                      {msg.realityCheckResult.unknowns.map((u, idx) => (
                                        <li key={`unk-${idx}`} className="flex items-start gap-1.5">
                                          <span>•</span>
                                          <span>{u}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Render Receipts for direct memory saves */}
                  {!msg.realityCheckResult && msg.receipts && msg.receipts.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-[#18181B]/15">
                      {(() => {
                        const verifiedReceipts = msg.receipts.filter(
                          (r) => r.category !== 'assumption' && r.category !== 'uncertainty' && !r.isContradiction
                        );
                        const unverifiedNotes = msg.receipts.filter(
                          (r) => r.category === 'assumption' || r.category === 'uncertainty' || r.isContradiction
                        );

                        return (
                          <>
                            {verifiedReceipts.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#C85A32] flex items-center gap-1">
                                  <Quote className="w-3 h-3" />
                                  <span>Here&apos;s what I&apos;m keeping in mind:</span>
                                </span>

                                {verifiedReceipts.map((receipt) => (
                                  <div
                                    key={receipt.memory_id}
                                    className="border-l-3 border-[#C85A32] bg-[#FFFFFF]/80 p-2.5 rounded-r-xl space-y-0.5 text-xs font-sans text-[#18181B]"
                                  >
                                    <p className="font-serif italic text-xs text-[#18181B]">
                                      &ldquo;{receipt.text}&rdquo;
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {unverifiedNotes.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                                  <span>What I&apos;m not sure about:</span>
                                </span>

                                {unverifiedNotes.map((note) => (
                                  <div
                                    key={note.memory_id}
                                    className="border border-[#F59E0B]/30 bg-[#FEF3C7]/40 p-2.5 rounded-xl space-y-0.5 text-xs font-sans text-[#92400E]"
                                  >
                                    <p className="font-sans text-xs text-[#78350F]">
                                      {note.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <span className="block text-[10px] font-sans text-[#78716C] text-right pt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* STEP 3: Progress Indicator with short status text */}
          {isLoading && (
            <div className="chat-bubble flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#FEF8E0] border border-[#18181B]/30 flex items-center justify-center p-1.5 shrink-0 mt-1">
                <img src="/illustrations/undraw_chat-text.svg" alt="Third Wheel" className="w-full h-full object-contain" />
              </div>

              <div className="bg-[#FEF8E0] border-[1.5px] border-[#18181B] rounded-[16px] p-3.5 px-4 shadow-[3px_3px_0px_#18181B] flex items-center gap-2.5 text-xs font-sans font-semibold text-[#18181B]">
                <Sparkles className="w-4 h-4 text-[#C85A32] animate-spin shrink-0" />
                <span>{statusStepMessage}</span>
              </div>
            </div>
          )}

          {/* Separate Reality Check Error Banner below saved receipts */}
          {realityCheckError && !isLoading && (
            <div className="p-4 rounded-xl border border-amber-800/30 bg-amber-50 text-amber-900 text-xs font-sans flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Reality Check: {realityCheckError}</span>
              </div>
              <button
                onClick={handleRetryRealityCheckOnly}
                disabled={isRetryingCheck}
                className="px-3 py-1 rounded-full border border-amber-800 bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition shrink-0 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRetryingCheck ? 'animate-spin' : ''}`} />
                <span>{isRetryingCheck ? 'Retrying Check...' : 'Retry Check'}</span>
              </button>
            </div>
          )}

          {/* General Ingestion Error Banner */}
          {error && (
            <div className="p-4 rounded-xl border border-rose-800/30 bg-rose-50 text-rose-900 text-xs font-sans flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage(lastQuery)}
                className="px-3 py-1 rounded-full border border-rose-800 bg-rose-800 text-white text-xs font-bold hover:bg-rose-900 transition shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FIXED BOTTOM INPUT BAR */}
        {/* ------------------------------------------------------------- */}
        <footer className="border-t-[1.5px] border-[#18181B] bg-[#FAF8F5] p-4 sm:p-5 shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me what happened…"
              rows={2}
              className="flex-1 bg-[#FFFFFF] border-[1.5px] border-[#18181B] rounded-2xl p-3.5 text-sm font-sans text-[#18181B] placeholder-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#C85A32] resize-none shadow-[2px_2px_0px_#18181B]"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="h-12 px-6 rounded-2xl border-[1.5px] border-[#18181B] bg-[#18181B] text-[#F8F6F1] font-sans font-bold text-xs uppercase tracking-wider hover:bg-[#C85A32] hover:border-[#C85A32] disabled:opacity-40 disabled:hover:bg-[#18181B] transition inline-flex items-center gap-2 shrink-0 cursor-pointer shadow-[2px_2px_0px_#18181B]"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
