import React from 'react';
import { Loader2, Layers, Activity } from 'lucide-react';

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
    <div className="w-full max-w-xl mx-auto my-12 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5 text-center">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            {isExtracting ? (
              <Layers className="w-7 h-7 animate-pulse" />
            ) : (
              <Activity className="w-7 h-7 animate-pulse" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-950 p-1 rounded-full border border-slate-800">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-100">
          {isExtracting ? '動画フレームを連写分解中...' : 'AI鮮明度スコアリング中...'}
        </h3>
        <p className="text-xs text-slate-400">
          {isExtracting
            ? `フレーム抽出: ${current} / ${total} コマ`
            : `ブレ・鮮明度・露出を解析中: ${current} / ${total} コマ`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span>{isExtracting ? 'FRAME EXTRACTION' : 'QUALITY ANALYSIS'}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
