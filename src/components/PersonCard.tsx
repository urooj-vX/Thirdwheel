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

  return (
    <div
      onClick={() => onSelect(person.person_id)}
      className={`group cursor-pointer rounded-2xl border bg-white p-6 sm:p-7 transition-all duration-200 ${
        isActive
          ? 'border-[#C85A32] shadow-sm ring-1 ring-[#C85A32]/20'
          : 'border-[#E6E1DA] hover:border-[#C85A32]/40 hover:shadow-sm'
      }`}
    >
      {/* Name and Status Header */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl font-medium tracking-tight text-[#1C1B1A] group-hover:text-[#C85A32] transition">
          {person.name}
        </h3>
        {person.relationship_status && (
          <span className="text-xs font-sans text-[#6E6A63] capitalize">
            {person.relationship_status}
          </span>
        )}
      </div>

      {/* Meaningful Recent Receipt / Quote */}
      <div className="my-5 min-h-[3.5rem] flex items-center">
        {person.summary ? (
          <blockquote className="font-serif italic text-sm text-[#3E3B36] leading-relaxed line-clamp-2">
            &ldquo;{person.summary}&rdquo;
          </blockquote>
        ) : (
          <p className="font-serif italic text-sm text-[#A09B93]">
            No receipts logged yet for {person.name}.
          </p>
        )}
      </div>

      {/* Subtle Meta Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#F2ECE4] text-xs text-[#6E6A63]">
        <span>{totalReceipts} {totalReceipts === 1 ? 'receipt' : 'receipts'}</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}


