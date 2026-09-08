'use client';

import React from 'react';
import { EnhancementSettings } from '@/lib/image-enhancer';
import { Sliders } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

export type TonePreset = 'rosy' | 'pale' | 'glow' | 'clear' | 'film' | 'monochrome' | 'original';

export interface ToneConfig {
  id: TonePreset;
  label: string;
  swatchClass: string;
  settings: EnhancementSettings | null;
}

export const TONE_PRESETS: ToneConfig[] = [
  {
    id: 'rosy',
    label: 'ロージー',
    swatchClass: 'bg-gradient-to-tr from-rose-300 via-pink-200 to-amber-100',
    settings: {
      sharpness: 50,
      clarity: 30,
      brightness: 5,
      contrast: 8,
      saturation: 8,
      smoothSkin: 40,
      warmth: 8,
      rose: 16,
      upscale: 2,
    },
  },
  {
    id: 'pale',
    label: 'ペール',
    swatchClass: 'bg-gradient-to-tr from-sky-200 via-stone-100 to-rose-100',
    settings: {
      sharpness: 45,
      clarity: 25,
      brightness: 7,
      contrast: 4,
      saturation: -4,
      smoothSkin: 35,
      warmth: -4,
      rose: 6,
      upscale: 2,
    },
  },
  {
    id: 'glow',
    label: 'グロウ',
    swatchClass: 'bg-gradient-to-tr from-amber-200 via-orange-100 to-rose-200',
    settings: {
      sharpness: 40,
      clarity: 20,
      brightness: 6,
      contrast: 6,
      saturation: 10,
      smoothSkin: 55,
      warmth: 6,
      rose: 10,
      upscale: 2,
    },
  },
  {
    id: 'clear',
    label: 'クリア',
    swatchClass: 'bg-gradient-to-tr from-sky-400 to-indigo-300',
    settings: {
      sharpness: 60,
      clarity: 40,
      brightness: 5,
      contrast: 10,
      saturation: 10,
      smoothSkin: 25,
      upscale: 2,
    },
  },
  {
    id: 'film',
    label: 'フィルム',
    swatchClass: 'bg-gradient-to-tr from-amber-600 to-rose-400',
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
    swatchClass: 'bg-gradient-to-tr from-stone-200 to-stone-800',
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
    swatchClass: 'border border-[var(--surface-border-strong)] bg-transparent',
    settings: null,
  },
];

interface ToneToolbarProps {
  currentTone: TonePreset;
  onSelectTone: (tone: TonePreset) => void;
  toneIntensity: number; // 0 to 100
  onChangeIntensity: (intensity: number) => void;
}

export const ToneToolbar: React.FC<ToneToolbarProps> = ({
  currentTone,
  onSelectTone,
  toneIntensity,
  onChangeIntensity,
}) => {
  const isOriginal = currentTone === 'original';

  const handleToneClick = (toneId: TonePreset) => {
    onSelectTone(toneId);
    triggerHapticTick(1100, 0.04);
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Upper row: Intensity slider (appears when a filter is active) */}
      {!isOriginal && (
        <div className="flex items-center justify-between gap-3 px-2 text-xs text-[var(--foreground-muted)] animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Sliders className="w-3.5 h-3.5 opacity-70" />
            <span>補正の強さ</span>
          </div>

          <div className="flex-1 max-w-xs flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              value={toneIntensity}
              onChange={(e) => {
                onChangeIntensity(parseInt(e.target.value, 10));
                triggerHapticTick(850, 0.02);
              }}
              className="w-full h-1.5 bg-[var(--surface-border)] rounded-full accent-[var(--accent-primary)] cursor-pointer"
            />
            <span className="text-[11px] font-mono text-[var(--foreground-muted)] w-8 text-right tabular-numbers font-medium">
              {toneIntensity}%
            </span>
          </div>
        </div>
      )}

      {/* Lower row: 1-Tap Tone Swatches */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 px-1">
        {TONE_PRESETS.map((tone) => {
          const isSelected = currentTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => handleToneClick(tone.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 border tactile-btn ${
                isSelected
                  ? 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--accent-primary)] shadow-xs ring-1 ring-[var(--accent-primary)]/30'
                  : 'bg-[var(--surface-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] border-[var(--surface-border)]'
              }`}
            >
              {/* Visual mood swatch dot */}
              <div className={`w-2.5 h-2.5 rounded-full ${tone.swatchClass} shadow-2xs`} />
              <span>{tone.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
