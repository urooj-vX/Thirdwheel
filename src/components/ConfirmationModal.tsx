'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const btnColors =
    confirmVariant === 'danger'
      ? 'bg-rose-700 hover:bg-rose-800 text-white'
      : confirmVariant === 'warning'
      ? 'bg-[#C85A32] hover:bg-[#A64825] text-white'
      : 'bg-[#18181B] hover:bg-[#332F2B] text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-[420px] rounded-[20px] border-[1.5px] border-[#18181B] bg-[#FAF8F5] p-6 shadow-[6px_6px_0px_#18181B] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#18181B] leading-tight">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-[#78716C] hover:bg-[#E7E1D8] hover:text-[#18181B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="font-sans text-xs sm:text-sm text-[#78716C] leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-[#18181B]/30 bg-[#FFFFFF] text-xs font-sans font-bold text-[#18181B] hover:bg-[#E7E1D8] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full border border-[#18181B] text-xs font-sans font-bold transition shadow-xs ${btnColors}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
