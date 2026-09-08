'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Heart, ZoomIn, Columns2, Smartphone, MessageCircle, Send, Bookmark } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

export type AspectRatio = 'original' | '4:5' | '1:1' | '9:16';

interface StudioCanvasProps {
  frame: BurstFrame;
  enhancedUrl: string | null;
  aspectRatio: AspectRatio;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  frame,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const splitDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Press-and-hold (only active when not in split mode)
  const activeUrl = !isSplitMode && isPressing ? frame.dataUrl : enhancedUrl || frame.dataUrl;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSplitMode) return;
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
      {/* Subtle organic ambient backlight reflecting image tones */}
      <div
        className="absolute w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ease-out"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(220, 160, 170, 0.35) 0%, rgba(180, 150, 130, 0.1) 50%, transparent 70%)`,
        }}
      />

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
        {isPressing && !isSplitMode && (
          <div className="absolute top-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-fadeIn">
            元画像
          </div>
        )}

        {/* SNS Live Preview Mock Overlay (Instagram Feed & Stories Outline) */}
        {isSnsOverlay && (
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-4 text-white/90 font-sans">
            {aspectRatio === '9:16' ? (
              /* Stories Mock Overlay */
              <>
                {/* Top Stories Progress Bar & Header */}
                <div className="space-y-2">
                  <div className="w-full h-0.5 bg-white/40 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/30 border border-white/60" />
                    <span className="text-[11px] font-medium text-white drop-shadow-sm">your_story</span>
                    <span className="text-[10px] text-white/70">2h</span>
                  </div>
                </div>

                {/* Bottom Message & Reaction */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 rounded-full border border-white/50 bg-black/30 backdrop-blur-xs px-3 flex items-center text-[11px] text-white/70">
                    メッセージを送信...
                  </div>
                  <Heart className="w-5 h-5 text-white drop-shadow-sm" />
                  <Send className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
              </>
            ) : (
              /* Feed Mock Overlay (1:1 & 4:5 & original) */
              <>
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black/40 border border-white/40" />
                    <span className="text-[11px] font-medium text-white drop-shadow-sm">instagram_post</span>
                  </div>
                  <div className="text-xs text-white/80 tracking-widest font-bold">•••</div>
                </div>

                {/* Post Footer Actions */}
                <div className="space-y-1.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-white drop-shadow-sm" />
                      <MessageCircle className="w-4 h-4 text-white drop-shadow-sm" />
                      <Send className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                    <Bookmark className="w-4 h-4 text-white drop-shadow-sm" />
                  </div>
                  <div className="text-[10px] text-white/80 font-medium">いいね！ 1,280件</div>
                </div>
              </>
            )}
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
              className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
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
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
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
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
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
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
              isFavorited
                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
                : 'bg-[var(--surface)]/80 text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface)]'
            }`}
            title="お気に入り"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Hint on hover */}
        {!isPressing && !isLoupe && !isSplitMode && enhancedUrl && (
          <div className="absolute bottom-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white/90 border border-white/10 opacity-0 group-hover:opacity-100 sm:hover:opacity-100 transition-opacity pointer-events-none">
            長押しで元画像と比較
          </div>
        )}
      </div>
    </div>
  );
};
