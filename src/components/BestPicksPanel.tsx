'use client';

import React from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Sparkles, Clock, Heart } from 'lucide-react';

interface BestPicksPanelProps {
  frames: BurstFrame[];
  selectedFrameId: string | null;
  favoritedIds: string[];
  onSelectFrame: (frame: BurstFrame) => void;
  onToggleFavorite: (frameId: string) => void;
}

export const BestPicksPanel: React.FC<BestPicksPanelProps> = ({
  frames,
  selectedFrameId,
  favoritedIds,
  onSelectFrame,
  onToggleFavorite,
}) => {
  // Sort by score descending and get top 4
  const topPicks = [...frames]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 4);

  if (topPicks.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-brand text-sm sm:text-base font-bold text-stone-900 tracking-wider">
                AURA PICKS
              </h2>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                AI厳選
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              ブレがなく、澄んだ表情と光が美しく調和した決定的一瞬
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {topPicks.map((frame, idx) => {
          const isSelected = selectedFrameId === frame.id;
          const isFav = favoritedIds.includes(frame.id);
          const isFirst = idx === 0;

          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border text-left bg-white shadow-sm ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md scale-[1.01]'
                  : 'border-stone-200/90 hover:border-stone-300 hover:shadow-md'
              }`}
            >
              {/* Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-md ${
                    isFirst
                      ? 'bg-amber-400 text-stone-950 font-black'
                      : 'bg-white/90 text-stone-700 border border-stone-200'
                  }`}
                >
                  {isFirst ? 'AURA #1' : `RANK ${idx + 1}`}
                </span>
              </div>

              {/* Favorite (Heart) Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(frame.id);
                }}
                className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                  isFav
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/80 text-stone-400 hover:text-rose-500 border border-stone-200 shadow-xs'
                }`}
                title={isFav ? 'お気に入り解除' : 'お気に入りにキープ（A/B比較用）'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>

              {/* Image Preview */}
              <div className="aspect-3/4 sm:aspect-video w-full bg-stone-100 relative overflow-hidden flex items-center justify-center">
                <img
                  src={frame.dataUrl}
                  alt={`Best pick ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {isSelected && (
                  <div className="absolute inset-0 ring-2 ring-inset ring-amber-400 pointer-events-none" />
                )}
              </div>

              {/* Info footer */}
              <div className="p-2.5 bg-white border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-stone-500 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{frame.timestamp.toFixed(2)}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-stone-400 font-semibold">SCORE</span>
                  <span className="font-mono font-bold text-amber-800 text-xs">
                    {frame.score ?? 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
