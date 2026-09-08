'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { triggerHapticTick } from '@/lib/haptics';

interface TactileScrubberProps {
  frames: BurstFrame[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  recommendedIndices: number[];
  favoritedIds: string[];
}

export const TactileScrubber: React.FC<TactileScrubberProps> = ({
  frames,
  currentIndex,
  onIndexChange,
  recommendedIndices,
  favoritedIds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const targetIndexRef = useRef(currentIndex);
  const lastTickIndexRef = useRef(currentIndex);

  const totalFrames = frames.length;

  // Sync ref
  useEffect(() => {
    targetIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Compute frame index from pointer coordinate
  const calculateIndexFromPointer = useCallback(
    (clientX: number): number => {
      if (!containerRef.current || totalFrames === 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(relativeX, rect.width));
      const ratio = clampedX / rect.width;
      const rawIndex = Math.min(totalFrames - 1, Math.floor(ratio * totalFrames));

      // Magnetic snapping to recommended frames (within 1-frame distance)
      for (const recIdx of recommendedIndices) {
        if (Math.abs(rawIndex - recIdx) <= 1 && Math.abs(ratio - (recIdx + 0.5) / totalFrames) < 0.035) {
          return recIdx;
        }
      }
      return rawIndex;
    },
    [totalFrames, recommendedIndices]
  );

  const scheduleUpdate = useCallback(
    (newIndex: number) => {
      targetIndexRef.current = newIndex;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          const resolved = targetIndexRef.current;
          if (resolved !== lastTickIndexRef.current) {
            const isRec = recommendedIndices.includes(resolved);
            triggerHapticTick(isRec ? 1350 : 950, isRec ? 0.06 : 0.03);
            lastTickIndexRef.current = resolved;
            onIndexChange(resolved);
          }
          rafIdRef.current = null;
        });
      }
    },
    [onIndexChange, recommendedIndices]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const newIndex = calculateIndexFromPointer(e.clientX);
    scheduleUpdate(newIndex);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const newIndex = calculateIndexFromPointer(e.clientX);
    scheduleUpdate(newIndex);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
  };

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = Math.max(0, currentIndex - 1);
        triggerHapticTick(950, 0.03);
        onIndexChange(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(frames.length - 1, currentIndex + 1);
        triggerHapticTick(950, 0.03);
        onIndexChange(next);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, frames.length, onIndexChange]);

  const currentFrame = frames[currentIndex];

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none">
      {/* Timecode and Index Indicator */}
      <div className="w-full flex items-center justify-between px-1 text-xs text-stone-400 tabular-numbers">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-wider text-stone-300 font-medium">
            {currentFrame ? `${currentFrame.timestamp.toFixed(2)}s` : '0.00s'}
          </span>
          {recommendedIndices.includes(currentIndex) && (
            <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              おすすめ
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-stone-400">
          {currentIndex + 1} / {totalFrames}
        </span>
      </div>

      {/* Main Scrubber Film Track */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="w-full relative h-16 sm:h-20 bg-[#161616] rounded-xl overflow-hidden cursor-ew-resize flex items-center border border-[#2A2A2A] studio-elevation"
      >
        {/* Filmstrip Frame Sequence */}
        <div className="absolute inset-0 flex">
          {frames.map((frame, idx) => {
            const isRec = recommendedIndices.includes(idx);
            const isFav = favoritedIds.includes(frame.id);

            return (
              <div
                key={frame.id}
                style={{ width: `${100 / totalFrames}%` }}
                className="h-full relative shrink-0 border-r border-[#262626]/70 overflow-hidden"
              >
                <img
                  src={frame.dataUrl}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none opacity-65"
                  loading="lazy"
                  draggable={false}
                />

                {/* Recommended Indicator (Luminous dot with subtle halo) */}
                {isRec && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-2 h-2 rounded-full bg-white ring-2 ring-amber-300/60 shadow-[0_0_6px_rgba(255,255,255,0.9)] pointer-events-none" />
                )}

                {/* Favorite Dot Indicator */}
                {isFav && !isRec && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-rose-500 shadow-xs pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Physical Playhead Cursor */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none transition-transform duration-75 ease-out flex flex-col items-center justify-between z-20"
          style={{
            left: `${((currentIndex + 0.5) / totalFrames) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Top Notch Pip */}
          <div className="w-2.5 h-1 bg-white rounded-full shadow-xs -mt-0.5" />

          {/* Central Line */}
          <div className="w-[2.5px] h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] rounded-full" />

          {/* Bottom Notch Pip */}
          <div className="w-2.5 h-1 bg-white rounded-full shadow-xs -mb-0.5" />
        </div>
      </div>
    </div>
  );
};
