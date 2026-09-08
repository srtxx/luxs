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
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none relative">
      {/* Organic ambient backlight reflecting image tones */}
      <div
        className="absolute w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700 ease-out"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 230, 200, 0.25) 0%, rgba(100, 100, 100, 0.05) 50%, transparent 70%)`,
        }}
      />

      {/* Main Photographic Print / Lightbox Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseMove={handleMouseMove}
        className={`relative max-h-full max-w-full flex items-center justify-center rounded-xl overflow-hidden studio-elevation bg-[#080808] border border-white/10 ring-1 ring-black/40 cursor-crosshair transition-all duration-150 ${getAspectClass()}`}
        style={{ touchAction: 'none' }}
      >
        <img
          src={activeUrl}
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

        {/* Press-and-Hold Indicator Pill */}
        {isPressing && (
          <div className="absolute top-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-lg pointer-events-none animate-fadeIn">
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
                : 'bg-black/60 text-stone-300 border-white/15 hover:bg-black/80 hover:text-white'
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
                : 'bg-black/60 text-stone-300 border-white/15 hover:bg-black/80 hover:text-white'
            }`}
            title="お気に入り"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Hint on hover */}
        {!isPressing && !isLoupe && (
          <div className="absolute bottom-3 inset-x-0 mx-auto w-max px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-stone-300 border border-white/10 opacity-0 group-hover:opacity-100 sm:hover:opacity-100 transition-opacity pointer-events-none">
            長押しで元画像と比較
          </div>
        )}
      </div>
    </div>
  );
};
