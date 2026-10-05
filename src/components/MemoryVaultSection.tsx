'use client';

import React, { useState } from 'react';
import { MemoryDocument, OpenThreadDocument, EventDocument } from '@/types';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface MemoryVaultSectionProps {
  personName: string;
  memories: MemoryDocument[];
  openThreads?: OpenThreadDocument[];
  events?: EventDocument[];
}

export function MemoryVaultSection({ personName, memories }: MemoryVaultSectionProps) {
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  return (
    <div className="space-y-8 py-2">
      {/* Section Header */}
      <div className="border-b border-[#E7E1D8] pb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1917]">
            Your receipts for {personName}
          </h2>
          <p className="text-sm text-[#78716C] mt-1 font-sans">
            Every memory is anchored to a specific interaction transcript.
          </p>
        </div>
        <img src="/illustrations/remembering.svg" alt="Receipts" className="w-10 h-10 opacity-75 hidden sm:block" />
      </div>

      {/* Entry stream */}
      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="rounded-xl border border-[#E7E1D8] bg-[#FAF8F5] p-12 text-center space-y-3">
            <img src="/illustrations/empty-waiting.svg" alt="No receipts" className="w-14 h-14 mx-auto opacity-75" />
            <p className="font-serif italic text-base text-[#78716C]">
              No receipts recorded yet for {personName}.
            </p>
          </div>
        ) : (
          memories.map((mem) => {
            const formattedDate = new Date(mem.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            const isExpanded = expandedMemoryId === mem.memory_id;

            return (
              <article
                key={mem.memory_id}
                className="rounded-xl border border-[#E7E1D8] bg-[#FFFFFF] p-6 space-y-4 transition-all hover:border-[#C85A32]/40"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#E7E1D8]/60 pb-3">
                  <span className="text-xs font-sans text-[#78716C]">
                    Recorded {formattedDate}
                  </span>
                </div>

                {/* Claim / Statement */}
                <blockquote className="font-serif text-xl text-[#1C1917] leading-relaxed italic">
                  &ldquo;{mem.content}&rdquo;
                </blockquote>

                {/* Provenance Expander */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedMemoryId(isExpanded ? null : mem.memory_id)}
                    className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[#C85A32] hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isExpanded ? 'Hide original conversation' : 'View original conversation →'}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E1D8] space-y-2 animate-fade-in">
                      <div className="text-xs font-sans font-medium text-[#78716C]">
                        Original interaction
                      </div>
                      <p className="font-sans text-sm text-[#4D4540] leading-relaxed">
                        &ldquo;{mem.content}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}


