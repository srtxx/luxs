'use client';

import React, { useState, useRef } from 'react';
import { Upload, Sparkles, PlayCircle, Film, ShieldCheck, AlertTriangle } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';

interface DropZoneProps {
  onVideoSelected: (source: File | Blob | string, options: { intervalSeconds: number; maxFrames: number }) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onVideoSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimal default extraction parameters
  const intervalSeconds = 0.15;
  const maxFrames = 45;

  const isValidVideoFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const isVideoExt = /\.(mp4|mov|webm|m4v|mkv|avi|ogv)$/i.test(name);
    const isVideoMime = file.type.startsWith('video/');
    return isVideoExt || isVideoMime;
  };

  const processSelectedFile = (file: File) => {
    setFileError(null);
    if (isValidVideoFile(file)) {
      onVideoSelected(file, { intervalSeconds, maxFrames });
    } else {
      setFileError('対応している動画形式（MP4, MOV, WebM等）をお選びください。');
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
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const handleSampleDemo = async () => {
    try {
      setFileError(null);
      setIsGeneratingSample(true);
      const sampleBlob = await generateSampleVideo();
      onVideoSelected(sampleBlob, { intervalSeconds: 0.1, maxFrames: 30 });
    } catch (err) {
      console.error('Failed to generate sample:', err);
      setFileError('サンプル動画の生成に失敗しました。');
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
    <div className="w-full max-w-2xl mx-auto py-10 sm:py-16 space-y-10 animate-fadeIn select-none text-center">
      {/* Editorial Headline */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/60 border border-amber-200/70 text-amber-900 text-xs font-semibold tracking-widest uppercase shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-700" />
          <span>L&apos;ATELIER D&apos;AURA</span>
        </div>

        <h1 className="font-serif-brand text-3xl sm:text-5xl font-bold tracking-wide text-stone-900 leading-tight">
          動画に眠る、<br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-stone-800 to-amber-600">
            たった一度の奇跡
          </span>
          を。
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          ポーズでは決して作れない、何気ない数秒の動画からこぼれた一番澄んだ笑顔と光の瞬間をすくい上げます。
        </p>
      </div>

      {fileError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Main Sensory Drop Canvas */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group rounded-3xl p-10 sm:p-16 transition-all duration-500 cursor-pointer border flex flex-col items-center justify-center space-y-5 overflow-hidden ${
          isDragOver
            ? 'border-amber-400 bg-amber-50/50 shadow-2xl scale-[1.01]'
            : 'border-stone-200/90 bg-white/90 shadow-xl hover:shadow-2xl hover:border-amber-300'
        }`}
      >
        {/* Ambient Halo Pulse in Background */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-200/30 via-orange-100/20 to-transparent blur-3xl pointer-events-none animate-aura-pulse" />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.MOV,.webm,.m4v"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Sensory Icon */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-stone-100 to-amber-50 border border-stone-200/80 flex items-center justify-center group-hover:scale-108 transition-all duration-300 shadow-sm">
          <Upload className="w-8 h-8 text-stone-700 group-hover:text-amber-800 transition-colors" />
        </div>

        <div className="space-y-1 relative z-10">
          <p className="font-serif-brand text-lg sm:text-xl font-bold text-stone-900">
            動画をそっと置くか、選んでください
          </p>
          <p className="text-xs text-stone-500">
            iPhone 4K HDR・MOV・MP4・WebM 対応 / 端末内で安全に解析
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-[11px] text-stone-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>プライバシー保護: サーバーに動画は残りません</span>
        </div>
      </div>

      {/* Quick Access Trials */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {/* Desktop Direct Test Button */}
        <button
          type="button"
          onClick={handleDesktopDirectTest}
          disabled={isProcessing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-xs font-semibold text-stone-900 bg-amber-200/70 hover:bg-amber-300/80 border border-amber-300/90 shadow-xs transition-all cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-amber-800" />
          <span>デスクトップ動画（IMG_8198 2.mov）で体験</span>
        </button>

        {/* Sample Demo Button */}
        <button
          type="button"
          onClick={handleSampleDemo}
          disabled={isProcessing || isGeneratingSample}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 shadow-xs transition-all cursor-pointer"
        >
          <PlayCircle className="w-3.5 h-3.5 text-stone-500" />
          <span>{isGeneratingSample ? 'サンプル生成中...' : 'デモ動画で体験'}</span>
        </button>
      </div>
    </div>
  );
};
