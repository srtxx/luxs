'use client';

import React from 'react';

interface ProcessingProgressProps {
  stage: 'extracting' | 'scoring' | 'done';
  progress: number;
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
    <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-1">
          <p className="text-xs font-medium text-stone-300">
            {isExtracting ? 'フレームを展開中...' : 'ベストショットを検出中...'}
          </p>
          <p className="text-[11px] font-mono text-stone-500 tabular-numbers">
            {current} / {total} コマ
          </p>
        </div>

        {/* Minimalist 2px progress bar */}
        <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
