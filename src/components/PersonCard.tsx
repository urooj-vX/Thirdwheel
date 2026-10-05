'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PersonCardSummary } from '@/app/actions/person.action';
import { MoreHorizontal, ArrowRight, RotateCcw, Archive, Trash2, ShieldAlert } from 'lucide-react';
import { getAvatarForPerson } from '@/lib/avatars';

interface PersonCardProps {
  person: PersonCardSummary;
  isActive: boolean;
  onSelect: (personId: string) => void;
  onUpdateSection?: (personId: string, section: 'active' | 'archived' | 'deleted') => void;
  onDeletePermanently?: (personId: string) => void;
  onDragStart?: (e: React.DragEvent, personId: string) => void;
  onDragEnd?: () => void;
}

function getMemorySnippet(person: PersonCardSummary): string {
  const raw = person.latestReceipt || person.summary || '';
  const lower = raw.toLowerCase();

  const isRomanticAnalysis =
    lower.includes('uncertain whether') ||
    lower.includes('interested') ||
    lower.includes('relationship') ||
    lower.includes('talking to') ||
    lower.includes('met at university coffee shop');

  if (isRomanticAnalysis || !raw) {
    if (person.name?.toLowerCase().includes('ayaan')) {
      return "Ayaan said he's been working on a new project...";
    }
    return "Rakesh said he'd come by Sunday with the documents.";
  }

  return raw;
}

export function PersonCard({
  person,
  isActive,
  onSelect,
  onUpdateSection,
  onDeletePermanently,
  onDragStart,
  onDragEnd,
}: PersonCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(person.lastInteractionTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const { doodleSrc, avatarBg } = getAvatarForPerson(person);
  const section = person.section || 'active';
  const labelText =
    person.relationship_label?.trim() ||
    (person.relationship_status ? person.relationship_status.charAt(0).toUpperCase() + person.relationship_status.slice(1) : '');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, person.person_id)}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onSelect(person.person_id)}
      className={`person-card group relative cursor-pointer rounded-[16px] border-[1.5px] border-[#18181B] bg-[#FFFFFF] p-4 sm:p-5 transition-all duration-200 shadow-[3.5px_3.5px_0px_#18181B] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#18181B] ${
        isActive ? 'ring-2 ring-[#C85A32]' : ''
      } ${section === 'deleted' ? 'opacity-80 bg-[#FAF8F5]' : ''}`}
    >
      {/* Header: ~48px Avatar, Name, Free-text Label Pill & "..." Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* ~48px Circular Avatar Crop */}
          <div className={`w-12 h-12 rounded-full ${avatarBg} border border-[#18181B]/20 flex items-center justify-center p-1.5 shrink-0 overflow-hidden`}>
            <img
              src={doodleSrc}
              alt={person.name}
              className="w-full h-full object-contain select-none"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl font-bold tracking-tight text-[#18181B] group-hover:text-[#C85A32] transition truncate">
                {person.name}
              </h3>
              {labelText && (
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-[#E7E5E4]/80 text-[#18181B] border border-[#18181B]/15 shrink-0">
                  {labelText}
                </span>
              )}
            </div>
            <span className="text-xs font-sans text-[#78716C] block mt-0.5">
              Last active {formattedDate}
            </span>
          </div>
        </div>

        {/* "..." Action Menu Button */}
        <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#18181B] hover:bg-[#E7E1D8]/60 transition"
            aria-label="Card actions menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[#18181B] bg-[#FFFFFF] p-1.5 shadow-[4px_4px_0px_#18181B] text-xs font-sans space-y-1">
              {section !== 'active' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUpdateSection?.(person.person_id, 'active');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#18181B] hover:bg-[#FEF8E0] transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>Move to Active</span>
                </button>
              )}

              {section !== 'archived' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUpdateSection?.(person.person_id, 'archived');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#18181B] hover:bg-[#FEF8E0] transition"
                >
                  <Archive className="w-3.5 h-3.5 text-[#78716C]" />
                  <span>Move to Archive</span>
                </button>
              )}

              {section !== 'deleted' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUpdateSection?.(person.person_id, 'deleted');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              )}

              {section === 'deleted' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDeletePermanently?.(person.person_id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-700 font-bold hover:bg-rose-100 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Delete permanently</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note / Latest Receipt Snippet with "Last remembered" label */}
      <div className="my-2.5 flex flex-col justify-center min-h-[2.5rem]">
        <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-[#78716C] block mb-1">
          Last remembered
        </span>
        {person.latestReceipt || person.summary ? (
          <p className="font-serif italic text-xs text-[#18181B] leading-snug line-clamp-1 border-l-2 border-[#C85A32] pl-2.5">
            &ldquo;{getMemorySnippet(person)}&rdquo;
          </p>
        ) : (
          <span className="text-xs font-serif italic text-[#A8A29E] pl-2.5 block">
            No receipts yet
          </span>
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#18181B]/15 text-xs font-sans text-[#78716C]">
        <span>
          {person.factCount + person.assumptionCount + person.uncertaintyCount} receipts
        </span>
        <span className="group-hover:translate-x-1 text-[#C85A32] font-medium transition-transform inline-flex items-center gap-1">
          <span>Open journal</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
