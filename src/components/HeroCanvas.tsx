'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Heart, Sparkles, ZoomIn, Split } from 'lucide-react';
import { AspectRatio } from './AuraFinishesBar';

interface HeroCanvasProps {
  frame: BurstFrame;
  enhancedUrl: string | null;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  aspectRatio: AspectRatio;
  auraTitle?: string;
}

export const HeroCanvas: React.FC<HeroCanvasProps> = ({
  frame,
  enhancedUrl,
  isFavorited,
  onToggleFavorite,
  aspectRatio,
  auraTitle,
}) => {
  const [isLoupeActive, setIsLoupeActive] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });
  const [showSplit, setShowSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayUrl = enhancedUrl || frame.dataUrl;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLoupePos({ x, y });

    if (isDraggingSplit) {
      setSplitPos(x);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showSplit && containerRef.current) {
      setIsDraggingSplit(true);
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(x);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSplit(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDraggingSplit(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Determine aspect ratio class
  const getAspectStyle = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-h-[62vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[65vh]';
      case '9:16':
        return 'aspect-[9/16] max-h-[68vh]';
      case 'original':
      default:
        return 'max-h-[62vh]';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center select-none animate-fadeIn">
      {/* Canvas Frame Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`relative group rounded-3xl overflow-hidden shadow-2xl bg-stone-900 border border-stone-200/80 transition-all duration-300 ${getAspectStyle()} flex items-center justify-center cursor-default`}
        style={{ width: 'auto', maxWidth: '100%' }}
      >
        {/* Main Enhanced Image or Split Image */}
        {showSplit && enhancedUrl ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Enhanced Layer (Left side) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
            >
              <img
                src={enhancedUrl}
                alt="Enhanced"
                className="w-full h-full object-contain pointer-events-none"
              />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-amber-200 font-medium tracking-wide">
                AURA 調光後
              </span>
            </div>

            {/* Original Layer (Right side) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }}
            >
              <img
                src={frame.dataUrl}
                alt="Original"
                className="w-full h-full object-contain pointer-events-none"
              />
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-stone-300 font-medium tracking-wide">
                元コマ
              </span>
            </div>

            {/* Split Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${splitPos}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-md -ml-3">
                <Split className="w-3 h-3 text-stone-800" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={displayUrl}
              alt="Hero Frame"
              className="w-full h-full object-contain transition-transform duration-200"
              style={
                isLoupeActive
                  ? {
                      transformOrigin: `${loupePos.x}% ${loupePos.y}%`,
                      transform: 'scale(2.2)',
                    }
                  : undefined
              }
            />
          </div>
        )}

        {/* Floating Top Left: Emotional Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
          {auraTitle ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md border border-white/20 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-semibold tracking-wide">{auraTitle}</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-stone-950/60 backdrop-blur-md border border-white/10 text-stone-300 text-[11px] font-medium">
              <span>{frame.timestamp.toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* Floating Top Right: Canvas Controls */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          {/* Split comparison toggle */}
          {enhancedUrl && (
            <button
              type="button"
              onClick={() => setShowSplit(!showSplit)}
              className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                showSplit
                  ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
                  : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900/80'
              }`}
              title="調光前後の分割比較"
            >
              <Split className="w-4 h-4" />
            </button>
          )}

          {/* 2x Loupe Toggle */}
          <button
            type="button"
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
              isLoupeActive
                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
                : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900/80'
            }`}
            title="目元・表情 2x ルーペ"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Favorite Heart Toggle */}
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
              isFavorited
                ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900/80'
            }`}
            title={isFavorited ? 'お気に入りから解除' : 'お気に入りに追加'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Subtle Bottom Instruction Hint */}
        {isLoupeActive && (
          <div className="absolute bottom-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] text-amber-200 pointer-events-none">
            マウスを動かして目元・口元を拡大確認
          </div>
        )}
      </div>
    </div>
  );
};
