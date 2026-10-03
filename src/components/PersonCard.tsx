'use client';

import React from 'react';
import { PersonCardSummary } from '@/app/actions/person.action';

interface PersonCardProps {
  person: PersonCardSummary;
  isActive: boolean;
  onSelect: (personId: string) => void;
}

export function PersonCard({ person, isActive, onSelect }: PersonCardProps) {
  const formattedDate = new Date(person.lastInteractionTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const totalReceipts = person.factCount + person.assumptionCount + person.uncertaintyCount;

  // Determine doodle icon based on name
  const isArjun = person.name.toLowerCase().includes('arjun');
  const isRahul = person.name.toLowerCase().includes('rahul');
  const doodleSrc = isArjun
    ? '/illustrations/coffee-doodle.svg'
    : isRahul
    ? '/illustrations/tennis-doodle.svg'
    : '/illustrations/third-wheel-mascot.svg';

  return (
    <div
      onClick={() => onSelect(person.person_id)}
      className={`group cursor-pointer rounded-lg border p-6 sm:p-7 transition-all duration-200 ${
        isActive
          ? 'bg-[#F4EFEA] border-[#C85A32] shadow-xs ring-1 ring-[#C85A32]/20'
          : 'bg-[#FFFFFF] border-[#E7E1D8] hover:border-[#C85A32]/50 hover:bg-[#FAF8F5]'
      }`}
    >
      {/* Header: Name, Doodle Motif & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E7E1D8] flex items-center justify-center p-1.5 shrink-0 group-hover:border-[#C85A32]/40 transition">
            <img src={doodleSrc} alt={person.name} className="w-full h-full object-contain opacity-85" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1C1917] group-hover:text-[#C85A32] transition">
              {person.name}
            </h3>
            {person.relationship_status && (
              <span className="text-[11px] font-mono tracking-wider text-[#78716C] uppercase">
                {person.relationship_status}
              </span>
            )}
          </div>
        </div>
        
        <span className="text-[11px] font-mono text-[#A8A29E] uppercase tracking-wider">
          {formattedDate}
        </span>
      </div>

      {/* Note Fragment */}
      <div className="my-5 min-h-[3.25rem] flex items-center">
        {person.summary ? (
          <p className="font-serif italic text-sm text-[#4D4540] leading-relaxed line-clamp-2 border-l-2 border-[#C85A32]/40 pl-3">
            &ldquo;{person.summary}&rdquo;
          </p>
        ) : (
          <p className="font-serif italic text-xs text-[#A8A29E] border-l-2 border-[#E7E1D8] pl-3">
            No receipts logged yet for {person.name}.
          </p>
        )}
      </div>

      {/* Editorial Meta Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E7E1D8]/60 text-xs font-mono text-[#78716C]">
        <span className="uppercase tracking-wider">
          {totalReceipts} {totalReceipts === 1 ? 'receipt' : 'receipts'}
        </span>
        <span className="group-hover:translate-x-1 text-[#C85A32] font-sans font-medium transition-transform inline-flex items-center gap-1">
          Open Journal &rarr;
        </span>
      </div>
    </div>
  );
}



