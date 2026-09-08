'use client';

import React, { useState } from 'react';
import { Sparkles, Download, Archive, Gift, SlidersHorizontal } from 'lucide-react';
import { EnhancementSettings } from '@/lib/image-enhancer';

export type AuraStyle = 'natural' | 'etoile' | 'cinema' | 'noir';
export type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';

export interface StyleConfig {
  id: AuraStyle;
  name: string;
  subtitle: string;
  settings: EnhancementSettings;
}

export const AURA_STYLES: StyleConfig[] = [
  {
    id: 'natural',
    name: 'Natural',
    subtitle: '素肌感・クリア',
    settings: {
      sharpness: 50,
      clarity: 35,
      brightness: 4,
      contrast: 8,
      saturation: 6,
      smoothSkin: 25,
      upscale: 2,
    },
  },
  {
    id: 'etoile',
    name: 'Étoile',
    subtitle: '透明感・ハイライト',
    settings: {
      sharpness: 65,
      clarity: 45,
      brightness: 8,
      contrast: 12,
      saturation: 14,
      smoothSkin: 35,
      upscale: 2,
    },
  },
  {
    id: 'cinema',
    name: 'Cinéma',
    subtitle: '情緒フィルム調',
    settings: {
      sharpness: 55,
      clarity: 45,
      brightness: -2,
      contrast: 15,
      saturation: -6,
      smoothSkin: 20,
      upscale: 2,
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    subtitle: '陰影モノクロ',
    settings: {
      sharpness: 70,
      clarity: 55,
      brightness: 2,
      contrast: 20,
      saturation: -100,
      smoothSkin: 15,
      upscale: 2,
    },
  },
];

interface AuraFinishesBarProps {
  currentStyle: AuraStyle;
  onSelectStyle: (style: AuraStyle) => void;
  aspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onSavePng: () => void;
  onOpenPrintModal: () => void;
  onSaveAllZip: () => void;
  isDownloading: boolean;
  isDownloadingAll: boolean;
  allDownloadProgress?: number;
  fineTuneSettings: EnhancementSettings;
  onChangeFineTune: (settings: EnhancementSettings) => void;
}

export const AuraFinishesBar: React.FC<AuraFinishesBarProps> = ({
  currentStyle,
  onSelectStyle,
  aspectRatio,
  onSelectAspectRatio,
  onSavePng,
  onOpenPrintModal,
  onSaveAllZip,
  isDownloading,
  isDownloadingAll,
  fineTuneSettings,
  onChangeFineTune,
}) => {
  const [showFineTune, setShowFineTune] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 select-none">
      {/* Fine-tune panel (collapsed by default to prevent visual fatigue) */}
      {showFineTune && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-sm animate-fadeIn border border-stone-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-800 tracking-wide">
              光と輪郭の微調整
            </span>
            <button
              type="button"
              onClick={() => {
                const base = AURA_STYLES.find((s) => s.id === currentStyle)?.settings;
                if (base) onChangeFineTune({ ...base });
              }}
              className="text-[11px] text-stone-500 hover:text-stone-800 transition-colors"
            >
              初期値に戻す
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>明るさ</span>
                <span className="font-mono text-stone-400">{fineTuneSettings.brightness > 0 ? `+${fineTuneSettings.brightness}` : fineTuneSettings.brightness}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={fineTuneSettings.brightness}
                onChange={(e) =>
                  onChangeFineTune({ ...fineTuneSettings, brightness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-700 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>コントラスト</span>
                <span className="font-mono text-stone-400">{fineTuneSettings.contrast > 0 ? `+${fineTuneSettings.contrast}` : fineTuneSettings.contrast}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                value={fineTuneSettings.contrast}
                onChange={(e) =>
                  onChangeFineTune({ ...fineTuneSettings, contrast: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-700 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>瞳・輪郭の鮮明度</span>
                <span className="font-mono text-stone-400">{fineTuneSettings.sharpness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fineTuneSettings.sharpness}
                onChange={(e) =>
                  onChangeFineTune({ ...fineTuneSettings, sharpness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-700 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main floating dock */}
      <div className="glass-panel rounded-2xl sm:rounded-full p-2.5 sm:px-4 sm:py-2.5 shadow-lg border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: 4 1-Tap Aura Finishes */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1 hidden md:inline">
            AURA:
          </span>
          {AURA_STYLES.map((style) => {
            const isSelected = currentStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onSelectStyle(style.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm ring-1 ring-stone-900'
                    : 'bg-white/80 text-stone-700 hover:bg-stone-100/90 border border-stone-200/60'
                }`}
              >
                {isSelected && <Sparkles className="w-3 h-3 text-amber-300" />}
                <span>{style.name}</span>
                <span className={`text-[10px] hidden lg:inline ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                  {style.subtitle}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowFineTune(!showFineTune)}
            className={`p-1.5 rounded-full text-xs border transition-all cursor-pointer ${
              showFineTune
                ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                : 'bg-white/80 border-stone-200/60 text-stone-500 hover:text-stone-800'
            }`}
            title="光の微調整"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Ratio Select */}
        <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-full border border-stone-200/60 text-xs">
          {(['original', '1:1', '4:5', '9:16'] as AspectRatio[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onSelectAspectRatio(r)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                aspectRatio === r
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {r === 'original' ? '原寸' : r}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* AURA PRINT */}
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 hover:from-amber-200 hover:to-orange-200 border border-amber-200/80 shadow-xs transition-all cursor-pointer shrink-0"
            title="アクリルブロックやウッド額装として形に残す"
          >
            <Gift className="w-3.5 h-3.5 text-amber-800" />
            <span>形に残す</span>
          </button>

          {/* Download Photo */}
          <button
            type="button"
            onClick={onSavePng}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-stone-200" />
            <span>{isDownloading ? '保存中...' : '写真を保存'}</span>
          </button>

          {/* Download All (ZIP) */}
          <button
            type="button"
            onClick={onSaveAllZip}
            disabled={isDownloadingAll}
            className="p-1.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/60 transition-all cursor-pointer shrink-0"
            title="全コマ一括保存（ZIP）"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
