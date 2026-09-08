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
      setFileError('対応している動画ファイル（MP4, MOV, WebM）を選択してください。');
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
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.MOV,.webm,.m4v"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`w-full max-w-xl p-10 sm:p-16 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-6 ${
          isDragOver
            ? 'border-white bg-[#1A1A1A] scale-[1.01]'
            : 'border-[#262626] bg-[#121212] hover:border-[#404040] hover:bg-[#161616]'
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center text-stone-300">
          <Upload className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 text-center">
          <p className="text-base font-semibold text-white">
            動画をドロップ、または選択
          </p>
          <p className="text-xs text-stone-500">
            MP4, MOV, WebM 対応（iPhone 4K HDR 自動最適化）
          </p>
        </div>

        {fileError && (
          <p className="text-xs text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-md border border-rose-900/50">
            {fileError}
          </p>
        )}

        <button
          type="button"
          className="px-5 py-2 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors cursor-pointer"
        >
          ファイルを選択
        </button>
      </div>

      {/* Quick Access Tests */}
      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={handleDesktopDirectTest}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-white bg-[#161616] hover:bg-[#202020] border border-[#262626] transition-colors cursor-pointer"
        >
          <Film className="w-3.5 h-3.5" />
          <span>デスクトップ動画（IMG_8198 2.mov）</span>
        </button>

        <button
          type="button"
          onClick={handleSampleDemo}
          disabled={isProcessing || isGeneratingSample}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-white bg-[#161616] hover:bg-[#202020] border border-[#262626] transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{isGeneratingSample ? '生成中...' : 'デモ動画'}</span>
        </button>
      </div>
    </div>
  );
};
