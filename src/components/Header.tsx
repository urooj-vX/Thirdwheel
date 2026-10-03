'use client';

import React from 'react';
import { PersonCardSummary } from '@/app/actions/person.action';
import { Plus, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  persons: PersonCardSummary[];
  activePersonId: string | null;
  onSelectPerson: (personId: string | null) => void;
  onOpenAddPerson: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export function Header({
  activePersonId,
  onSelectPerson,
  onOpenAddPerson,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E6E1DA] bg-[#FBF9F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left Brand / Navigation */}
        <div className="flex items-center gap-4">
          {activePersonId ? (
            <button
              onClick={() => onSelectPerson(null)}
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A63] hover:text-[#1C1B1A] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>People</span>
            </button>
          ) : null}

          <div>
            <span
              onClick={() => onSelectPerson(null)}
              className="font-serif text-lg font-medium tracking-tight text-[#1C1B1A] cursor-pointer"
            >
              THIRD WHEEL
            </span>
            <span className="hidden sm:inline-block ml-3 text-xs text-[#6E6A63] italic font-serif">
              Receipts, not vibes.
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-4 py-1.5 text-xs font-medium text-white transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add person
          </button>
        </div>
      </div>
    </header>
  );
}

