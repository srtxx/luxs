'use client';

import React, { useEffect } from 'react';
import { X, Grid2X2, Package, Repeat, Check, ArrowRight, Film } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

interface SavedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedImageUrl: string | null;
  onOpenCollage: () => void;
  onOpenPrint: () => void;
  onOpenLiveLoop: () => void;
  onResetVideo: () => void;
}

export const SavedSuccessModal: React.FC<SavedSuccessModalProps> = ({
  isOpen,
  onClose,
  savedImageUrl,
  onOpenCollage,
  onOpenPrint,
  onOpenLiveLoop,
  onResetVideo,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-md bg-[var(--surface)] text-[var(--foreground)] rounded-2xl border border-[var(--surface-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-border)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-primary-subtle)] text-[var(--accent-primary-text)] border border-[var(--accent-primary)]/30 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm font-semibold tracking-tight">写真を保存しました</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Saved Image Preview Card */}
          {savedImageUrl && (
            <div className="w-full flex justify-center">
              <div className="relative max-h-44 rounded-xl overflow-hidden studio-elevation border border-[var(--surface-border)] bg-[var(--canvas-bg)]">
                <img
                  src={savedImageUrl}
                  alt="保存された写真"
                  className="max-h-44 w-auto object-contain pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Next Creative Actions */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider px-1">
              この写真を使って作成
            </div>

            {/* Action 1: 4-Cut Collage */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCollage();
                triggerHapticTick(1100, 0.03);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center text-[var(--accent-primary)] shadow-2xs">
                  <Grid2X2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">4カット組写真を作る</div>
                  <div className="text-[11px] text-[var(--foreground-muted)]">前後のコマを並べて1枚の写真にレイアウト</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-muted)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Action 2: Physical Goods Print */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrint();
                triggerHapticTick(1100, 0.03);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center text-[var(--accent-primary)] shadow-2xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">グッズ印刷を注文する</div>
                  <div className="text-[11px] text-[var(--foreground-muted)]">自立アクリルブロックやスクエアカード</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-muted)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Action 3: Live Photo Loop */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveLoop();
                triggerHapticTick(1100, 0.03);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center text-[var(--foreground-muted)] shadow-2xs">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">ループ動画を作成する</div>
                  <div className="text-[11px] text-[var(--foreground-muted)]">Live Photo風のショートループ動画として書き出し</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-muted)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--surface-border)] bg-[var(--surface-subtle)]/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onResetVideo();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 opacity-70" />
            <span>別の動画を選ぶ</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] tactile-btn shadow-xs cursor-pointer"
          >
            編集を続ける
          </button>
        </div>
      </div>
    </div>
  );
};
