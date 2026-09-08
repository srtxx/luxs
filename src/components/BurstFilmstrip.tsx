'use client';

import React, { useRef, useEffect, useState } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Film, ChevronLeft, ChevronRight, ArrowUpDown, Zap, Archive, Loader2, Heart } from 'lucide-react';
import JSZip from 'jszip';

interface BurstFilmstripProps {
  frames: BurstFrame[];
  selectedFrameId: string | null;
  favoritedIds?: string[];
  onSelectFrame: (frame: BurstFrame) => void;
  onToggleFavorite?: (frameId: string) => void;
}

export const BurstFilmstrip: React.FC<BurstFilmstripProps> = ({
  frames,
  selectedFrameId,
  favoritedIds = [],
  onSelectFrame,
  onToggleFavorite,
}) => {
  const [sortBy, setSortBy] = useState<'timeline' | 'score'>('timeline');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sorted frames
  const displayFrames = [...frames].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.score || 0) - (a.score || 0);
    }
    return a.timestamp - b.timestamp;
  });

  const selectedIndex = displayFrames.findIndex((f) => f.id === selectedFrameId);

  // Keyboard navigation for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        e.preventDefault();
        onSelectFrame(displayFrames[selectedIndex - 1]);
      } else if (e.key === 'ArrowRight' && selectedIndex < displayFrames.length - 1) {
        e.preventDefault();
        onSelectFrame(displayFrames[selectedIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayFrames, onSelectFrame]);

  // Scroll active item into view
  useEffect(() => {
    if (!scrollContainerRef.current || selectedIndex === -1) return;
    const container = scrollContainerRef.current;
    const selectedEl = container.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  const handlePrev = () => {
    if (selectedIndex > 0) {
      onSelectFrame(displayFrames[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < displayFrames.length - 1) {
      onSelectFrame(displayFrames[selectedIndex + 1]);
    }
  };

  const handleDownloadAllZip = async () => {
    if (frames.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder('luxs-aura-burst') || zip;
      const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        const seq = String(i + 1).padStart(3, '0');
        const timeStr = f.timestamp.toFixed(2).replace('.', '_');
        const rankStr = f.rank ? `_rank${f.rank}` : '';
        const filename = `aura_${seq}_${timeStr}s_score${f.score ?? 0}${rankStr}.jpg`;

        const base64Data = f.dataUrl.split(',')[1];
        if (base64Data) {
          folder.file(filename, base64Data, { base64: true });
        }
        setZipProgress(Math.round(((i + 1) / sorted.length) * 80));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZipProgress(80 + Math.round(metadata.percent * 0.2));
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `luxs-all-burst-${sorted.length}shots.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/90 shadow-md">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-600" />
          <h2 className="font-serif-brand text-xs sm:text-sm font-bold text-stone-900 tracking-wider">
            バースト連写タイムライン ({frames.length}コマ)
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-stone-400 font-mono">
            [←/→ キーで0.1秒コマ送り]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download All ZIP */}
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="全コマを一括ZIP保存"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>ZIP圧縮中 ({zipProgress}%)</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-amber-700" />
                <span>全件保存 (ZIP)</span>
              </>
            )}
          </button>

          {/* Sort Switch */}
          <button
            onClick={() => setSortBy(sortBy === 'timeline' ? 'score' : 'timeline')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-stone-500" />
            <span>{sortBy === 'timeline' ? '時系列順' : 'スコア順'}</span>
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={selectedIndex <= 0}
              className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 transition-colors cursor-pointer"
              title="前のコマ"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIndex >= displayFrames.length - 1}
              className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 transition-colors cursor-pointer"
              title="次のコマ"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100"
      >
        {displayFrames.map((frame, index) => {
          const isSelected = frame.id === selectedFrameId;
          const isTopRank = frame.rank === 1;
          const isFav = favoritedIds.includes(frame.id);

          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`flex-shrink-0 w-24 sm:w-28 rounded-2xl overflow-hidden cursor-pointer border transition-all text-left bg-stone-50 ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-400/40 scale-[1.03] shadow-md'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-xs opacity-80 hover:opacity-100'
              }`}
            >
              <div className="aspect-3/4 sm:aspect-video w-full relative bg-stone-200 overflow-hidden flex items-center justify-center">
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {isTopRank && (
                  <div className="absolute top-1 left-1 bg-amber-400 text-stone-950 p-0.5 rounded-full shadow-xs">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                  </div>
                )}

                {isFav ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(frame.id);
                    }}
                    className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-xs cursor-pointer hover:scale-110 transition-transform"
                    title="お気に入り解除"
                  >
                    <Heart className="w-2.5 h-2.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(frame.id);
                    }}
                    className="absolute top-1 right-1 bg-white/70 hover:bg-white text-stone-400 hover:text-rose-500 p-1 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="お気に入りに追加"
                  >
                    <Heart className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="p-1.5 flex items-center justify-between text-[10px] font-mono bg-white text-stone-500 border-t border-stone-100">
                <span>{frame.timestamp.toFixed(2)}s</span>
                <span className={`font-bold ${isSelected ? 'text-amber-800' : 'text-stone-600'}`}>
                  {frame.score ?? '-'}pt
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
