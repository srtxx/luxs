'use client';

import React, { useRef, useEffect } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Sparkles, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface TactileRibbonProps {
  frames: BurstFrame[];
  selectedFrameId: string;
  onSelectFrame: (frameId: string) => void;
  favoritedIds: string[];
}

export const TactileRibbon: React.FC<TactileRibbonProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
  favoritedIds,
}) => {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active thumbnail into view smoothly
  useEffect(() => {
    if (activeItemRef.current && ribbonRef.current) {
      const container = ribbonRef.current;
      const element = activeItemRef.current;
      const offsetLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      container.scrollTo({
        left: offsetLeft,
        behavior: 'smooth',
      });
    }
  }, [selectedFrameId]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        onSelectFrame(frames[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && currentIndex < frames.length - 1) {
        e.preventDefault();
        onSelectFrame(frames[currentIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames, selectedFrameId, onSelectFrame]);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);

  const handleJumpPrev = () => {
    if (currentIndex > 0) onSelectFrame(frames[currentIndex - 1].id);
  };

  const handleJumpNext = () => {
    if (currentIndex < frames.length - 1) onSelectFrame(frames[currentIndex + 1].id);
  };

  // Find next/prev top peak frame (ranks 1..3)
  const peakFrames = frames
    .map((f, idx) => ({ frame: f, index: idx }))
    .filter((item) => item.frame.rank && item.frame.rank <= 3)
    .sort((a, b) => a.index - b.index);

  const handleJumpPeak = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      const nextPeak = peakFrames.find((p) => p.index > currentIndex);
      if (nextPeak) onSelectFrame(nextPeak.frame.id);
      else if (peakFrames.length > 0) onSelectFrame(peakFrames[0].frame.id);
    } else {
      const prevPeak = [...peakFrames].reverse().find((p) => p.index < currentIndex);
      if (prevPeak) onSelectFrame(prevPeak.frame.id);
      else if (peakFrames.length > 0) onSelectFrame(peakFrames[peakFrames.length - 1].frame.id);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2 select-none">
      {/* Ribbon Header Navigation */}
      <div className="flex items-center justify-between px-2 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span className="font-serif-brand tracking-wider uppercase text-stone-800 font-semibold">
            タイムライン
          </span>
          <span className="text-[11px] text-stone-400">
            {currentIndex + 1} / {frames.length} コマ
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleJumpPeak('prev')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 hover:bg-stone-100 border border-stone-200/80 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer"
            title="前の奇跡の瞬間へジャンプ"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>前の瞬間</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpPeak('next')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 hover:bg-stone-100 border border-stone-200/80 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer"
            title="次の奇跡の瞬間へジャンプ"
          >
            <span>次の瞬間</span>
            <Sparkles className="w-3 h-3 text-amber-600" />
          </button>
        </div>
      </div>

      {/* Ribbon Track with Prev/Next buttons */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleJumpPrev}
          disabled={currentIndex === 0}
          className="absolute -left-3 z-10 p-1.5 rounded-full bg-white/95 shadow-md border border-stone-200 text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Filmstrip Ribbon */}
        <div
          ref={ribbonRef}
          className="w-full flex items-center gap-2 overflow-x-auto py-2 px-6 scroll-smooth"
        >
          {frames.map((frame, index) => {
            const isSelected = frame.id === selectedFrameId;
            const isPeak = frame.rank && frame.rank <= 3;
            const isFav = favoritedIds.includes(frame.id);

            return (
              <button
                key={frame.id}
                ref={isSelected ? activeItemRef : null}
                type="button"
                onClick={() => onSelectFrame(frame.id)}
                className={`relative shrink-0 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-stone-900 shadow-lg scale-105 z-10'
                    : 'opacity-70 hover:opacity-100 hover:scale-102 ring-1 ring-stone-200'
                } w-14 h-20 sm:w-16 sm:h-22 bg-stone-900`}
              >
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Golden Pearl Pin for Top 3 Peaks */}
                {isPeak && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 shadow-sm flex items-center justify-center border border-white/60">
                    <Sparkles className="w-2.5 h-2.5 text-amber-950" />
                  </div>
                )}

                {/* Heart badge if favorited */}
                {isFav && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500/90 flex items-center justify-center shadow-xs">
                    <Heart className="w-2 h-2 fill-white text-white" />
                  </div>
                )}

                {/* Timestamp watermark on bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-0.5 px-1 text-[9px] text-white/90 font-mono text-center">
                  {frame.timestamp.toFixed(2)}s
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleJumpNext}
          disabled={currentIndex === frames.length - 1}
          className="absolute -right-3 z-10 p-1.5 rounded-full bg-white/95 shadow-md border border-stone-200 text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
