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
    <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none bg-[var(--background)] transition-colors duration-200">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
            {isExtracting ? 'フレームを展開中...' : 'ベストショットを検出中...'}
          </p>
          <p className="text-[11px] font-mono text-[var(--foreground-muted)] tabular-numbers">
            {current} / {total} コマ
          </p>
        </div>

        {/* Minimalist 2px progress bar with accent */}
        <div className="w-full h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
