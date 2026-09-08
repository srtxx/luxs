'use client';

import React, { useState, useRef } from 'react';
import { Upload, Film, Play, Sun, Palette, Moon } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';
import { triggerHapticTick } from '@/lib/haptics';
import { AppTheme } from './StudioHeader';

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

  const handleDesktopDirectTest = () => {
    setFileError(null);
    onVideoSelected('/Users/suganuma_ryohei/Desktop/IMG_8198 2.mov', {
      intervalSeconds,
      maxFrames,
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 select-none relative overflow-hidden bg-[var(--background)] transition-colors duration-200">
      {/* Subtle warm backlight glow */}
      <div
        className="absolute w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full blur-3xl opacity-30 pointer-events-none -top-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(220, 160, 170, 0.4) 0%, rgba(200, 180, 160, 0.15) 50%, transparent 70%)`,
        }}
      />

      {/* Top Bar Theme Switcher */}
      {onSelectTheme && (
        <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-20 flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)] shadow-2xs">
          <button
            type="button"
            onClick={() => {
              onSelectTheme('luminous');
              triggerHapticTick(1000, 0.02);
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              theme === 'luminous'
                ? 'bg-[var(--surface)] text-amber-600 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ルミナス（上品なウォームライト）"
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
                ? 'bg-[var(--surface)] text-rose-500 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ブラッシュ（やわらかな血色ニュアンス）"
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
                ? 'bg-[var(--surface)] text-stone-300 shadow-2xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
            title="ノワール（シックなスタジオダーク）"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.MOV,.webm,.m4v"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {/* Main Studio Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`w-full max-w-xl p-8 sm:p-12 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-6 relative overflow-hidden studio-elevation bg-[var(--surface)] ${
          isDragOver
            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 scale-[1.01]'
            : 'border-[var(--surface-border)] hover:border-[var(--surface-border-strong)]'
        }`}
      >
        {/* Visual Film Strip / Frame Stacking Cue */}
        <div className="flex items-center justify-center -space-x-3 mb-1">
          <div className="w-14 h-18 rounded-xl bg-[var(--surface-subtle)] border border-[var(--surface-border)] shadow-sm -rotate-6 transform opacity-70 flex items-center justify-center">
            <Film className="w-4 h-4 text-[var(--foreground-muted)]" />
          </div>
          <div className="w-16 h-20 rounded-xl bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/40 shadow-lg rotate-0 z-10 scale-105 flex flex-col items-center justify-center relative">
            <Upload className="w-5 h-5 text-[var(--accent-primary)]" />
            <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-2xs" />
          </div>
          <div className="w-14 h-18 rounded-xl bg-[var(--surface-subtle)] border border-[var(--surface-border)] shadow-sm rotate-6 transform opacity-70 flex items-center justify-center">
            <Film className="w-4 h-4 text-[var(--foreground-muted)]" />
          </div>
        </div>

        {/* Action Title & Spec */}
        <div className="space-y-2 text-center">
          <h1 className="text-base sm:text-lg font-semibold text-[var(--foreground)] tracking-tight">
            動画をドロップ、または選択
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed max-w-sm">
            iPhone 4K HDR・MOV・MP4 対応。ブレのないコマを自動検出し、高解像度写真として書き出します。
          </p>
        </div>

        {fileError && (
          <p className="text-xs text-[var(--accent-primary-text)] bg-[var(--accent-primary-subtle)] px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/30">
            {fileError}
          </p>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm cursor-pointer active:scale-95"
        >
          ファイルを選択
        </button>
      </div>

      {/* Direct Test Options */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8 z-10">
        <button
          type="button"
          onClick={handleDesktopDirectTest}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs"
        >
          <Film className="w-3.5 h-3.5 opacity-70" />
          <span>デスクトップ動画（IMG_8198 2.mov）</span>
        </button>

        <button
          type="button"
          onClick={handleSampleDemo}
          disabled={isProcessing || isGeneratingSample}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs"
        >
          <Play className="w-3.5 h-3.5 opacity-70" />
          <span>{isGeneratingSample ? '生成中...' : 'デモ動画'}</span>
        </button>
      </div>
    </div>
  );
};
