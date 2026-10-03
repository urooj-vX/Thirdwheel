'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPerson: (data: { name: string; relationshipStatus: 'talking' | 'dating' | 'ex' | 'friend' | 'paused'; summary?: string }) => Promise<void>;
}

export function AddPersonModal({ isOpen, onClose, onAddPerson }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<'talking' | 'dating' | 'ex' | 'friend' | 'paused'>('talking');
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
        relationshipStatus,
        summary: summary.trim() || undefined,
      });
      setName('');
      setSummary('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1B1A]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E1DA] bg-[#FBF9F5] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E6E1DA] pb-4">
          <div>
            <h3 className="font-serif text-2xl font-medium text-[#1C1B1A]">Add person</h3>
            <p className="text-xs text-[#6E6A63] mt-0.5 font-sans">
              Create a private journal space for someone in your life.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6E6A63] hover:bg-[#E6E1DA]/50 hover:text-[#1C1B1A] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#6E6A63] uppercase tracking-wider mb-1.5">
              Name / Alias *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun, Maya, Sam..."
              required
              className="w-full rounded-xl border border-[#E6E1DA] bg-white px-4 py-2.5 text-sm text-[#1C1B1A] placeholder-[#A09B93] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6A63] uppercase tracking-wider mb-1.5">
              Relationship / Status
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value as any)}
              className="w-full rounded-xl border border-[#E6E1DA] bg-white px-4 py-2.5 text-sm text-[#1C1B1A] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition cursor-pointer"
            >
              <option value="talking">Talking</option>
              <option value="dating">Dating</option>
              <option value="friend">Friend</option>
              <option value="ex">Ex</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6E6A63] uppercase tracking-wider mb-1.5">
              Short Context (Optional)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Met on Hinge, mutual friend Alex..."
              rows={2}
              className="w-full rounded-xl border border-[#E6E1DA] bg-white px-4 py-2.5 text-sm text-[#1C1B1A] placeholder-[#A09B93] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#E6E1DA] bg-white px-5 py-2 text-xs font-medium text-[#6E6A63] hover:bg-[#F2ECE4] hover:text-[#1C1B1A] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#C85A32] hover:bg-[#B34E29] px-5 py-2 text-xs font-medium text-white transition disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

