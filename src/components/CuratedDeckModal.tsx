'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Check, Heart, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

interface CuratedDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  recommendedIndices: number[];
  onSelectIndex: (index: number) => void;
  favoritedIds: string[];
  onToggleFavorite: (frameId: string) => void;
}

export const CuratedDeckModal: React.FC<CuratedDeckModalProps> = ({
  isOpen,
  onClose,
  frames,
  recommendedIndices,
  onSelectIndex,
  favoritedIds,
  onToggleFavorite,
}) => {
  // Use recommended frames if available, otherwise take first 5 frames
  const candidateIndices =
    recommendedIndices.length > 0
      ? recommendedIndices
      : frames.slice(0, 5).map((_, i) => i);

  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  const totalCandidates = candidateIndices.length;
  const currentFrameIndex = candidateIndices[activeDeckIndex] ?? 0;
  const currentFrame = frames[currentFrameIndex];

  const handlePrev = useCallback(() => {
    setActiveDeckIndex((prev) => (prev > 0 ? prev - 1 : totalCandidates - 1));
    triggerHapticTick(1100, 0.03);
  }, [totalCandidates]);

  const handleNext = useCallback(() => {
    setActiveDeckIndex((prev) => (prev < totalCandidates - 1 ? prev + 1 : 0));
    triggerHapticTick(1100, 0.03);
  }, [totalCandidates]);

  const handleAdopt = useCallback(() => {
    onSelectIndex(currentFrameIndex);
    triggerHapticTick(1400, 0.05);
    onClose();
  }, [onSelectIndex, currentFrameIndex, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Enter') {
        handleAdopt();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handlePrev, handleNext, handleAdopt]);

  if (!isOpen || !currentFrame) return null;

  const isFav = favoritedIds.includes(currentFrame.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#121212] rounded-2xl border border-[#242424] shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#161616]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-semibold tracking-wide text-white uppercase">
              おすすめ候補
            </h2>
            <span className="text-[11px] font-mono text-stone-400 tabular-nums">
              ({activeDeckIndex + 1} / {totalCandidates})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Card Stage */}
        <div className="relative flex-1 min-h-[50vh] sm:min-h-[58vh] bg-[#0A0A0A] p-6 flex items-center justify-center overflow-hidden">
          {/* Main Photo Card */}
          <div className="relative max-h-full max-w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
            <img
              src={currentFrame.dataUrl}
              alt=""
              className="max-h-[48vh] sm:max-h-[54vh] w-auto max-w-full object-contain pointer-events-none transition-all duration-200"
            />

            {/* Candidate Tag */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/75 border border-white/10 text-[10px] font-mono text-amber-300 backdrop-blur-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>おすすめ #{activeDeckIndex + 1}</span>
              <span className="text-stone-400">{currentFrame.timestamp.toFixed(2)}s</span>
            </div>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={() => onToggleFavorite(currentFrame.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                isFav
                  ? 'bg-rose-500/80 text-white'
                  : 'bg-black/60 text-stone-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/10 text-stone-300 hover:text-white hover:bg-black/80 transition-colors cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/10 text-stone-300 hover:text-white hover:bg-black/80 transition-colors cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Selector Strip */}
        <div className="px-5 py-3 border-t border-[#202020] bg-[#141414] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {candidateIndices.map((idx, cardIdx) => {
              const f = frames[idx];
              if (!f) return null;
              const isSelected = cardIdx === activeDeckIndex;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveDeckIndex(cardIdx);
                    triggerHapticTick(1100, 0.03);
                  }}
                  className={`relative w-11 h-11 rounded-md overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                      : 'border-[#262626] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={f.dataUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold text-white bg-black/70 px-0.5 rounded leading-none">
                    #{cardIdx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Adopt Button */}
          <button
            type="button"
            onClick={handleAdopt}
            className="shrink-0 flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            この写真を選択
          </button>
        </div>
      </div>
    </div>
  );
};
