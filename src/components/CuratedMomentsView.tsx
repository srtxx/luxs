'use client';

import React from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { Sparkles, Heart, ArrowRight, Download } from 'lucide-react';

interface CuratedMomentsViewProps {
  frames: BurstFrame[];
  favoritedIds: string[];
  onToggleFavorite: (frameId: string) => void;
  onSelectFrameAndOpenAtelier: (frameId: string) => void;
  onSaveCuratedBatch: () => void;
  onGoToTimeline: () => void;
}

const AURA_TITLES = [
  {
    rank: 1,
    title: '最高の笑顔',
    subtitle: '表情のブレが最も少なく、自然な光と笑顔が調和した決定的一瞬',
    tag: 'BEST MOMENT',
  },
  {
    rank: 2,
    title: '澄んだ眼差し',
    subtitle: '瞳のキャッチライトが際立ち、まぶたの開きが美しい瞬間',
    tag: 'CLEAR GAZE',
  },
  {
    rank: 3,
    title: '柔らかな光',
    subtitle: '全体のコントラストと肌の階調が最も美しく捉えられた瞬間',
    tag: 'GOLDEN LIGHT',
  },
];

export const CuratedMomentsView: React.FC<CuratedMomentsViewProps> = ({
  frames,
  favoritedIds,
  onToggleFavorite,
  onSelectFrameAndOpenAtelier,
  onSaveCuratedBatch,
  onGoToTimeline,
}) => {
  // Extract top 3 ranked frames
  const topFrames = frames
    .filter((f) => f.rank && f.rank <= 3)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const displayFrames = topFrames.length >= 3 ? topFrames.slice(0, 3) : frames.slice(0, 3);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn select-none">
      {/* Header Statement */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/80 text-amber-900 text-[11px] font-semibold tracking-widest uppercase">
          <Sparkles className="w-3 h-3 text-amber-700" />
          <span>CURATED AURA MOMENTS</span>
        </div>
        <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-stone-900">
          AIがすくい上げた、奇跡の3瞬
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          何十コマの連続した時間のなかから、ポーズでは作れない最も澄んだ表情と光の瞬間を厳選しました。
        </p>
      </div>

      {/* 3 Curated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayFrames.map((frame, index) => {
          const auraMeta = AURA_TITLES[index] || AURA_TITLES[0];
          const isFav = favoritedIds.includes(frame.id);
          const isTop = index === 0;

          return (
            <div
              key={frame.id}
              className={`rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                isTop
                  ? 'bg-white shadow-xl ring-2 ring-amber-400/80 relative overflow-hidden'
                  : 'bg-white/80 shadow-md border border-stone-200/80 hover:border-amber-300/80'
              }`}
            >
              {/* Highlight ribbon for #1 */}
              {isTop && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-300 text-stone-950 font-bold text-[10px] tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  RECOMMENDED
                </div>
              )}

              {/* Photo Canvas */}
              <div className="space-y-4">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-900 shadow-inner group">
                  <img
                    src={frame.dataUrl}
                    alt={auraMeta.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />

                  {/* Top-left tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AURA #{index + 1}</span>
                  </div>

                  {/* Top-right heart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(frame.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                      isFav
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                        : 'bg-stone-950/60 text-white border-white/20 hover:bg-stone-900'
                    }`}
                    title="お気に入り"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                  </button>

                  {/* Bottom time watermark */}
                  <div className="absolute bottom-2 right-3 text-[10px] text-white/75 font-mono">
                    {frame.timestamp.toFixed(2)}s
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1 text-left px-1">
                  <h3 className="font-serif-brand text-lg font-bold text-stone-900 flex items-center justify-between">
                    <span>{auraMeta.title}</span>
                    <span className="text-[10px] font-mono text-amber-700 tracking-wider font-semibold">
                      {auraMeta.tag}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {auraMeta.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => onSelectFrameAndOpenAtelier(frame.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    isTop
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200/80'
                  }`}
                >
                  <span>この瞬間を仕上げる</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200/60 text-xs">
        <button
          type="button"
          onClick={onSaveCuratedBatch}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-stone-600" />
          <span>厳選3瞬をまとめて保存</span>
        </button>

        <button
          type="button"
          onClick={onGoToTimeline}
          className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer group"
        >
          <span>すべてのコマ（{frames.length}枚）をタイムラインで見る</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
