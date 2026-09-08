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
      setFileError('選択されたファイルは対応動画形式（MP4, MOV, WebM等）ではありません。');
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3 pt-6 pb-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          動画から<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">奇跡の瞬間</span>を切り取る
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          動画を自動バースト（連写）分解し、AI鮮明度解析でブレのないベストフレームを検出。
          高画質化・レタッチを施してSNS用のベストショットを生成します。
        </p>
      </div>

      {fileError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none group ${
          isDragOver
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
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
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:border-amber-500/50 transition-all shadow-xl">
            <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-amber-400 transition-colors" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-semibold text-slate-100">
              Desktop等の動画ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              またはクリックしてファイルを選択（iPhone 4K HDR MOV, MP4, WebM完全対応）
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Apple Silicon ハードウェア支援による4K高精細フレーム抽出</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Desktop Direct Test Button */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Film className="w-4 h-4 text-amber-400" />
              <span>デスクトップ動画テスト</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate" title="IMG_8198 2.mov">
              IMG_8198 2.mov を直接テスト
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDesktopDirectTest();
            }}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>この動画を即テスト</span>
          </button>
        </div>

        {/* Sample Demo Button */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>内蔵サンプル動画</span>
            </div>
            <p className="text-[11px] text-slate-400">
              テスト用動画をブラウザで生成
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSampleDemo();
            }}
            disabled={isProcessing || isGeneratingSample}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isGeneratingSample ? '生成中...' : 'サンプルで体験'}</span>
          </button>
        </div>

        {/* Burst Settings */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>連写設定</span>
            </div>
            <p className="text-[11px] text-slate-400">
              コマ間隔と最大切り出し枚数
            </p>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
              disabled={isProcessing}
              className="flex-1 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={0.1}>0.10秒（超密）</option>
              <option value={0.15}>0.15秒（標準）</option>
              <option value={0.25}>0.25秒（軽快）</option>
            </select>

            <select
              value={maxFrames}
              onChange={(e) => setMaxFrames(parseInt(e.target.value, 10))}
              disabled={isProcessing}
              className="flex-1 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={30}>30コマ</option>
              <option value={45}>45コマ</option>
              <option value={60}>60コマ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="flex items-start gap-2 p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
        <Info className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">iPhone HDR / 4K動画対応: </span>
          iPhoneで撮影された4K HDR (Dolby Vision) MOV動画も、ネイティブ映像エンジンにより完全な色再現度と鮮明さでフレーム抽出されます。
        </div>
      </div>
    </div>
  );
};
