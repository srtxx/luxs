'use client';

import React from 'react';
import { Loader2, Layers, Sparkles } from 'lucide-react';

interface ProcessingProgressProps {
  stage: 'extracting' | 'scoring' | 'done';
  progress: number; // 0 to 100
  current: number;
  total: number;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  stage,
  progress,
  current,
  total,
}) => {
  const isExtracting = stage === 'extracting';

  return (
    <div className="w-full max-w-lg mx-auto my-12 p-8 rounded-3xl bg-white border border-stone-200/90 shadow-xl space-y-6 text-center animate-fadeIn text-stone-900">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-800 shadow-sm">
            {isExtracting ? (
              <Layers className="w-8 h-8 animate-pulse text-amber-700" />
            ) : (
              <Sparkles className="w-8 h-8 animate-pulse text-amber-700" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-stone-200 shadow">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="font-serif-brand text-lg font-bold text-stone-900">
          {isExtracting ? '時間の中から、すべての瞬間を展開中...' : '一番美しい奇跡の一瞬を探しています...'}
        </h3>
        <p className="text-xs text-stone-500">
          {isExtracting
            ? `フレーム抽出: ${current} / ${total} コマ`
            : `ブレ・表情・透明度を丁寧に解析中: ${current} / ${total} コマ`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-stone-400 px-0.5">
          <span>{isExtracting ? 'FRAME EXTRACTION' : 'AURA ANALYSIS'}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
