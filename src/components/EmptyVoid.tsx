'use client';

import React, { useState, useRef } from 'react';
import { Upload, Film, Play, Sun, Palette, Moon } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';
import { triggerHapticTick } from '@/lib/haptics';
import { AppTheme } from './StudioHeader';

import { LuxsBrand } from './LuxsBrand';

interface EmptyVoidProps {
  onVideoSelected: (source: File | Blob | string, options: { intervalSeconds: number; maxFrames: number }) => void;
  isProcessing: boolean;
  theme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
}

export const EmptyVoid: React.FC<EmptyVoidProps> = ({
  onVideoSelected,
  isProcessing,
  theme = 'luminous',
  onSelectTheme,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const intervalSeconds = 0.15;
  const maxFrames = 45;

  const isValidVideoFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const isVideoExt = /\.(mp4|mov|webm|m4v|mkv|avi|ogv)$/i.test(name);
    const isVideoMime = file.type.startsWith('video/');
    return isVideoExt || isVideoMime;
  };

  const processFile = (file: File) => {
    setFileError(null);
    if (isValidVideoFile(file)) {
      onVideoSelected(file, { intervalSeconds, maxFrames });
    } else {
      setFileError('対応している動画形式（MP4, MOV, WebM）を選択してください。');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSampleDemo = async () => {
    try {
      setFileError(null);
      setIsGeneratingSample(true);
      const sampleBlob = await generateSampleVideo();
      onVideoSelected(sampleBlob, { intervalSeconds: 0.1, maxFrames: 30 });
    } catch {
      setFileError('デモ動画の生成に失敗しました。');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative overflow-hidden bg-[var(--background)] transition-colors duration-200">
      {/* 1. Studio Header */}
      <header className="w-full h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface)] z-30 shrink-0">
        <LuxsBrand showStatus={false} />

        {/* Top Right: Theme Switcher Segment */}
        {onSelectTheme && (
          <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                onSelectTheme('luminous');
                triggerHapticTick(1000, 0.02);
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'luminous'
                  ? 'bg-[var(--surface)] text-amber-600 shadow-2xs font-medium'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
              title="ルミナス（ウォームライト）"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectTheme('blush');
                triggerHapticTick(1000, 0.02);
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'blush'
                  ? 'bg-[var(--surface)] text-rose-500 shadow-2xs font-medium'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
              title="ブラッシュ（血色ニュアンス）"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectTheme('noir');
                triggerHapticTick(1000, 0.02);
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'noir'
                  ? 'bg-[var(--surface)] text-stone-300 shadow-2xs font-medium'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
              title="ノワール（スタジオ暗室）"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* 2. Main Workbench & Drop Stage */}
      <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.MOV,.webm,.m4v"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Main Studio Drop Plate */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`w-full max-w-lg p-7 sm:p-10 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-5 relative overflow-hidden tactile-surface bg-[var(--surface)] ${
            isDragOver
              ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 scale-[1.005]'
              : 'border-[var(--surface-border)] hover:border-[var(--surface-border-strong)]'
          }`}
        >
          {/* Subtle Photographic Frame Stack Cue */}
          <div className="flex items-center justify-center -space-x-3 mb-1">
            <div className="w-13 h-17 rounded-lg bg-[var(--surface-subtle)] border border-[var(--surface-border)] shadow-2xs -rotate-6 transform opacity-60 flex items-center justify-center">
              <Film className="w-4 h-4 text-[var(--foreground-muted)]" />
            </div>
            <div className="w-15 h-19 rounded-lg bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/30 shadow-xs rotate-0 z-10 scale-105 flex flex-col items-center justify-center relative">
              <Upload className="w-5 h-5 text-[var(--accent-primary)]" />
              <div className="absolute bottom-2.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-2xs" />
            </div>
            <div className="w-13 h-17 rounded-lg bg-[var(--surface-subtle)] border border-[var(--surface-border)] shadow-2xs rotate-6 transform opacity-60 flex items-center justify-center">
              <Film className="w-4 h-4 text-[var(--foreground-muted)]" />
            </div>
          </div>

          {/* Action Title & Simple Explanation */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-base sm:text-lg font-semibold text-[var(--foreground)] tracking-tight">
              動画を選択、またはドロップ
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed max-w-sm">
              iPhoneやスマホの動画から、ブレのないベストな表情を自動で見つけ出し、綺麗な写真として保存します。
            </p>
          </div>

          {fileError && (
            <p className="text-xs text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/30">
              {fileError}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1 w-full max-w-xs justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] tactile-btn shadow-sm cursor-pointer text-center"
            >
              動画を選択
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSampleDemo();
              }}
              disabled={isProcessing || isGeneratingSample}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--foreground)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] tactile-btn cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 opacity-70" />
              <span>{isGeneratingSample ? '準備中...' : 'サンプルで試す'}</span>
            </button>
          </div>
        </div>

        {/* Visual Showcase Card: Video Blur -> Rescued Crisp Moment */}
        <div
          onClick={handleSampleDemo}
          className="mt-6 w-full max-w-lg p-3 sm:p-3.5 rounded-2xl bg-[var(--surface-subtle)]/70 border border-[var(--surface-border)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs"
          title="クリックしてサンプル動画で体験"
        >
          {/* Visual Split Graphic */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Left: Motion Blur Frame Simulation */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-300 border border-[var(--surface-border)] shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/60 to-stone-400/80 blur-[2px] transform scale-110" />
              <div className="relative z-10 w-5 h-5 rounded-full bg-white/40 blur-[1px]" />
              <span className="absolute bottom-1 left-1 text-[8px] font-medium text-stone-700/80 bg-white/70 px-1 py-0.2 rounded">
                ブレコマ
              </span>
            </div>

            {/* Connecting transition pill */}
            <div className="text-[10px] text-[var(--foreground-muted)] font-medium shrink-0 flex items-center">
              →
            </div>

            {/* Right: Rescued Crisp Frame Simulation */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-200 border border-[var(--accent-primary)]/40 shadow-xs shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-amber-50" />
              <div className="relative z-10 w-5 h-5 rounded-full bg-rose-300/80 shadow-xs border border-white/60" />
              <span className="absolute bottom-1 right-1 text-[8px] font-semibold text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-1 py-0.2 rounded border border-[var(--accent-primary)]/30">
                ベスト
              </span>
            </div>

            {/* Text caption */}
            <div className="min-w-0 flex-1 pl-1">
              <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                動画からブレのない瞬間を救出
              </div>
              <div className="text-[11px] text-[var(--foreground-muted)] truncate">
                サンプル動画で仕上がりをすぐ試せます
              </div>
            </div>
          </div>

          {/* Right Action Hint */}
          <div className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] bg-[var(--surface)] border border-[var(--surface-border)] shadow-2xs">
            体験する
          </div>
        </div>
      </div>

      {/* 3. Reassuring Privacy Footer */}
      <footer className="w-full h-11 px-4 sm:px-6 flex items-center justify-center border-t border-[var(--surface-border)] bg-[var(--surface)] text-[11px] text-[var(--foreground-muted)] z-20 shrink-0">
        <span className="opacity-80">
          動画はお使いの端末内でのみ安全に処理されます。サーバーへの送信や保存は一切行われません。
        </span>
      </footer>
    </div>
  );
};

