'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPerson: (data: { name: string; relationshipLabel?: string; summary?: string }) => Promise<void>;
}

export function AddPersonModal({ isOpen, onClose, onAddPerson }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [relationshipLabel, setRelationshipLabel] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddPerson({
        name: name.trim(),
        relationshipLabel: relationshipLabel.trim() || undefined,
        summary: summary.trim() || undefined,
      });
      setName('');
      setRelationshipLabel('');
      setSummary('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-[420px] rounded-[20px] border-[1.5px] border-[#18181B] bg-[#FAF8F5] p-6 sm:p-7 shadow-[6px_6px_0px_#18181B] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#18181B]/15 pb-4">
          <h3 className="font-serif text-2xl font-bold text-[#18181B]">Add person</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#78716C] hover:bg-[#E7E1D8] hover:text-[#18181B] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-sans text-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-sans font-bold text-[#18181B] mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rakesh, Ayaan..."
              required
              className="w-full rounded-xl border border-[#18181B]/30 bg-[#FFFFFF] px-3.5 py-2.5 text-sm font-sans text-[#18181B] placeholder-[#78716C] focus:border-[#C85A32] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 transition shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-bold text-[#18181B] mb-1.5">
              How do you know them?
            </label>
            <input
              type="text"
              value={relationshipLabel}
              onChange={(e) => setRelationshipLabel(e.target.value)}
              maxLength={60}
              placeholder="e.g. uncle, college friend, neighbor..."
              className="w-full rounded-xl border border-[#18181B]/30 bg-[#FFFFFF] px-3.5 py-2.5 text-sm font-sans text-[#18181B] placeholder-[#78716C] focus:border-[#C85A32] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 transition shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-bold text-[#18181B] mb-1.5">
              Anything worth remembering? (optional)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. usually calls on Sundays..."
              rows={2}
              className="w-full rounded-xl border border-[#18181B]/30 bg-[#FFFFFF] px-3.5 py-2.5 text-sm font-sans text-[#18181B] placeholder-[#78716C] focus:border-[#C85A32] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 transition shadow-2xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#18181B]/30 bg-[#FFFFFF] px-5 py-2 text-xs font-sans font-bold text-[#18181B] hover:bg-[#E7E1D8] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#18181B] hover:bg-[#C85A32] px-6 py-2 text-xs font-sans font-bold text-[#F8F6F1] transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create memory space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
