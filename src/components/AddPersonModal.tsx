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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-[#E7E1D8] bg-[#FAF8F5] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E7E1D8] pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#C85A32] uppercase">DOSSIER CREATION</span>
            <h3 className="font-serif text-2xl font-medium text-[#1C1917] mt-0.5">Add person</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#78716C] hover:bg-[#E7E1D8]/60 hover:text-[#1C1917] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-mono text-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#78716C] uppercase tracking-wider mb-1.5">
              Name / Alias *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun, Rahul, Maya..."
              required
              className="w-full rounded-md border border-[#E7E1D8] bg-[#FFFFFF] px-4 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#78716C] uppercase tracking-wider mb-1.5">
              Relationship Context
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value as any)}
              className="w-full rounded-md border border-[#E7E1D8] bg-[#FFFFFF] px-4 py-2.5 text-sm text-[#1C1917] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition cursor-pointer"
            >
              <option value="talking">Talking</option>
              <option value="dating">Dating</option>
              <option value="friend">Friend</option>
              <option value="ex">Ex</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#78716C] uppercase tracking-wider mb-1.5">
              Initial Note (Optional)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Coffee near campus..."
              rows={2}
              className="w-full rounded-md border border-[#E7E1D8] bg-[#FFFFFF] px-4 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] focus:border-[#C85A32] focus:outline-none focus:ring-1 focus:ring-[#C85A32]/30 transition font-serif"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#E7E1D8] bg-[#FAF8F5] px-5 py-2 text-xs font-mono uppercase tracking-wider text-[#78716C] hover:bg-[#F4EFEA] hover:text-[#1C1917] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-[#1C1917] hover:bg-[#332F2B] px-6 py-2 text-xs font-mono uppercase tracking-wider text-[#FAF8F5] transition disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Create journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


