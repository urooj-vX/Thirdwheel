'use client';

import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  persons: Array<{ person_id: string; name: string }>;
  activePersonId: string | null;
  isAppStarted?: boolean;
  onSelectPerson: (personId: string | null) => void;
  onGoToLanding?: () => void;
  onOpenAddPerson: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export function Header({
  activePersonId,
  isAppStarted = false,
  onSelectPerson,
  onGoToLanding,
  onOpenAddPerson,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E1D8]/60 bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left Brand / Back Navigation */}
        <div className="flex items-center gap-4">
          {activePersonId ? (
            <>
              <button
                onClick={() => onSelectPerson(null)}
                className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[#78716C] hover:text-[#1C1917] transition"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Your people</span>
              </button>
              <span className="text-[#E7E1D8]">|</span>
              <span 
                onClick={() => onSelectPerson(null)}
                className="font-serif text-lg font-medium tracking-tight text-[#1C1917] cursor-pointer hover:text-[#C85A32] transition"
              >
                THIRD WHEEL
              </span>
            </>
          ) : isAppStarted ? (
            <div 
              onClick={() => onSelectPerson(null)}
              className="flex items-center cursor-pointer group gap-2"
            >
              <span className="font-serif text-xl font-medium tracking-tight text-[#1C1917] group-hover:text-[#C85A32] transition">
                THIRD WHEEL
              </span>
            </div>
          ) : (
            <div 
              onClick={() => onGoToLanding?.()}
              className="flex items-center cursor-pointer"
            >
              <span className="font-serif text-xl font-medium tracking-tight text-[#1C1917] hover:text-[#C85A32] transition">
                THIRD WHEEL
              </span>
            </div>
          )}
        </div>

        {/* Right Actions: Demo User Pill */}
        {isAppStarted ? (
          <div className="flex items-center gap-3">
            {/* User Profile Badge */}
            <div className="flex items-center gap-2 rounded-full border border-[#18181B]/20 bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-sans text-[#18181B]">
              <div className="w-5 h-5 rounded-full bg-[#18181B] text-[#F8F6F1] text-[10px] font-medium flex items-center justify-center shrink-0">
                DU
              </div>
              <span className="font-medium text-[#18181B]">Demo User</span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}




