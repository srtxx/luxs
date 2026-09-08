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
      {/* Header row: Timecode, Quick Recommended Jump Pills, and Frame counter */}
      <div className="w-full flex items-center justify-between px-1 text-xs text-[var(--foreground-muted)] tabular-numbers">
        {/* Left: Timestamp & Current Frame Status */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wider text-[var(--foreground)]">
            {currentFrame ? `${currentFrame.timestamp.toFixed(2)}s` : '0.00s'}
          </span>
          {recommendedIndices.includes(currentIndex) && (
            <span className="text-[10px] font-medium text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-2 py-0.5 rounded-md border border-[var(--accent-primary)]/30">
              おすすめ（高鮮明）
            </span>
          )}
        </div>

        {/* Center/Right: Quick Recommendation Jump Chips */}
        <div className="flex items-center gap-1.5">
          {recommendedIndices.slice(0, 3).map((recIdx, idx) => {
            const isSelected = currentIndex === recIdx;
            const label = idx === 0 ? 'ベスト' : `候補${idx + 1}`;
            return (
              <button
                key={recIdx}
                type="button"
                onClick={() => {
                  onIndexChange(recIdx);
                  triggerHapticTick(1350, 0.05);
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent-primary)] text-white shadow-2xs font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--surface-border)]'
                }`}
                title={`おすすめコマ ${idx + 1} に移動`}
              >
                {label}
              </button>
            );
          })}

          <span className="text-[11px] text-[var(--foreground-muted)] font-medium pl-1">
            {currentIndex + 1} / {totalFrames}
          </span>
        </div>
      </div>

      {/* Main Scrubber Film Track */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="w-full relative h-16 sm:h-20 bg-[var(--track-bg)] rounded-xl overflow-hidden cursor-ew-resize flex items-center border border-[var(--surface-border-strong)] studio-elevation transition-colors duration-200"
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
                className="h-full relative shrink-0 border-r border-black/10 overflow-hidden"
              >
                <img
                  src={frame.dataUrl}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none opacity-80 hover:opacity-100 transition-opacity"
                  loading="lazy"
                  draggable={false}
                />

                {/* Recommended Indicator (Luminous dot with subtle halo) */}
                {isRec && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-2 h-2 rounded-full bg-white ring-2 ring-[var(--accent-primary)] shadow-md pointer-events-none" />
                )}

                {/* Favorite Dot Indicator */}
                {isFav && !isRec && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-xs pointer-events-none" />
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
          <div className="w-3 h-1.5 bg-[var(--accent-primary)] rounded-full shadow-md -mt-0.5 border border-white/60" />

          {/* Central Line */}
          <div className="w-[2.5px] h-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(212,107,120,0.8)] rounded-full" />

          {/* Bottom Notch Pip */}
          <div className="w-3 h-1.5 bg-[var(--accent-primary)] rounded-full shadow-md -mb-0.5 border border-white/60" />
        </div>
      </div>
    </div>
  );
};
