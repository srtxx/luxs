'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, PlayCircle, Sliders, ShieldCheck, Film, Info, AlertTriangle } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';

interface DropZoneProps {
  onVideoSelected: (source: File | Blob | string, options: { intervalSeconds: number; maxFrames: number }) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onVideoSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(0.15);
  const [maxFrames, setMaxFrames] = useState(45);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="w-full max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8 animate-fadeIn">
      {/* Hero Title Section */}
      <div className="text-center space-y-3 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/80 text-amber-900 text-xs font-semibold tracking-wider uppercase shadow-xs">
          <span>PORTRAIT & AURA DISCOVERY</span>
        </div>

        <h1 className="font-serif-brand text-3xl sm:text-5xl font-bold tracking-wide text-stone-900 leading-tight">
          動画に宿る、<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600">奇跡の瞬間</span>を。
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          自然に動いている何気ない数秒の動画から、ポーズでは作れない一番美しい表情や澄んだまなざしをAIが丁寧に見つけ出し、息を呑む最高画質で届けます。
        </p>
      </div>

      {fileError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 cursor-pointer select-none group border-2 border-dashed bg-white shadow-lg ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/40 scale-[1.01] shadow-xl'
            : 'border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.MOV,.webm,.m4v"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-50 border border-amber-200/80 flex items-center justify-center group-hover:scale-110 group-hover:border-amber-400 transition-all shadow-xs">
            <UploadCloud className="w-8 h-8 text-amber-700 group-hover:text-amber-600 transition-colors" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-stone-900 tracking-wide">
              動画をここにドロップしてください
            </p>
            <p className="text-xs sm:text-sm text-stone-500">
              またはタップしてカメラロール・フォルダから選択
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-[11px] text-stone-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>iPhone 4K HDR・MOV・MP4 完全対応 / プライバシー完全保護</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Precision Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Desktop Direct Test Button */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Film className="w-3.5 h-3.5 text-amber-600" />
              <span>デスクトップ動画</span>
            </div>
            <p className="text-[11px] text-stone-500 truncate" title="IMG_8198 2.mov">
              IMG_8198 2.mov を直接開く
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDesktopDirectTest();
            }}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-300 to-amber-200 hover:from-amber-400 hover:to-amber-300 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>この動画を即テスト</span>
          </button>
        </div>

        {/* Sample Demo Button */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>デモ動画で体験</span>
            </div>
            <p className="text-[11px] text-stone-500">
              テスト用動画を自動生成
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSampleDemo();
            }}
            disabled={isProcessing || isGeneratingSample}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isGeneratingSample ? '生成中...' : 'サンプルで体験'}</span>
          </button>
        </div>

        {/* Precision Setting */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Sliders className="w-3.5 h-3.5 text-stone-500" />
              <span>連写の密度設定</span>
            </div>
            <p className="text-[11px] text-stone-500">
              コマを切り出す細かさ
            </p>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
              disabled={isProcessing}
              className="flex-1 text-xs bg-stone-100 border border-stone-200 text-stone-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={0.1}>0.10秒（超密）</option>
              <option value={0.15}>0.15秒（標準）</option>
              <option value={0.25}>0.25秒（軽快）</option>
            </select>

            <select
              value={maxFrames}
              onChange={(e) => setMaxFrames(parseInt(e.target.value, 10))}
              disabled={isProcessing}
              className="flex-1 text-xs bg-stone-100 border border-stone-200 text-stone-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={30}>30枚</option>
              <option value={45}>45枚</option>
              <option value={60}>60枚</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gentle Tips */}
      <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-200/60 text-xs text-stone-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-800">おすすめの使い方: </span>
          スマホで数秒〜十数秒撮影した自撮り・笑顔・おでかけ・ペット・推しの動画をそのまま入れてみてください。ブレのない奇跡の笑顔や決定的な瞬間を自動で見つけ出します。
        </div>
      </div>
    </div>
  );
};
