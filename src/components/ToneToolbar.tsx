'use client';

import React from 'react';
import { EnhancementSettings } from '@/lib/image-enhancer';
import { Package } from 'lucide-react';

export type TonePreset = 'original' | 'clear' | 'natural' | 'film' | 'monochrome';

export interface ToneConfig {
  id: TonePreset;
  label: string;
  settings: EnhancementSettings | null; // null means no enhancement (original)
}

export const TONE_PRESETS: ToneConfig[] = [
  {
    id: 'clear',
    label: 'クリア',
    settings: {
      sharpness: 60,
      clarity: 40,
      brightness: 6,
      contrast: 10,
      saturation: 10,
      smoothSkin: 30,
      upscale: 2,
    },
  },
  {
    id: 'natural',
    label: 'ナチュラル',
    settings: {
      sharpness: 50,
      clarity: 30,
      brightness: 3,
      contrast: 6,
      saturation: 5,
      smoothSkin: 20,
      upscale: 2,
    },
  },
  {
    id: 'film',
    label: 'フィルム',
    settings: {
      sharpness: 55,
      clarity: 45,
      brightness: -2,
      contrast: 14,
      saturation: -6,
      smoothSkin: 15,
      upscale: 2,
    },
  },
  {
    id: 'monochrome',
    label: 'モノクロ',
    settings: {
      sharpness: 70,
      clarity: 50,
      brightness: 2,
      contrast: 18,
      saturation: -100,
      smoothSkin: 15,
      upscale: 2,
    },
  },
  {
    id: 'original',
    label: '原画',
    settings: null,
  },
];

interface ToneToolbarProps {
  currentTone: TonePreset;
  onSelectTone: (tone: TonePreset) => void;
  onOpenPrintModal: () => void;
}

export const ToneToolbar: React.FC<ToneToolbarProps> = ({
  currentTone,
  onSelectTone,
  onOpenPrintModal,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-2 px-1 select-none">
      {/* 1-Tap Tone Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {TONE_PRESETS.map((tone) => {
          const isSelected = currentTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onSelectTone(tone.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#2A2A2A] text-white border border-[#444444] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#1A1A1A]'
              }`}
            >
              {tone.label}
            </button>
          );
        })}
      </div>

      {/* Physical Print CTA */}
      <button
        type="button"
        onClick={onOpenPrintModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] transition-colors cursor-pointer shrink-0"
        title="アクリルブロックやカードとしてプリント注文"
      >
        <Package className="w-3.5 h-3.5 text-stone-400" />
        <span>プリント</span>
      </button>
    </div>
  );
};
