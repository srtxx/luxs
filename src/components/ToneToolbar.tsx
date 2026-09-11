'use client';

import React from 'react';
import { EnhancementSettings } from '@/lib/image-enhancer';
import { triggerHapticTick } from '@/lib/haptics';

export type TonePreset = 'natural' | 'clear' | 'rosy' | 'pale' | 'film' | 'monochrome' | 'original';

export interface ToneConfig {
  id: TonePreset;
  label: string;
  swatchClass: string;
  settings: EnhancementSettings | null;
}

export const TONE_PRESETS: ToneConfig[] = [
  {
    id: 'natural',
    label: 'ナチュラル',
    swatchClass: 'bg-gradient-to-tr from-amber-200 via-orange-100 to-rose-200',
    settings: {
      sharpness: 55,
      clarity: 35,
      brightness: 5,
      contrast: 7,
      saturation: 8,
      smoothSkin: 15,
      warmth: 3,
      rose: 6,
      upscale: 2,
    },
  },
  {
    id: 'clear',
    label: 'クリア',
    swatchClass: 'bg-gradient-to-tr from-sky-400 to-indigo-300',
    settings: {
      sharpness: 65,
      clarity: 45,
      brightness: 6,
      contrast: 9,
      saturation: 6,
      smoothSkin: 10,
      warmth: -2,
      rose: 4,
      upscale: 2,
    },
  },
  {
    id: 'rosy',
    label: 'ロージー',
    swatchClass: 'bg-gradient-to-tr from-rose-300 via-pink-200 to-amber-100',
    settings: {
      sharpness: 55,
      clarity: 35,
      brightness: 5,
      contrast: 8,
      saturation: 8,
      smoothSkin: 18,
      warmth: 5,
      rose: 14,
      upscale: 2,
    },
  },
  {
    id: 'pale',
    label: 'ペール',
    swatchClass: 'bg-gradient-to-tr from-sky-200 via-stone-100 to-rose-100',
    settings: {
      sharpness: 55,
      clarity: 30,
      brightness: 7,
      contrast: 5,
      saturation: -3,
      smoothSkin: 15,
      warmth: -3,
      rose: 6,
      upscale: 2,
    },
  },
  {
    id: 'film',
    label: 'フィルム',
    swatchClass: 'bg-gradient-to-tr from-amber-600 to-rose-400',
    settings: {
      sharpness: 60,
      clarity: 45,
      brightness: -2,
      contrast: 14,
      saturation: -6,
      smoothSkin: 10,
      upscale: 2,
    },
  },
  {
    id: 'monochrome',
    label: 'モノクロ',
    swatchClass: 'bg-gradient-to-tr from-stone-200 to-stone-800',
    settings: {
      sharpness: 75,
      clarity: 55,
      brightness: 2,
      contrast: 18,
      saturation: -100,
      smoothSkin: 10,
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

type TuningParam = 'intensity' | 'skin' | 'brightness';

interface ToneToolbarProps {
  currentTone: TonePreset;
  onSelectTone: (tone: TonePreset) => void;
  toneIntensity: number; // 0 to 100
  onChangeIntensity: (intensity: number) => void;
  smoothSkinOffset?: number; // -20 to +40
  onChangeSmoothSkin?: (offset: number) => void;
  brightnessOffset?: number; // -20 to +20
  onChangeBrightness?: (offset: number) => void;
}

export const ToneToolbar: React.FC<ToneToolbarProps> = ({
  currentTone,
  onSelectTone,
  toneIntensity,
  onChangeIntensity,
  smoothSkinOffset = 0,
  onChangeSmoothSkin,
  brightnessOffset = 0,
  onChangeBrightness,
}) => {
  const [activeParam, setActiveParam] = React.useState<TuningParam>('intensity');
  const isOriginal = currentTone === 'original';

  const handleToneClick = (toneId: TonePreset) => {
    onSelectTone(toneId);
    triggerHapticTick(1100, 0.04);
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Upper row: Tuning Parameter Switcher & Fine-tune Slider */}
      {!isOriginal && (
        <div className="flex items-center justify-between gap-2.5 px-1 sm:px-2 text-xs text-[var(--foreground-muted)] animate-fadeIn">
          {/* Tuning Parameter Switcher Chips */}
          <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)] shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveParam('intensity');
                triggerHapticTick(900, 0.02);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                activeParam === 'intensity'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              強さ
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveParam('skin');
                triggerHapticTick(900, 0.02);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                activeParam === 'skin'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              美肌
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveParam('brightness');
                triggerHapticTick(900, 0.02);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                activeParam === 'brightness'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              明るさ
            </button>
          </div>

          {/* Active Slider Input */}
          <div className="flex-1 max-w-xs flex items-center gap-2">
            {activeParam === 'intensity' && (
              <>
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
              </>
            )}

            {activeParam === 'skin' && onChangeSmoothSkin && (
              <>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  step="5"
                  value={smoothSkinOffset}
                  onChange={(e) => {
                    onChangeSmoothSkin(parseInt(e.target.value, 10));
                    triggerHapticTick(850, 0.02);
                  }}
                  className="w-full h-1.5 bg-[var(--surface-border)] rounded-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-[var(--foreground-muted)] w-8 text-right tabular-numbers font-medium">
                  {smoothSkinOffset > 0 ? `+${smoothSkinOffset}` : smoothSkinOffset}
                </span>
              </>
            )}

            {activeParam === 'brightness' && onChangeBrightness && (
              <>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="2"
                  value={brightnessOffset}
                  onChange={(e) => {
                    onChangeBrightness(parseInt(e.target.value, 10));
                    triggerHapticTick(850, 0.02);
                  }}
                  className="w-full h-1.5 bg-[var(--surface-border)] rounded-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-[var(--foreground-muted)] w-8 text-right tabular-numbers font-medium">
                  {brightnessOffset > 0 ? `+${brightnessOffset}` : brightnessOffset}
                </span>
              </>
            )}
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
