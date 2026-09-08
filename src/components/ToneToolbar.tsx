'use client';

import React from 'react';
import { EnhancementSettings } from '@/lib/image-enhancer';
import { Package, Sliders } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

export type TonePreset = 'clear' | 'natural' | 'film' | 'monochrome' | 'original';

export interface ToneConfig {
  id: TonePreset;
  label: string;
  swatchClass: string;
  settings: EnhancementSettings | null;
}

export const TONE_PRESETS: ToneConfig[] = [
  {
    id: 'clear',
    label: 'クリア',
    swatchClass: 'bg-gradient-to-tr from-sky-400 to-indigo-300',
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
    swatchClass: 'bg-gradient-to-tr from-amber-400 to-orange-300',
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
    swatchClass: 'bg-gradient-to-tr from-stone-200 to-stone-900',
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
    swatchClass: 'border border-stone-400 bg-transparent',
    settings: null,
  },
];

interface ToneToolbarProps {
  currentTone: TonePreset;
  onSelectTone: (tone: TonePreset) => void;
  toneIntensity: number; // 0 to 100
  onChangeIntensity: (intensity: number) => void;
  onOpenPrintModal: () => void;
}

export const ToneToolbar: React.FC<ToneToolbarProps> = ({
  currentTone,
  onSelectTone,
  toneIntensity,
  onChangeIntensity,
  onOpenPrintModal,
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
        <div className="flex items-center justify-between gap-3 px-2 text-xs text-stone-400 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sliders className="w-3 h-3 text-stone-500" />
            <span>強さ</span>
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
              className="w-full h-1 bg-[#262626] rounded-full accent-white cursor-pointer"
            />
            <span className="text-[11px] font-mono text-stone-400 w-8 text-right tabular-numbers">
              {toneIntensity}%
            </span>
          </div>
        </div>
      )}

      {/* Lower row: 1-Tap Tone Swatches + Print Button */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {TONE_PRESETS.map((tone) => {
            const isSelected = currentTone === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => handleToneClick(tone.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#262626] text-white border-stone-500 shadow-xs'
                    : 'bg-[#151515] text-stone-400 hover:text-stone-200 hover:bg-[#1E1E1E] border-[#242424]'
                }`}
              >
                {/* Visual mood swatch dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${tone.swatchClass} shadow-2xs`} />
                <span>{tone.label}</span>
              </button>
            );
          })}
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={onOpenPrintModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-[#181818] hover:bg-[#242424] border border-[#2A2A2A] transition-colors cursor-pointer shrink-0 shadow-xs"
          title="アクリルブロックやカードとしてプリント注文"
        >
          <Package className="w-3.5 h-3.5 text-stone-400" />
          <span>プリント</span>
        </button>
      </div>
    </div>
  );
};
