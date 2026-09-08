'use client';

import React, { useState } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Heart, Check, LayoutGrid } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

interface ContactSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  favoritedIds: string[];
  onToggleFavorite: (frameId: string) => void;
  recommendedIndices: number[];
}

type FilterType = 'all' | 'favorited' | 'recommended';

export const ContactSheetModal: React.FC<ContactSheetModalProps> = ({
  isOpen,
  onClose,
  frames,
  currentIndex,
  onSelectIndex,
  favoritedIds,
  onToggleFavorite,
  recommendedIndices,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  if (!isOpen) return null;

  // Filter frames
  const filteredItems = frames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame, index }) => {
      if (filter === 'favorited') return favoritedIds.includes(frame.id);
      if (filter === 'recommended') return recommendedIndices.includes(index);
      return true;
    });

  const handleSelect = (index: number) => {
    onSelectIndex(index);
    triggerHapticTick(1200, 0.04);
    onClose();
  };

  const handleFavClick = (e: React.MouseEvent, frameId: string) => {
    e.stopPropagation();
    onToggleFavorite(frameId);
    triggerHapticTick(1400, 0.04);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#121212] rounded-2xl border border-[#242424] shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#161616]">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-stone-400" />
            <h2 className="text-xs font-semibold tracking-wide text-white uppercase">
              コンタクトシート
            </h2>
            <span className="text-[11px] text-stone-500 font-mono">
              ({frames.length}コマ)
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#202020] p-0.5 rounded-lg border border-[#2c2c2c]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#2E2E2E] text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              すべて ({frames.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('recommended')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filter === 'recommended'
                  ? 'bg-[#2E2E2E] text-amber-300 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              おすすめ ({recommendedIndices.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('favorited')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filter === 'favorited'
                  ? 'bg-[#2E2E2E] text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              保存候補 ({favoritedIds.length})
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Grid of frames */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0E0E0E]">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <p className="text-xs text-stone-500">
                該当するフレームがありません。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredItems.map(({ frame, index }) => {
                const isSelected = index === currentIndex;
                const isFav = favoritedIds.includes(frame.id);
                const isRec = recommendedIndices.includes(index);

                return (
                  <div
                    key={frame.id}
                    onClick={() => handleSelect(index)}
                    className={`group relative rounded-lg overflow-hidden bg-[#181818] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 shadow-lg scale-[1.02]'
                        : 'border-[#262626] hover:border-stone-500 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="aspect-square w-full relative bg-black flex items-center justify-center overflow-hidden">
                      <img
                        src={frame.dataUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />

                      {/* Rec Badge */}
                      {isRec && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] font-medium text-amber-300 backdrop-blur-xs flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-amber-400" />
                          おすすめ
                        </div>
                      )}

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => handleFavClick(e, frame.id)}
                        className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-rose-500/80 text-white'
                            : 'bg-black/50 text-stone-400 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Selected Indicator overlay */}
                      {isSelected && (
                        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Meta Footer */}
                    <div className="px-2 py-1.5 bg-[#141414] flex items-center justify-between border-t border-[#202020]">
                      <span className="text-[10px] font-mono text-stone-500 tabular-nums">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                        {frame.timestamp.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#202020] bg-[#161616] flex items-center justify-between text-[11px] text-stone-500">
          <span>クリックでフレームを選択してスタジオへ移動</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
