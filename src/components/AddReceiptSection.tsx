'use client';

import React, { useState } from 'react';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import { ExtractionResult } from '@/lib/validation/schemas';

interface AddReceiptSectionProps {
  personId: string;
  personName: string;
  onInteractionIngested: () => void;
}

export function AddReceiptSection({ personId, personName, onInteractionIngested }: AddReceiptSectionProps) {
  const [activeTab, setActiveTab] = useState<'pasted_text' | 'narrative'>('pasted_text');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExtraction, setLastExtraction] = useState<ExtractionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please paste a conversation or write what happened.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const res = await ingestInteractionAction({
        personId,
        sourceType: activeTab,
        rawContent: content.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save receipt');
      }

      if (res.extraction) {
        setLastExtraction(res.extraction);
      }

      setContent('');
      onInteractionIngested();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInsertDemoText = () => {
    setContent('Arjun mentioned wanting to try the coffee shop near campus.');
  };

  return (
    <div className="space-y-8 py-2">
      {/* Input Card */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E6E1DA] pb-4">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1B1A]">
              New receipt for {personName}
            </h2>
            <p className="text-sm text-[#6E6A63] mt-1 font-sans">
              Log conversation excerpts or events to record what was actually said.
            </p>
          </div>

          {/* Quiet Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pasted_text')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                activeTab === 'pasted_text'
                  ? 'bg-[#1C1B1A] text-white'
                  : 'text-[#6E6A63] hover:text-[#1C1B1A] bg-white border border-[#E6E1DA]'
              }`}
            >
              Paste conversation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('narrative')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                activeTab === 'narrative'
                  ? 'bg-[#1C1B1A] text-white'
                  : 'text-[#6E6A63] hover:text-[#1C1B1A] bg-white border border-[#E6E1DA]'
              }`}
            >
              Describe event
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                activeTab === 'pasted_text'
                  ? `Paste verbatim text messages or messages with ${personName}...`
                  : `Describe what happened during your date or conversation with ${personName}...`
              }
              rows={5}
              className="w-full rounded-2xl border border-[#E6E1DA] bg-white p-5 text-base text-[#1C1B1A] placeholder-[#A09B93] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition leading-relaxed font-serif"
            />

            <button
              type="button"
              onClick={handleInsertDemoText}
              className="absolute right-4 bottom-4 text-xs text-[#C85A32] hover:underline bg-[#FBF9F5] px-3 py-1 rounded-full border border-[#E6E1DA] font-sans"
            >
              + Use sample text
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#6E6A63]">
              Receipts are stored privately in {personName}&apos;s journal.
            </span>
            <button
              type="submit"
              disabled={isProcessing || !content.trim()}
              className="rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-7 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50"
            >
              {isProcessing ? 'Saving receipt...' : 'Save receipt'}
            </button>
          </div>
        </form>
      </div>

      {/* Extracted Receipt Fragment Confirmation */}
      {lastExtraction && (
        <div className="pt-8 border-t border-[#E6E1DA] space-y-6 animate-fade-in">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C85A32]">
              Receipt Saved
            </span>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1C1B1A] mt-1">
              Extracted entries for {personName}
            </h3>
          </div>

          <div className="space-y-4">
            {lastExtraction.facts.map((fact, idx) => (
              <div key={idx} className="rounded-2xl border border-[#E6E1DA] bg-white p-5 space-y-1">
                <span className="text-xs text-[#6E6A63]">Verified receipt</span>
                <p className="font-serif italic text-base text-[#1C1B1A]">&ldquo;{fact.content}&rdquo;</p>
              </div>
            ))}

            {lastExtraction.assumptions.map((ass, idx) => (
              <div key={`ass-${idx}`} className="rounded-2xl border border-[#E6E1DA] bg-white p-5 space-y-1">
                <span className="text-xs text-[#6E6A63]">Unverified assumption</span>
                <p className="font-serif italic text-base text-[#6E6A63]">&ldquo;{ass.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

