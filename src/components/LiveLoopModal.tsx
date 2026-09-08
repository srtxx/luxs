'use client';

import React, { useState, useEffect } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Download, Repeat, Play, Pause } from 'lucide-react';
import { AspectRatio } from './StudioCanvas';
import { exportLiveLoopVideo } from '@/lib/crop-export';
import { triggerHapticTick } from '@/lib/haptics';

interface LiveLoopModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  currentIndex: number;
  aspectRatio: AspectRatio;
}

export const LiveLoopModal: React.FC<LiveLoopModalProps> = ({
  isOpen,
  onClose,
  frames,
  currentIndex,
  aspectRatio,
}) => {
  const [bounce, setBounce] = useState(true);
  const [speed, setSpeed] = useState<1 | 0.75>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loopFrameIndex, setLoopFrameIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Extract around 0.5s before and after (approx +/- 4 frames around current index)
  const windowSize = 5;
  const startIdx = Math.max(0, currentIndex - windowSize);
  const endIdx = Math.min(frames.length, currentIndex + windowSize + 1);
  const subFrames = frames.slice(startIdx, endIdx);

  // Build looping sequence
  const loopSequence = React.useMemo(() => {
    if (subFrames.length <= 1) return subFrames;
    if (bounce) {
      const forward = [...subFrames];
      const backward = [...subFrames.slice(1, -1)].reverse();
      return [...forward, ...backward];
    }
    return subFrames;
  }, [subFrames, bounce]);

  // Playback timer
  useEffect(() => {
    if (!isOpen || !isPlaying || loopSequence.length === 0) return;

    const baseIntervalMs = 90 / speed;
    const interval = setInterval(() => {
      setLoopFrameIndex((prev) => (prev + 1) % loopSequence.length);
    }, baseIntervalMs);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, loopSequence, speed]);

  if (!isOpen || subFrames.length === 0) return null;

  const currentShowing = loopSequence[loopFrameIndex] || subFrames[0];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const centerTime = (frames[currentIndex]?.timestamp || 0).toFixed(2).replace('.', '_');
      await exportLiveLoopVideo(subFrames, {
        bounce,
        aspectRatio,
        fps: Math.round(11 * speed),
        cycles: 4,
        filename: `luxs_live_loop_${centerTime}s.mp4`,
      });
      triggerHapticTick(1500, 0.06);
    } catch {
      // Export failed
    } finally {
      setIsExporting(false);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '9:16':
        return 'aspect-[9/16]';
      case 'original':
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] shadow-2xl flex flex-col overflow-hidden text-[var(--foreground)] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--surface-border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 opacity-70" />
            <h2 className="text-xs font-semibold tracking-wide uppercase">
              ショートループ動画（Live Photo風）
            </h2>
            <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
              ({subFrames.length}コマ連写)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Loop Stage */}
        <div className="relative bg-[var(--canvas-bg)] p-6 flex items-center justify-center min-h-[320px] max-h-[50vh] overflow-hidden">
          <div
            className={`relative max-h-full max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-lg border border-[var(--surface-border)] bg-black ${getAspectClass()}`}
          >
            <img
              src={currentShowing.dataUrl}
              alt=""
              className="max-h-[42vh] w-auto max-w-full object-contain pointer-events-none"
            />

            {/* Play/Pause overlay toggle button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute bottom-3 left-3 p-2 rounded-full bg-black/60 backdrop-blur-xs text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer shadow-sm"
              title={isPlaying ? '一時停止' : '再生'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Frame Counter Pill */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90 border border-white/10 tabular-numbers">
              {loopFrameIndex + 1} / {loopSequence.length}
            </div>
          </div>
        </div>

        {/* Controls Console */}
        <div className="p-5 space-y-4 bg-[var(--surface)] border-t border-[var(--surface-border)]">
          {/* Loop Mode & Speed Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bounce vs Forward */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">ループ方式</label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--surface-subtle)] p-1 rounded-lg border border-[var(--surface-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setBounce(true);
                    triggerHapticTick(900, 0.02);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    bounce
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  往復（バウンス）
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBounce(false);
                    triggerHapticTick(900, 0.02);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    !bounce
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  一方向
                </button>
              </div>
            </div>

            {/* Speed Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">速度</label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--surface-subtle)] p-1 rounded-lg border border-[var(--surface-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setSpeed(1);
                    triggerHapticTick(900, 0.02);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    speed === 1
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  標準 (1.0x)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeed(0.75);
                    triggerHapticTick(900, 0.02);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    speed === 0.75
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  ゆったり (0.75x)
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
            選択コマの前後の表情や動きを滑らかなマイクロループ動画として書き出します。Instagramストーリーやアイコンに最適です。
          </p>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-3 border-t border-[var(--surface-border)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            閉じる
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isExporting ? '動画を生成中...' : 'ループ動画を保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
