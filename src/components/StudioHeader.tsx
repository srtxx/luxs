'use client';

import React from 'react';
import { AspectRatio } from './StudioCanvas';
import { Download, Archive, X, LayoutGrid, Copy, Sun, Palette, Moon, Heart, Grid2X2, Repeat } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

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
  theme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  favoritedCount: number;
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
  theme,
  onSelectTheme,
  favoritedCount,
}) => {
  return (
    <header className="w-full h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface)] z-30 select-none transition-colors duration-200">
      {/* Left: Cancel & Contact Sheet Trigger & Favorites Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          title="Esc"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">閉じる</span>
        </button>

        <div className="h-4 w-px bg-[var(--surface-border)]" />

        {/* Contact Sheet (All Frames Grid) Button */}
        <button
          type="button"
          onClick={onOpenContactSheet}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] bg-[var(--surface-subtle)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs"
          title="全コマ一覧（コンタクトシート）"
        >
          <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
          <span>全コマ一覧</span>
        </button>

        {/* Favorite Counter Pill */}
        {favoritedCount > 0 && (
          <button
            type="button"
            onClick={onOpenContactSheet}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-medium text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/30 transition-colors cursor-pointer shadow-2xs"
            title="保存候補一覧を表示"
          >
            <Heart className="w-3 h-3 fill-current" />
            <span className="tabular-numbers font-medium">{favoritedCount}</span>
          </button>
        )}

        {/* Collage (組写真) Button */}
        <button
          type="button"
          onClick={onOpenCollage}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] bg-[var(--surface-subtle)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs"
          title="お気に入りコマで組写真（コラージュ）を作成"
        >
          <Grid2X2 className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden md:inline">組写真</span>
        </button>

        {/* Live Loop (ループ動画) Button */}
        <button
          type="button"
          onClick={onOpenLiveLoop}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] bg-[var(--surface-subtle)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs"
          title="Live Photo風ループ動画を書き出し"
        >
          <Repeat className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden md:inline">ループ動画</span>
        </button>
      </div>

      {/* Center: Aspect Ratio Selector */}
      <div className="hidden lg:flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)]">
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

      {/* Right: Theme Switcher & Export Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Segment */}
        <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)]">
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
            title="ルミナス（上品なウォームライト）"
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
            title="ブラッシュ（やわらかな血色ニュアンス）"
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
            title="ノワール（シックなスタジオダーク）"
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
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          title="クリップボードに画像をコピー"
        >
          <Copy className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden sm:inline">{isCopying ? 'コピー中...' : 'コピー'}</span>
        </button>

        {/* Zip Download */}
        <button
          type="button"
          onClick={onSaveAllZip}
          disabled={isSavingAll}
          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          title="全コマ一括保存（ZIP）"
        >
          <Archive className="w-4 h-4" />
        </button>

        {/* Primary Save Button */}
        <button
          type="button"
          onClick={onSavePng}
          disabled={isSaving}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          title="Enter"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>{isSaving ? '保存中...' : '保存'}</span>
        </button>
      </div>
    </header>
  );
};
