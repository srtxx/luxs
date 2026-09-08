'use client';

import React, { useState } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Check, Columns2, Heart, ZoomIn } from 'lucide-react';

interface CompareViewProps {
  frames: BurstFrame[];
  favoritedIds: string[];
  initialFrameAId: string;
  onSelectWinningFrame: (frameId: string) => void;
  onToggleFavorite: (frameId: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  frames,
  favoritedIds,
  initialFrameAId,
  onSelectWinningFrame,
  onToggleFavorite,
}) => {
  const [frameAId, setFrameAId] = useState<string>(initialFrameAId);

  // Default frame B: another favorited frame, or rank 2 frame, or next frame
  const defaultB =
    frames.find((f) => favoritedIds.includes(f.id) && f.id !== initialFrameAId) ||
    frames.find((f) => f.rank === 2 && f.id !== initialFrameAId) ||
    frames.find((f) => f.id !== initialFrameAId) ||
    frames[0];

  const [frameBId, setFrameBId] = useState<string>(defaultB.id);
  const [isZoomed, setIsZoomed] = useState(false);

  const frameA = frames.find((f) => f.id === frameAId) || frames[0];
  const frameB = frames.find((f) => f.id === frameBId) || frames[1] || frames[0];

  const isFavA = favoritedIds.includes(frameA.id);
  const isFavB = favoritedIds.includes(frameB.id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Columns2 className="w-4 h-4 text-amber-700" />
          <h2 className="font-serif-brand text-lg font-bold text-stone-900">
            2画面並列比較
          </h2>
          <span className="text-xs text-stone-500">
            笑顔の微細なニュアンスを見比べて決定
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsZoomed(!isZoomed)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            isZoomed
              ? 'bg-amber-400 text-stone-950 border-amber-300'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{isZoomed ? '拡大中 (2x)' : '表情を拡大して見比べる'}</span>
        </button>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frame A */}
        <div className="space-y-3 bg-white p-5 rounded-3xl border border-stone-200/90 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs pb-2">
            <span className="font-serif-brand font-bold text-stone-900 tracking-wider">
              SHOT A {frameA.rank && frameA.rank <= 3 ? `(AURA #${frameA.rank})` : ''}
            </span>
            <span className="font-mono text-stone-400">{frameA.timestamp.toFixed(2)}s</span>
          </div>

          {/* Photo Canvas */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-900 shadow-inner flex items-center justify-center">
            <img
              src={frameA.dataUrl}
              alt="Shot A"
              className="w-full h-full object-cover transition-transform duration-200"
              style={isZoomed ? { transform: 'scale(1.8)', transformOrigin: 'center 35%' } : undefined}
            />

            <button
              type="button"
              onClick={() => onToggleFavorite(frameA.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                isFavA
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900'
              }`}
              title="お気に入り"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavA ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Frame selector dropdown */}
          <div className="pt-2">
            <select
              value={frameAId}
              onChange={(e) => setFrameAId(e.target.value)}
              className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {frames.map((f, i) => (
                <option key={f.id} value={f.id}>
                  コマ {i + 1} ({f.timestamp.toFixed(2)}s){f.rank && f.rank <= 3 ? ` — AURA #${f.rank}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Winning button */}
          <button
            type="button"
            onClick={() => onSelectWinningFrame(frameA.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 text-amber-300" />
            <span>SHOT A に決める</span>
          </button>
        </div>

        {/* Frame B */}
        <div className="space-y-3 bg-white p-5 rounded-3xl border border-stone-200/90 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs pb-2">
            <span className="font-serif-brand font-bold text-stone-900 tracking-wider">
              SHOT B {frameB.rank && frameB.rank <= 3 ? `(AURA #${frameB.rank})` : ''}
            </span>
            <span className="font-mono text-stone-400">{frameB.timestamp.toFixed(2)}s</span>
          </div>

          {/* Photo Canvas */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-900 shadow-inner flex items-center justify-center">
            <img
              src={frameB.dataUrl}
              alt="Shot B"
              className="w-full h-full object-cover transition-transform duration-200"
              style={isZoomed ? { transform: 'scale(1.8)', transformOrigin: 'center 35%' } : undefined}
            />

            <button
              type="button"
              onClick={() => onToggleFavorite(frameB.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                isFavB
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900'
              }`}
              title="お気に入り"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavB ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Frame selector dropdown */}
          <div className="pt-2">
            <select
              value={frameBId}
              onChange={(e) => setFrameBId(e.target.value)}
              className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {frames.map((f, i) => (
                <option key={f.id} value={f.id}>
                  コマ {i + 1} ({f.timestamp.toFixed(2)}s){f.rank && f.rank <= 3 ? ` — AURA #${f.rank}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Winning button */}
          <button
            type="button"
            onClick={() => onSelectWinningFrame(frameB.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 text-amber-300" />
            <span>SHOT B に決める</span>
          </button>
        </div>
      </div>
    </div>
  );
};
