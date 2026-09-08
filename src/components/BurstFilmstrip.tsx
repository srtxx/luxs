import React, { useRef, useEffect, useState } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Film, ChevronLeft, ChevronRight, ArrowUpDown, Zap, Archive, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface BurstFilmstripProps {
  frames: BurstFrame[];
  selectedFrameId: string | null;
  onSelectFrame: (frame: BurstFrame) => void;
}

export const BurstFilmstrip: React.FC<BurstFilmstripProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
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
      // Don't intercept if an input or select is focused
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
      const folder = zip.folder('luxs-burst-frames') || zip;
      const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        const seq = String(i + 1).padStart(3, '0');
        const timeStr = f.timestamp.toFixed(2).replace('.', '_');
        const rankStr = f.rank ? `_rank${f.rank}` : '';
        const filename = `burst_${seq}_${timeStr}s_score${f.score ?? 0}${rankStr}.jpg`;

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
      link.download = `luxs-all-burst-${sorted.length}frames.zip`;
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
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            バースト連写タイムライン ({frames.length}コマ)
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
            [←/→ キーでコマ送り]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download All ZIP */}
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            title="全コマをまとめてZIPダウンロード"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ZIP圧縮中 ({zipProgress}%)</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>全件保存 (ZIP)</span>
              </>
            )}
          </button>

          {/* Sort Switch */}
          <button
            onClick={() => setSortBy(sortBy === 'timeline' ? 'score' : 'timeline')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>{sortBy === 'timeline' ? '時系列順' : 'スコア順'}</span>
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={selectedIndex <= 0}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
              title="前のコマ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIndex >= displayFrames.length - 1}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
              title="次のコマ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
      >
        {displayFrames.map((frame, index) => {
          const isSelected = frame.id === selectedFrameId;
          const isTopRank = frame.rank === 1;

          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`flex-shrink-0 w-28 sm:w-32 rounded-lg overflow-hidden cursor-pointer border transition-all text-left bg-slate-950 ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.03] shadow-md shadow-amber-500/20'
                  : 'border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="aspect-video w-full relative bg-slate-900 overflow-hidden">
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {isTopRank && (
                  <div className="absolute top-1 left-1 bg-amber-400 text-slate-950 p-0.5 rounded">
                    <Zap className="w-2.5 h-2.5 fill-slate-950" />
                  </div>
                )}
              </div>

              <div className="p-1.5 flex items-center justify-between text-[10px] font-mono bg-slate-900/90 text-slate-400">
                <span>{frame.timestamp.toFixed(2)}s</span>
                <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
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
