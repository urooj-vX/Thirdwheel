'use client';

import React, { useState } from 'react';
import { runRealityCheckAction } from '@/app/actions/reality-check.action';
import { RealityCheckResult } from '@/lib/validation/schemas';

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
    `Does ${personName} like me?`,
    `What plans do we actually have scheduled?`,
    `What has ${personName} explicitly said about work?`,
    `What assumptions am I making about ${personName}?`,
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
      setError(err instanceof Error ? err.message : 'Reality Check failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-10 py-2">
      {/* Input Section */}
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1B1A]">
            Something on your mind?
          </h2>
          <p className="text-sm text-[#6E6A63] mt-1 font-sans">
            Separate what actually happened from what you inferred about {personName}.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunCheck()}
            placeholder={`Does ${personName} like me?`}
            className="flex-1 rounded-full border border-[#E6E1DA] bg-white px-5 py-3 text-base text-[#1C1B1A] placeholder-[#A09B93] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition"
          />
          <button
            type="button"
            onClick={() => handleRunCheck()}
            disabled={isEvaluating || !query.trim()}
            className="rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-7 py-3 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {isEvaluating ? 'Checking receipts...' : 'Ask'}
          </button>
        </div>

        {/* Quiet Preset Suggestions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleRunCheck(q)}
              disabled={isEvaluating}
              className="text-xs text-[#6E6A63] hover:text-[#1C1B1A] bg-white border border-[#E6E1DA] rounded-full px-3.5 py-1.5 transition text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="pt-8 border-t border-[#E6E1DA] space-y-8 animate-fade-in">
          <div>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1C1B1A]">
              Here&apos;s what the receipts say.
            </h3>
          </div>

          {/* Large Editorial Conclusion */}
          <div className="border-l-2 border-[#C85A32] pl-5 py-1">
            <p className="font-serif text-2xl text-[#1C1B1A] leading-relaxed font-medium">
              &ldquo;{result.conclusion}&rdquo;
            </p>
          </div>

          {/* We know vs We don't know */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* We know */}
            <div className="space-y-3">
              <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#C85A32]">
                We know:
              </h4>
              {result.known_facts.length === 0 ? (
                <p className="font-serif italic text-sm text-[#A09B93]">
                  No direct receipts found regarding this question.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {result.known_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#1C1B1A] font-sans">
                      <span className="text-[#C85A32] shrink-0 mt-0.5">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* We don't know */}
            <div className="space-y-3">
              <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
                We don&apos;t know:
              </h4>
              {result.assumptions.length === 0 && result.unknowns.length === 0 ? (
                <p className="font-serif italic text-sm text-[#A09B93]">
                  No unproven assumptions or missing details flagged.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {result.assumptions.map((ass, idx) => (
                    <li key={`ass-${idx}`} className="flex items-start gap-2.5 text-sm text-[#6E6A63] font-sans">
                      <span className="text-[#A09B93] shrink-0 mt-0.5">•</span>
                      <span>{ass}</span>
                    </li>
                  ))}
                  {result.unknowns.map((unk, idx) => (
                    <li key={`unk-${idx}`} className="flex items-start gap-2.5 text-sm text-[#6E6A63] font-sans">
                      <span className="text-[#A09B93] shrink-0 mt-0.5">•</span>
                      <span>{unk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quiet Takeaway */}
          {result.closing_quote && (
            <div className="rounded-2xl border border-[#E6E1DA] bg-white p-6 mt-6">
              <p className="font-serif italic text-sm text-[#6E6A63] leading-relaxed">
                &ldquo;{result.closing_quote}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

