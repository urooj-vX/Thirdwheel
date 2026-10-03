'use client';

import React, { useState } from 'react';
import { ingestInteractionAction } from '@/app/actions/ingest.action';
import { ExtractionResult } from '@/lib/validation/schemas';
import { PenTool, CheckCircle2 } from 'lucide-react';

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
      <div className="space-y-6 bg-[#FFFFFF] border border-[#E7E1D8] rounded-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E1D8] pb-4">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#C85A32] uppercase">
              JOURNAL ENTRY // LOG NEW RECEIPT
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1917] mt-1">
              What happened with {personName}?
            </h2>
          </div>

          {/* Quiet Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pasted_text')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-mono tracking-wider transition uppercase ${
                activeTab === 'pasted_text'
                  ? 'bg-[#1C1917] text-[#FAF8F5]'
                  : 'text-[#78716C] hover:text-[#1C1917] bg-[#FAF8F5] border border-[#E7E1D8]'
              }`}
            >
              Paste Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('narrative')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-mono tracking-wider transition uppercase ${
                activeTab === 'narrative'
                  ? 'bg-[#1C1917] text-[#FAF8F5]'
                  : 'text-[#78716C] hover:text-[#1C1917] bg-[#FAF8F5] border border-[#E7E1D8]'
              }`}
            >
              Describe Event
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-mono text-rose-800">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                activeTab === 'pasted_text'
                  ? `Paste text messages or conversation snippets with ${personName}...`
                  : `Record what was actually said or done during your meeting with ${personName}...`
              }
              rows={5}
              className="w-full rounded-md border border-[#E7E1D8] bg-[#FAF8F5] p-5 text-base text-[#1C1917] placeholder-[#A8A29E] focus:border-[#C85A32] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition leading-relaxed font-serif"
            />

            <button
              type="button"
              onClick={handleInsertDemoText}
              className="absolute right-4 bottom-4 text-xs text-[#C85A32] hover:underline bg-[#FFFFFF] px-3 py-1 rounded-md border border-[#E7E1D8] font-mono uppercase tracking-wider"
            >
              + Use sample quote
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-sans text-[#78716C]">
              Receipts are stored privately in {personName}&apos;s isolated journal space.
            </span>
            <button
              type="submit"
              disabled={isProcessing || !content.trim()}
              className="rounded-md bg-[#C85A32] hover:bg-[#A23E18] px-7 py-2.5 text-xs font-mono uppercase tracking-wider text-white shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Saving receipt...' : 'Add to journal'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Extracted Receipt Fragment Confirmation */}
      {lastExtraction && (
        <div className="p-6 rounded-lg border border-[#E7E1D8] bg-[#FFFFFF] space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#C85A32]" />
            <span className="text-xs font-mono tracking-widest text-[#C85A32] uppercase">
              RECEIPT SAVED & ANCHORED
            </span>
          </div>

          <div className="space-y-3">
            {lastExtraction.facts.map((fact, idx) => (
              <div key={idx} className="rounded-md border border-[#E7E1D8] bg-[#FAF8F5] p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#C85A32] uppercase tracking-widest block">FACT VERIFIED</span>
                <p className="font-serif italic text-base text-[#1C1917]">&ldquo;{fact.content}&rdquo;</p>
              </div>
            ))}

            {lastExtraction.assumptions.map((ass, idx) => (
              <div key={`ass-${idx}`} className="rounded-md border border-[#E7E1D8] bg-[#FAF8F5] p-4 space-y-1">
                <span className="text-[10px] font-mono text-[#78716C] uppercase tracking-widest block">UNVERIFIED ASSUMPTION</span>
                <p className="font-serif italic text-base text-[#57534E]">&ldquo;{ass.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


