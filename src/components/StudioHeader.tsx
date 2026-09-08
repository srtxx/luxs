'use client';

import React from 'react';
import { AspectRatio } from './StudioCanvas';
import {
  Download,
  Archive,
  X,
  LayoutGrid,
  Columns2,
  Compass,
  LayoutTemplate,
} from 'lucide-react';

interface StudioHeaderProps {
  aspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onCancel: () => void;
  onSavePng: () => void;
  onSaveAllZip: () => void;
  isSaving: boolean;
  isSavingAll: boolean;
  onOpenContactSheet: () => void;
  onOpenCompare: () => void;
  onOpenDeck: () => void;
  onOpenFourCut: () => void;
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
  isSaving,
  isSavingAll,
  onOpenContactSheet,
  onOpenCompare,
  onOpenDeck,
  onOpenFourCut,
}) => {
  return (
    <header className="w-full h-13 px-3 sm:px-6 flex items-center justify-between border-b border-[#202020] bg-[#0C0C0C] z-30 select-none">
      {/* Left: Cancel & Discovery Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-medium text-stone-400 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          title="Esc"
        >
          <X className="w-4 h-4" />
          <span className="hidden lg:inline">キャンセル</span>
        </button>

        <div className="h-4 w-px bg-[#262626] hidden sm:block" />

        {/* Discovery Tools Bar */}
        <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-lg border border-[#262626]">
          <button
            type="button"
            onClick={onOpenContactSheet}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-stone-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="全フレーム一覧"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">一覧</span>
          </button>

          <button
            type="button"
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-stone-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="2コマ決選比較"
          >
            <Columns2 className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">比較</span>
          </button>

          <button
            type="button"
            onClick={onOpenDeck}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-300 hover:text-amber-200 hover:bg-[#262626] transition-colors cursor-pointer"
            title="おすすめ候補デッキ"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">おすすめ</span>
          </button>

          <button
            type="button"
            onClick={onOpenFourCut}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-stone-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="4カットフォト作成"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">4カット</span>
          </button>
        </div>
      </div>

      {/* Center: Aspect Ratio Selector */}
      <div className="hidden md:flex items-center gap-0.5 bg-[#171717] p-0.5 rounded-lg border border-[#262626]">
        {RATIOS.map((r) => {
          const isSelected = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectAspectRatio(r.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#2A2A2A] text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Right: Export Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveAllZip}
          disabled={isSavingAll}
          className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          title="全コマ一括保存（ZIP）"
        >
          <Archive className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSavePng}
          disabled={isSaving}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-md text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          title="Enter"
        >
          <Download className="w-3.5 h-3.5 text-black" />
          <span>{isSaving ? '保存中...' : '保存'}</span>
        </button>
      </div>
    </header>
  );
};
