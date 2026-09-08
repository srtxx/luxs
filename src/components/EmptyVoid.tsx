'use client';

import React, { useState, useRef } from 'react';
import { Upload, Film, Play } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';

interface EmptyVoidProps {
  onVideoSelected: (source: File | Blob | string, options: { intervalSeconds: number; maxFrames: number }) => void;
  isProcessing: boolean;
}

export const EmptyVoid: React.FC<EmptyVoidProps> = ({ onVideoSelected, isProcessing }) => {
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
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 select-none relative overflow-hidden">
      {/* Ambient warm darkroom light glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-b from-stone-800/20 via-amber-950/10 to-transparent blur-3xl pointer-events-none -top-24" />

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
        className={`w-full max-w-xl p-8 sm:p-12 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-6 relative overflow-hidden studio-elevation ${
          isDragOver
            ? 'border-stone-400 bg-[#1A1A1A] scale-[1.01]'
            : 'border-[#282828] bg-[#141414]/90 hover:border-[#3E3E3E] hover:bg-[#181818]'
        }`}
      >
        {/* Visual Film Strip / Frame Stacking Cue */}
        <div className="flex items-center justify-center -space-x-3 mb-1">
          <div className="w-14 h-18 rounded-lg bg-[#222222] border border-[#333333] shadow-md -rotate-6 transform opacity-60 flex items-center justify-center">
            <Film className="w-4 h-4 text-stone-500" />
          </div>
          <div className="w-16 h-20 rounded-lg bg-[#282828] border border-[#444444] shadow-xl rotate-0 z-10 scale-105 flex flex-col items-center justify-center relative">
            <Upload className="w-5 h-5 text-white" />
            <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
          </div>
          <div className="w-14 h-18 rounded-lg bg-[#222222] border border-[#333333] shadow-md rotate-6 transform opacity-60 flex items-center justify-center">
            <Film className="w-4 h-4 text-stone-500" />
          </div>
        </div>

        {/* Action Title & Spec */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">
            動画をドロップ、または選択
          </h1>
          <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
            iPhone 4K HDR・MOV・MP4 対応。ブレのないコマを自動検出し、高解像度写真として書き出します。
          </p>
        </div>

        {fileError && (
          <p className="text-xs text-rose-300 bg-rose-950/60 px-3 py-1.5 rounded-md border border-rose-900/60">
            {fileError}
          </p>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors shadow-sm cursor-pointer"
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] transition-colors cursor-pointer shadow-xs"
        >
          <Film className="w-3.5 h-3.5 text-stone-400" />
          <span>デスクトップ動画（IMG_8198 2.mov）</span>
        </button>

        <button
          type="button"
          onClick={handleSampleDemo}
          disabled={isProcessing || isGeneratingSample}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] transition-colors cursor-pointer shadow-xs"
        >
          <Play className="w-3.5 h-3.5 text-stone-400" />
          <span>{isGeneratingSample ? '生成中...' : 'デモ動画'}</span>
        </button>
      </div>
    </div>
  );
};
