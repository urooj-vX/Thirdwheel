'use client';

import React, { useState } from 'react';
import { runRealityCheckAction } from '@/app/actions/reality-check.action';
import { RealityCheckResult } from '@/lib/validation/schemas';
import { Search, Sparkles } from 'lucide-react';

interface RealityCheckSectionProps {
  personId: string;
  personName: string;
}

export function RealityCheckSection({ personId, personName }: RealityCheckSectionProps) {
  const [query, setQuery] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RealityCheckResult | null>(null);

  const presetQuestions = [
    `What did ${personName} tell me about Sunday?`,
    `Did I promise ${personName} anything?`,
    `What do I remember about ${personName}?`,
    `When did ${personName} mention the documents?`,
  ];

  const handleRunCheck = async (questionToRun?: string) => {
    const targetQuery = questionToRun || query;
    if (!targetQuery.trim()) {
      setError('Please type what is on your mind.');
      return;
    }

    try {
      setIsEvaluating(true);
      setError(null);

      const res = await runRealityCheckAction({
        personId,
        query: targetQuery.trim(),
      });

      if (!res.success || !res.result) {
        throw new Error(res.error || 'Failed to complete Reality Check');
      }

      setResult(res.result);
      if (questionToRun) setQuery(questionToRun);
    } catch (err: unknown) {
      console.error('[RealityCheckSection Error]', err);
      setError("Couldn't get an answer right now. Your receipts are safe.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Input Section */}
      <div className="space-y-6 bg-[#FFFFFF] border border-[#E7E1D8] rounded-xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1917]">
              What are you wondering about {personName}?
            </h2>
            <p className="text-sm text-[#78716C] mt-1 font-sans">
              Separate what actually happened from what you inferred.
            </p>
          </div>
          <img src="/illustrations/wondering.svg" alt="Wondering" className="w-12 h-12 opacity-80 hidden sm:block" />
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-sans text-rose-800 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => handleRunCheck()}
              className="px-3 py-1 rounded-full border border-rose-700 bg-rose-700 text-white font-bold hover:bg-rose-800 transition shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunCheck()}
            placeholder={`e.g. What did ${personName} tell me about Sunday?`}
            className="flex-1 rounded-full border border-[#E7E1D8] bg-[#FAF8F5] px-5 py-3.5 text-base text-[#1C1917] placeholder-[#A8A29E] focus:border-[#C85A32] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition font-sans"
          />
          <button
            type="button"
            onClick={() => handleRunCheck()}
            disabled={isEvaluating || !query.trim()}
            className="rounded-full bg-[#1C1917] hover:bg-[#332F2B] px-7 py-3.5 text-xs font-sans font-medium text-[#FAF8F5] shadow-xs transition disabled:opacity-50 shrink-0 inline-flex items-center justify-center gap-2"
          >
            {isEvaluating ? (
              <>
                <Search className="h-4 w-4 animate-spin text-[#C85A32]" />
                <span>Looking through receipts...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#C85A32]" />
                <span>Ask Third Wheel &rarr;</span>
              </>
            )}
          </button>
        </div>

        {/* Quiet Preset Suggestions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleRunCheck(q)}
              disabled={isEvaluating}
              className="text-xs font-sans text-[#57534E] hover:text-[#1C1917] hover:border-[#C85A32]/40 bg-[#FAF8F5] border border-[#E7E1D8] rounded-full px-3.5 py-1.5 transition text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Animation State */}
      {isEvaluating && (
        <div className="rounded-xl border border-[#E7E1D8] bg-[#FAF8F5] p-10 text-center space-y-4 animate-pulse">
          <img src="/illustrations/searching.svg" alt="Searching" className="w-16 h-16 mx-auto opacity-80 animate-bounce" />
          <div className="space-y-1">
            <h4 className="font-serif text-xl text-[#1C1917]">Looking through your receipts for {personName}...</h4>
            <p className="text-xs font-sans text-[#78716C]">
              Comparing recorded facts against what you inferred
            </p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && !isEvaluating && (
        <div className="rounded-xl border border-[#E7E1D8] bg-[#FFFFFF] p-7 sm:p-9 space-y-8 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E7E1D8] pb-4">
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1C1917]">
              Here&apos;s what I can actually tell you.
            </h3>
            <img src="/illustrations/searching.svg" alt="Receipts verified" className="w-8 h-8 opacity-75" />
          </div>

          {/* Editorial Conclusion / What I can verify */}
          <div className="border-l-3 border-[#C85A32] pl-6 py-2 bg-[#FBF0EC]/40 rounded-r-lg">
            <span className="text-xs font-sans font-semibold text-[#C85A32] uppercase tracking-wider block mb-1">
              HERE&apos;S WHAT I CAN VERIFY
            </span>
            <p className="font-serif text-2xl text-[#1C1917] leading-relaxed font-medium">
              &ldquo;{result.conclusion}&rdquo;
            </p>
          </div>

          {/* What I know vs What I'm not sure about */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* WHAT I KNOW */}
            <div className="space-y-3 bg-[#FAF8F5] p-5 rounded-xl border border-[#E7E1D8]">
              <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#C85A32]">
                What I know
              </h4>
              {result.known_facts.length === 0 ? (
                <p className="font-serif italic text-sm text-[#A8A29E]">
                  No direct receipts logged yet for this question.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {result.known_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#1C1917] font-sans">
                      <span className="text-[#C85A32] shrink-0 mt-0.5">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* WHAT I'M NOT SURE ABOUT */}
            <div className="space-y-3 bg-[#FAF8F5] p-5 rounded-xl border border-[#E7E1D8]">
              <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                What I&apos;m not sure about
              </h4>
              {result.assumptions.length === 0 && result.unknowns.length === 0 ? (
                <p className="font-serif italic text-sm text-[#A8A29E]">
                  No unproven assumptions or missing details flagged.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {result.assumptions.map((ass, idx) => (
                    <li key={`ass-${idx}`} className="flex items-start gap-2.5 text-sm text-[#57534E] font-sans">
                      <span className="text-[#A8A29E] shrink-0 mt-0.5">•</span>
                      <span>{ass}</span>
                    </li>
                  ))}
                  {result.unknowns.map((unk, idx) => (
                    <li key={`unk-${idx}`} className="flex items-start gap-2.5 text-sm text-[#57534E] font-sans">
                      <span className="text-[#A8A29E] shrink-0 mt-0.5">•</span>
                      <span>{unk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* What I'd do next */}
          {result.closing_quote && (
            <div className="rounded-xl border border-[#E7E1D8] bg-[#F4EFEA] p-5 flex items-start gap-4">
              <img src="/illustrations/third-wheel-mascot.svg" alt="Third Wheel Advice" className="w-8 h-8 shrink-0 mt-0.5 opacity-85" />
              <div>
                <span className="text-xs font-sans font-semibold text-[#78716C] uppercase tracking-wider block mb-1">
                  WHAT I&apos;D DO NEXT
                </span>
                <p className="font-serif text-base text-[#1C1917] leading-relaxed">
                  {result.closing_quote}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



