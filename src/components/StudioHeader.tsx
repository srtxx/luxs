'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from './StudioCanvas';
import {
  Download,
  Archive,
  X,
  LayoutGrid,
  Copy,
  Sun,
  Palette,
  Moon,
  Heart,
  Grid2X2,
  Repeat,
  Package,
  ChevronDown,
} from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';
import { LuxsBrand } from './LuxsBrand';

export type AppTheme = 'luminous' | 'blush' | 'noir';

interface StudioHeaderProps {
  aspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onCancel: () => void;
  onSavePng: () => void;
  onSaveAllZip: () => void;
  onCopyImage: () => void;
  isSaving: boolean;
  isSavingAll: boolean;
  isCopying: boolean;
  onOpenContactSheet: () => void;
  onOpenCollage: () => void;
  onOpenLiveLoop: () => void;
  onOpenPrintModal: () => void;
  onOpenProModal: () => void;
  theme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  favoritedCount: number;
  currentTimestamp?: number;
  currentIndex?: number;
  totalFrames?: number;
}

const RATIOS: { id: AspectRatio; label: string }[] = [
  { id: 'original', label: '原寸' },
  { id: '4:5', label: '4:5' },
  { id: '1:1', label: '1:1' },
  { id: '9:16', label: '9:16' },
];

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  aspectRatio,
  onSelectAspectRatio,
  onCancel,
  onSavePng,
  onSaveAllZip,
  onCopyImage,
  isSaving,
  isSavingAll,
  isCopying,
  onOpenContactSheet,
  onOpenCollage,
  onOpenLiveLoop,
  onOpenPrintModal,
  onOpenProModal,
  theme,
  onSelectTheme,
  favoritedCount,
  currentTimestamp,
  currentIndex,
  totalFrames,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsMenuOpen]);

  return (
    <header className="w-full h-14 px-3 sm:px-5 flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface)] z-30 select-none transition-colors duration-200 shrink-0">
      {/* Left: Brand + Exit + Instrument Metrology Readout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LuxsBrand compact={true} showStatus={false} />

        <div className="h-4 w-px bg-[var(--surface-border)]" />

        {/* Cancel / Return to Entry */}
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] tactile-btn cursor-pointer"
          title="Esc"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">閉じる</span>
        </button>

        {/* Precision Metrology Pill (FRM & Timestamp) */}
        {currentIndex !== undefined && totalFrames !== undefined && (
          <div className="hidden md:flex items-center gap-2 py-1 px-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--surface-border)] text-[11px] font-mono text-[var(--foreground-muted)] tabular-numbers">
            <span className="text-[var(--foreground)] font-medium">
              FRM {currentIndex + 1}
              <span className="opacity-40">/{totalFrames}</span>
            </span>
            {currentTimestamp !== undefined && (
              <>
                <span className="opacity-30">|</span>
                <span>{currentTimestamp.toFixed(2)}s</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Aspect Ratio Selector */}
      <div className="hidden sm:flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)]">
        {RATIOS.map((r) => {
          const isSelected = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelectAspectRatio(r.id);
                triggerHapticTick(950, 0.02);
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Right: Tools & Export Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Contact Sheet (All Frames Grid) Button */}
        <button
          type="button"
          onClick={onOpenContactSheet}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] bg-[var(--surface-subtle)] border border-[var(--surface-border)] tactile-btn cursor-pointer shadow-2xs"
          title="全コマ一覧"
        >
          <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden md:inline">全コマ一覧</span>
          {favoritedCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-1.5 py-0.2 rounded-full border border-[var(--accent-primary)]/30">
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span className="tabular-numbers">{favoritedCount}</span>
            </span>
          )}
        </button>

        {/* Creation & Products Consolidated Menu */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsToolsMenuOpen(!isToolsMenuOpen);
              triggerHapticTick(1000, 0.02);
            }}
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border tactile-btn cursor-pointer shadow-2xs ${
              isToolsMenuOpen
                ? 'bg-[var(--surface-hover)] border-[var(--accent-primary)] text-[var(--foreground)]'
                : 'bg-[var(--surface-subtle)] border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
            title="組写真・ループ動画・プリント"
          >
            <span>作成</span>
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isToolsMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 animate-fadeIn text-[var(--foreground)]">
              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenCollage();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-hover)] text-left cursor-pointer transition-colors"
              >
                <Grid2X2 className="w-4 h-4 opacity-70" />
                <div>
                  <div className="font-medium">組写真</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">複数コマを1枚に配置</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenLiveLoop();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-hover)] text-left cursor-pointer transition-colors"
              >
                <Repeat className="w-4 h-4 opacity-70" />
                <div>
                  <div className="font-medium">ループ動画</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">Live Photo風ショートループ</div>
                </div>
              </button>

              <div className="my-1 border-t border-[var(--surface-border)]" />

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenPrintModal();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--surface-hover)] text-left cursor-pointer transition-colors"
              >
                <Package className="w-4 h-4 opacity-70" />
                <div>
                  <div className="font-medium">プリント注文</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">アクリルやカード印刷</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-[var(--surface-border)] hidden sm:block" />

        {/* PRO Upgrade Button */}
        <button
          type="button"
          onClick={onOpenProModal}
          className="hidden sm:flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold text-[var(--foreground)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] tactile-btn cursor-pointer shadow-2xs"
          title="PROプランの特典を確認"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
          <span>PRO</span>
        </button>

        {/* Theme Switcher Segment */}
        <div className="hidden sm:flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)]">
          <button
            type="button"
            onClick={() => {
              onSelectTheme('luminous');
              triggerHapticTick(1000, 0.02);
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              theme === 'luminous'
                ? 'bg-[var(--surface)] text-amber-600 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ルミナス（ウォームライト）"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectTheme('blush');
              triggerHapticTick(1000, 0.02);
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              theme === 'blush'
                ? 'bg-[var(--surface)] text-rose-500 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ブラッシュ（血色ニュアンス）"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectTheme('noir');
              triggerHapticTick(1000, 0.02);
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              theme === 'noir'
                ? 'bg-[var(--surface)] text-stone-300 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ノワール（スタジオ暗室）"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[var(--surface-border)]" />

        {/* Copy Image Button */}
        <button
          type="button"
          onClick={onCopyImage}
          disabled={isCopying}
          className="hidden md:flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] tactile-btn cursor-pointer shadow-2xs disabled:opacity-50"
          title="クリップボードに画像をコピー"
        >
          <Copy className="w-3.5 h-3.5 opacity-70" />
          <span>{isCopying ? 'コピー中...' : 'コピー'}</span>
        </button>

        {/* Zip Download */}
        <button
          type="button"
          onClick={onSaveAllZip}
          disabled={isSavingAll}
          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] tactile-btn cursor-pointer"
          title="全コマ一括保存（ZIP）"
        >
          <Archive className="w-4 h-4" />
        </button>

        {/* Primary Save Button */}
        <button
          type="button"
          onClick={onSavePng}
          disabled={isSaving}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] tactile-btn shadow-sm cursor-pointer disabled:opacity-50"
          title="Enter"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>{isSaving ? '保存中...' : '保存'}</span>
        </button>
      </div>
    </header>
  );
};

