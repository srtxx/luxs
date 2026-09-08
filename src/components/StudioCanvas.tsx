'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Heart, ZoomIn } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Press-and-hold: show original when pressed, enhanced when released
  const activeUrl = isPressing || !enhancedUrl ? frame.dataUrl : enhancedUrl;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only trigger press-and-hold on primary click/touch
    if (e.button === 0) {
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
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseMove={handleMouseMove}
        className={`relative max-h-full max-w-full flex items-center justify-center rounded-lg overflow-hidden studio-elevation bg-[#080808] cursor-crosshair transition-all duration-150 ${getAspectClass()}`}
        style={{ touchAction: 'none' }}
      >
        <img
          src={activeUrl}
          alt=""
          className="max-h-[62vh] sm:max-h-[68vh] w-auto max-w-full object-contain pointer-events-none transition-transform duration-100 ease-out"
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

        {/* Press-and-Hold Indicator Pill */}
        {isPressing && (
          <div className="absolute top-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/90 shadow-md pointer-events-none animate-fadeIn">
            元画像
          </div>
        )}

        {/* Floating Minimal Controls (Top-Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {/* Loupe Zoom Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLoupe(!isLoupe);
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-colors cursor-pointer ${
              isLoupe
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-black/60 text-stone-300 border-white/10 hover:bg-black/80 hover:text-white'
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
            className={`p-2 rounded-full backdrop-blur-md border transition-colors cursor-pointer ${
              isFavorited
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-black/60 text-stone-300 border-white/10 hover:bg-black/80 hover:text-white'
            }`}
            title="お気に入り"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Hint on first hover / desktop */}
        {!isPressing && !isLoupe && (
          <div className="absolute bottom-3 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-black/50 text-[10px] text-stone-400 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            長押しで元画像と比較
          </div>
        )}
      </div>
    </div>
  );
};
