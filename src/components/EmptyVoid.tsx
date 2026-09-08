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

