'use client';

import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  persons: Array<{ person_id: string; name: string }>;
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
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E1D8] bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-8">
        {/* Left Brand / Back Navigation */}
        <div className="flex items-center gap-4">
          {activePersonId ? (
            <button
              onClick={() => onSelectPerson(null)}
              className="group inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-[#78716C] hover:text-[#1C1917] transition uppercase"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Your People</span>
            </button>
          ) : null}

          <div 
            onClick={() => onSelectPerson(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img 
              src="/illustrations/third-wheel-mascot.svg" 
              alt="Third Wheel" 
              className="w-6 h-6 opacity-85 group-hover:scale-105 transition-transform" 
            />
            <span className="font-serif text-xl font-medium tracking-tight text-[#1C1917] group-hover:text-[#C85A32] transition">
              THIRD WHEEL
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-serif italic text-[#78716C]">
              Receipts, not vibes.
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1917] hover:bg-[#332F2B] px-4 py-1.5 text-xs font-mono tracking-wider uppercase text-[#FAF8F5] transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#C85A32]" />
            Add person
          </button>
        </div>
      </div>
    </header>
  );
}


