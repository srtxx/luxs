'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Heart, ZoomIn, Columns2, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

export type AspectRatio = 'original' | '4:5' | '1:1' | '9:16';

interface StudioCanvasProps {
  frame: BurstFrame;
  prevFrame?: BurstFrame | null;
  nextFrame?: BurstFrame | null;
  enhancedUrl: string | null;
  aspectRatio: AspectRatio;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  frame,
  prevFrame,
  nextFrame,
  enhancedUrl,
  aspectRatio,
  isFavorited,
  onToggleFavorite,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [isLoupe, setIsLoupe] = useState(false);
  const [loupeOrigin, setLoupeOrigin] = useState({ x: 50, y: 50 });
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isSnsOverlay, setIsSnsOverlay] = useState(false);

  // Flicker comparison (Blink Comparator) state
  const [flickerFrame, setFlickerFrame] = useState<BurstFrame | null>(null);
  const [flickerOffset, setFlickerOffset] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const splitDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Press-and-hold (only active when not in split mode)
  // Flicker frame takes highest precedence when user holds comparison trigger
  const baseActiveUrl = !isSplitMode && isPressing ? frame.dataUrl : enhancedUrl || frame.dataUrl;
  const activeUrl = flickerFrame ? flickerFrame.dataUrl : baseActiveUrl;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSplitMode || flickerFrame) return;
    if (e.button === 0 && enhancedUrl) {
      setIsPressing(true);
    }
  };

  const handlePointerUp = () => {
    setIsPressing(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoupe || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLoupeOrigin({ x, y });
  };

  // Keyboard shortcut for flicker comparison (Q = Prev, E = Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.repeat) return;

      if ((e.key === 'q' || e.key === 'Q') && prevFrame) {
        setFlickerFrame(prevFrame);
        setFlickerOffset(`-${Math.abs(frame.timestamp - prevFrame.timestamp).toFixed(2)}s`);
        triggerHapticTick(1050, 0.03);
      } else if ((e.key === 'e' || e.key === 'E') && nextFrame) {
        setFlickerFrame(nextFrame);
        setFlickerOffset(`+${Math.abs(nextFrame.timestamp - frame.timestamp).toFixed(2)}s`);
        triggerHapticTick(1050, 0.03);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
        setFlickerFrame(null);
        setFlickerOffset(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [frame, prevFrame, nextFrame]);

  // Split handle drag handling with Pointer Events & RAF
  const updateSplitPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        setSplitPos(percent);
        rafIdRef.current = null;
      });
    }
  }, []);

  const handleSplitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    splitDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSplitPos(e.clientX);
    triggerHapticTick(1000, 0.03);
  };

  const handleSplitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!splitDraggingRef.current) return;
    updateSplitPos(e.clientX);
  };

  const handleSplitPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    splitDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onWindowPointerUp = () => setIsPressing(false);
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, []);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '9:16':
        return 'aspect-[9/16]';
      case 'original':
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none relative">
      {/* Main Photographic Lightbox Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseMove={handleMouseMove}
        className={`relative max-h-full max-w-full flex items-center justify-center rounded-2xl overflow-hidden studio-elevation bg-[var(--canvas-bg)] border border-[var(--surface-border)] ring-1 ring-black/5 transition-all duration-150 ${getAspectClass()}`}
        style={{ touchAction: 'none' }}
      >
        {/* Base Layer: Original image (or under split) */}
        <img
          src={frame.dataUrl}
          alt=""
          className="max-h-[58vh] sm:max-h-[64vh] w-auto max-w-full object-contain pointer-events-none transition-transform duration-100 ease-out"
          style={
            isLoupe
              ? {
                  transformOrigin: `${loupeOrigin.x}% ${loupeOrigin.y}%`,
                  transform: 'scale(2.2)',
                }
              : undefined
          }
          draggable={false}
        />

        {/* Enhanced Layer (Overlaid with clip-path if in Split Mode, or normal activeUrl) */}
        {enhancedUrl && (
          <img
            src={activeUrl}
            alt=""
            className="absolute inset-0 max-h-[58vh] sm:max-h-[64vh] w-auto max-w-full m-auto object-contain pointer-events-none transition-transform duration-100 ease-out"
            style={{
              clipPath: isSplitMode ? `inset(0 0 0 ${splitPos}%)` : undefined,
              transformOrigin: isLoupe ? `${loupeOrigin.x}% ${loupeOrigin.y}%` : undefined,
              transform: isLoupe ? 'scale(2.2)' : undefined,
            }}
            draggable={false}
          />
        )}

        {/* Split Divider Handle */}
        {isSplitMode && enhancedUrl && (
          <div
            onPointerDown={handleSplitPointerDown}
            onPointerMove={handleSplitPointerMove}
            onPointerUp={handleSplitPointerUp}
            onPointerCancel={handleSplitPointerUp}
            className="absolute inset-y-0 z-30 cursor-ew-resize flex items-center justify-center"
            style={{
              left: `${splitPos}%`,
              transform: 'translateX(-50%)',
              width: '32px',
              touchAction: 'none',
            }}
          >
            {/* Divider Line */}
            <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />

            {/* Central Grab Pip */}
            <div className="absolute w-7 h-7 rounded-full bg-white shadow-md border border-black/10 flex items-center justify-center text-stone-700">
              <Columns2 className="w-3.5 h-3.5" />
            </div>

            {/* Labels on sides */}
            <div className="absolute top-3 left-[-60px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white pointer-events-none">
              元画像
            </div>
            <div className="absolute top-3 right-[-60px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white pointer-events-none">
              補正後
            </div>
          </div>
        )}

        {/* Press-and-Hold Indicator Pill */}
        {isPressing && !isSplitMode && !flickerFrame && (
          <div className="absolute top-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-fadeIn">
            元画像
          </div>
        )}

        {/* Flicker Comparison Indicator Pill */}
        {flickerFrame && (
          <div className="absolute top-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-fadeIn flex items-center gap-1.5 tabular-numbers z-50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>比較中 ({flickerOffset})</span>
          </div>
        )}

        {/* SNS Safety Zone & Composition Reticle Overlay */}
        {isSnsOverlay && (
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between text-white/70 font-mono select-none">
            {/* Rule of Thirds subtle guidelines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-white/15" />
              <div className="border-r border-white/15" />
              <div />
            </div>

            {/* Top UI Safety Zone Boundary */}
            <div className="relative w-full pt-3 px-3 pb-2 border-b border-dashed border-amber-400/50 bg-black/15 backdrop-blur-[1px] flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-semibold drop-shadow-xs">
                UI SAFE AREA (TOP)
              </span>
              <span className="text-[9px] text-white/60">
                {aspectRatio === '9:16' ? 'ヘッダー・ストーリー進捗域' : 'アカウント表示域'}
              </span>
            </div>

            {/* Center Reticle */}
            <div className="absolute inset-0 m-auto w-6 h-6 border border-white/30 rounded-full flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            </div>

            {/* Bottom UI Safety Zone Boundary */}
            <div className="relative w-full pb-3 px-3 pt-2 border-t border-dashed border-amber-400/50 bg-black/15 backdrop-blur-[1px] flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-semibold drop-shadow-xs">
                UI SAFE AREA (BOTTOM)
              </span>
              <span className="text-[9px] text-white/60">
                {aspectRatio === '9:16' ? 'メッセージ入力・リアクション域' : 'キャプション・アクション域'}
              </span>
            </div>
          </div>
        )}

        {/* Floating Minimal Controls (Top-Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-40">
          {/* Split Mode Toggle (Only when enhanced image exists) */}
          {enhancedUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSplitMode(!isSplitMode);
                triggerHapticTick(1100, 0.03);
              }}
              className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs tactile-btn ${
                isSplitMode
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                  : 'bg-[var(--surface)]/80 text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface)]'
              }`}
              title="Before / After 分割比較"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* SNS Mock Overlay Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSnsOverlay(!isSnsOverlay);
              triggerHapticTick(1100, 0.03);
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs tactile-btn ${
              isSnsOverlay
                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                : 'bg-[var(--surface)]/80 text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface)]'
            }`}
            title="SNS投稿プレビュー枠"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Loupe Zoom Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLoupe(!isLoupe);
              triggerHapticTick(1100, 0.03);
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs tactile-btn ${
              isLoupe
                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                : 'bg-[var(--surface)]/80 text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface)]'
            }`}
            title="拡大（2x）"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Heart Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs tactile-btn ${
              isFavorited
                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                : 'bg-[var(--surface)]/80 text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface)]'
            }`}
            title="お気に入り"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Floating Blink Comparator (Hold to compare adjacent frames) */}
        {(prevFrame || nextFrame) && !isSplitMode && (
          <div className="absolute bottom-3 inset-x-0 mx-auto w-max flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 z-30 shadow-md">
            {prevFrame && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setFlickerFrame(prevFrame);
                  setFlickerOffset(`-${Math.abs(frame.timestamp - prevFrame.timestamp).toFixed(2)}s`);
                  triggerHapticTick(1050, 0.03);
                }}
                onPointerUp={() => {
                  setFlickerFrame(null);
                  setFlickerOffset(null);
                }}
                onPointerLeave={() => {
                  setFlickerFrame(null);
                  setFlickerOffset(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer select-none ${
                  flickerFrame === prevFrame
                    ? 'bg-amber-400 text-stone-900 font-semibold shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="長押しで前のコマと比較（Qキー）"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>前コマ長押し</span>
              </button>
            )}

            <div className="w-px h-3 bg-white/20" />

            {nextFrame && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setFlickerFrame(nextFrame);
                  setFlickerOffset(`+${Math.abs(nextFrame.timestamp - frame.timestamp).toFixed(2)}s`);
                  triggerHapticTick(1050, 0.03);
                }}
                onPointerUp={() => {
                  setFlickerFrame(null);
                  setFlickerOffset(null);
                }}
                onPointerLeave={() => {
                  setFlickerFrame(null);
                  setFlickerOffset(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer select-none ${
                  flickerFrame === nextFrame
                    ? 'bg-amber-400 text-stone-900 font-semibold shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="長押しで次のコマと比較（Eキー）"
              >
                <span>次コマ長押し</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Hint on hover */}
        {!isPressing && !isLoupe && !isSplitMode && !flickerFrame && enhancedUrl && (
          <div className="absolute bottom-12 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white/90 border border-white/10 opacity-0 group-hover:opacity-100 sm:hover:opacity-100 transition-opacity pointer-events-none">
            長押しで元画像と比較
          </div>
        )}
      </div>
    </div>
  );
};
