'use client';

import React from 'react';
import { MemoryDocument, OpenThreadDocument, EventDocument } from '@/types';

interface MemoryVaultSectionProps {
  personName: string;
  memories: MemoryDocument[];
  openThreads?: OpenThreadDocument[];
  events?: EventDocument[];
}

export function MemoryVaultSection({ personName, memories }: MemoryVaultSectionProps) {
  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="border-b border-[#E6E1DA] pb-4">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C1B1A]">
          Receipts
        </h2>
        <p className="text-sm text-[#6E6A63] mt-1 font-sans">
          A chronological journal of what was actually said and recorded for {personName}.
        </p>
      </div>

      {/* Entry stream */}
      <div className="space-y-8">
        {memories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-serif italic text-base text-[#A09B93]">
              No receipts recorded yet for {personName}.
            </p>
          </div>
        ) : (
          memories.map((mem) => {
            const formattedDate = new Date(mem.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            });

            return (
              <article key={mem.memory_id} className="border-b border-[#E6E1DA] pb-8 space-y-2">
                <div className="text-xs font-sans text-[#6E6A63] uppercase tracking-wider">
                  {formattedDate}
                </div>
                <p className="font-serif text-xl text-[#1C1B1A] leading-relaxed italic">
                  &ldquo;{mem.content}&rdquo;
                </p>
                <div className="text-xs text-[#6E6A63] font-sans pt-1">
                  Source: {mem.memory_type || 'conversation'}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
