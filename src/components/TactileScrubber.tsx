'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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

  // Dynamic Gear Scrubber refs
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const anchorIndexRef = useRef(currentIndex);
  const currentGearRef = useRef<1 | 0.5 | 0.25>(1);

  // UI state for floating loupe & gear badge
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubGear, setScrubGear] = useState<1 | 0.5 | 0.25>(1);
  const [loupeX, setLoupeX] = useState<number>(50); // percentage

  const totalFrames = frames.length;

  // Sync ref
  useEffect(() => {
    targetIndexRef.current = currentIndex;
  }, [currentIndex]);

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

  // Calculate index with dynamic gear ratio based on vertical pointer distance
  const calculateIndexFromPointer = useCallback(
    (clientX: number, clientY: number): { index: number; gear: 1 | 0.5 | 0.25; percentX: number } => {
      if (!containerRef.current || totalFrames === 0) {
        return { index: 0, gear: 1, percentX: 50 };
      }

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(relativeX, rect.width));
      const percentX = (clampedX / rect.width) * 100;

      // Vertical offset: moving finger upwards reduces gear ratio for ultra-fine micro scrubbing
      const deltaY = dragStartYRef.current - clientY;
      let gear: 1 | 0.5 | 0.25 = 1;
      if (deltaY > 65) {
        gear = 0.25; // 1/4x micro step
      } else if (deltaY > 25) {
        gear = 0.5; // 1/2x fine step
      }

      let rawIndex: number;
      if (gear === 1) {
        // Absolute tracking
        const ratio = clampedX / rect.width;
        rawIndex = Math.min(totalFrames - 1, Math.floor(ratio * totalFrames));

        // Magnetic snapping to recommended frames
        for (const recIdx of recommendedIndices) {
          if (Math.abs(rawIndex - recIdx) <= 1 && Math.abs(ratio - (recIdx + 0.5) / totalFrames) < 0.035) {
            rawIndex = recIdx;
            break;
          }
        }
      } else {
        // Relative high-precision micro scrubbing
        const deltaX = clientX - dragStartXRef.current;
        const indexShift = (deltaX / (rect.width / totalFrames)) * gear;
        rawIndex = Math.max(0, Math.min(totalFrames - 1, Math.round(anchorIndexRef.current + indexShift)));
      }

      return { index: rawIndex, gear, percentX };
    },
    [totalFrames, recommendedIndices]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartXRef.current = e.clientX;
    anchorIndexRef.current = currentIndex;
    currentGearRef.current = 1;

    e.currentTarget.setPointerCapture(e.pointerId);

    const { index, gear, percentX } = calculateIndexFromPointer(e.clientX, e.clientY);
    setIsScrubbing(true);
    setScrubGear(gear);
    setLoupeX(percentX);
    scheduleUpdate(index);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const { index, gear, percentX } = calculateIndexFromPointer(e.clientX, e.clientY);

    if (currentGearRef.current !== gear) {
      currentGearRef.current = gear;
      setScrubGear(gear);
      // Subtle tick when gear changes
      triggerHapticTick(gear === 0.25 ? 1500 : 1200, 0.04);
      // Re-anchor to prevent jumping
      dragStartXRef.current = e.clientX;
      anchorIndexRef.current = index;
    }

    setLoupeX(percentX);
    scheduleUpdate(index);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsScrubbing(false);
    setScrubGear(1);
    currentGearRef.current = 1;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const next = Math.max(0, currentIndex - step);
        triggerHapticTick(950, 0.03);
        onIndexChange(next);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const next = Math.min(frames.length - 1, currentIndex + step);
        triggerHapticTick(950, 0.03);
        onIndexChange(next);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, frames.length, onIndexChange]);

  const currentFrame = frames[currentIndex];

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none relative">
      {/* 1. Header row: Metrology, Gear State, and Best Jump Chips */}
      <div className="w-full flex items-center justify-between px-1 text-xs text-[var(--foreground-muted)] tabular-numbers">
        {/* Left: Timestamp & Active Mode */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wider text-[var(--foreground)]">
            {currentFrame ? `${currentFrame.timestamp.toFixed(2)}s` : '0.00s'}
          </span>

          {/* Micro-Scrub Gear Badge (Appears when dragging upwards) */}
          {isScrubbing && scrubGear < 1 ? (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-fadeIn">
              {scrubGear === 0.25 ? '超微調整 (1/4x)' : '微調整 (1/2x)'}
            </span>
          ) : recommendedIndices.includes(currentIndex) ? (
            <span className="text-[10px] font-medium text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-2 py-0.5 rounded-md border border-[var(--accent-primary)]/30">
              おすすめ
            </span>
          ) : null}
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
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
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

          <span className="text-[11px] text-[var(--foreground-muted)] font-medium pl-1.5 border-l border-[var(--surface-border)]">
            {currentIndex + 1} / {totalFrames}
          </span>
        </div>
      </div>

      {/* 2. Floating Tactile Loupe (Appears directly above scrubber during drag) */}
      {isScrubbing && currentFrame && (
        <div
          className="absolute -top-28 z-50 pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: `${Math.max(16, Math.min(84, loupeX))}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Concentric Border & Layered Shadow Loupe Bubble */}
          <div className="relative flex flex-col items-center">
            <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-2xl p-1 bg-[var(--surface)] border border-[var(--surface-border-strong)] shadow-[0_16px_32px_-6px_rgba(0,0,0,0.28),0_4px_12px_-2px_rgba(0,0,0,0.12)] overflow-hidden">
              <div className="w-full h-full rounded-xl overflow-hidden relative bg-black/5 flex items-center justify-center">
                {/* Facial Detail Zoom (Scale 2.2x centered on subject) */}
                <img
                  src={currentFrame.dataUrl}
                  alt=""
                  className="w-full h-full object-cover transform scale-[2.2] object-center pointer-events-none"
                  draggable={false}
                />

                {/* Sub-label Overlay */}
                <div className="absolute bottom-1 inset-x-1 flex items-center justify-between px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-medium text-white tabular-numbers">
                  <span>{currentFrame.timestamp.toFixed(2)}s</span>
                  {scrubGear < 1 && (
                    <span className="text-emerald-300 font-semibold">{scrubGear}x</span>
                  )}
                </div>
              </div>
            </div>

            {/* Downward Anchor Arrow Pip */}
            <div className="w-2 h-2 bg-[var(--surface)] border-r border-b border-[var(--surface-border-strong)] rotate-45 -mt-1 shadow-xs" />
          </div>
        </div>
      )}

      {/* 3. Main Scrubber Film Track */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="w-full relative h-15 sm:h-18 bg-[var(--track-bg)] rounded-xl overflow-hidden cursor-ew-resize flex items-center border border-[var(--surface-border)] studio-elevation transition-colors duration-200"
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

                {/* Recommended Indicator */}
                {isRec && (
                  <div className="absolute bottom-2 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-white ring-2 ring-[var(--accent-primary)] shadow-md pointer-events-none" />
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
          <div className="w-[2px] h-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(212,107,120,0.8)] rounded-full" />

          {/* Bottom Notch Pip */}
          <div className="w-3 h-1.5 bg-[var(--accent-primary)] rounded-full shadow-md -mb-0.5 border border-white/60" />
        </div>
      </div>

      {/* Gentle interaction cue for gear shifting */}
      <div className="w-full flex items-center justify-center text-[9px] text-[var(--foreground-muted)] opacity-60">
        <span>ドラッグ中に指を上へ引くと微調整モード（1/4x）</span>
      </div>
    </div>
  );
};
