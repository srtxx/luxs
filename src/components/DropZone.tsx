'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, PlayCircle, Sliders, ShieldCheck, Film, Info } from 'lucide-react';
import { generateSampleVideo } from '@/lib/sample-video';

interface DropZoneProps {
  onVideoSelected: (file: File | Blob, options: { intervalSeconds: number; maxFrames: number }) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onVideoSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(0.15);
  const [maxFrames, setMaxFrames] = useState(45);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.endsWith('.mov') || file.name.endsWith('.mp4')) {
        onVideoSelected(file, { intervalSeconds, maxFrames });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onVideoSelected(file, { intervalSeconds, maxFrames });
    }
  };

  const handleSampleDemo = async () => {
    try {
      setIsGeneratingSample(true);
      const sampleBlob = await generateSampleVideo();
      onVideoSelected(sampleBlob, { intervalSeconds: 0.1, maxFrames: 30 });
    } catch (err) {
      console.error('Failed to generate sample:', err);
    } finally {
      setIsGeneratingSample(false);
    }
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
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*"
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
              またはクリックしてファイルを選択（MP4, MOV, WebM対応）
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ブラウザ内で直接処理（外部サーバーへの動画送信なし・完全安全）</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sample Demo Button */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Film className="w-4 h-4 text-amber-400" />
              <span>手元に動画がない場合</span>
            </div>
            <p className="text-xs text-slate-400">
              内蔵のテスト用サンプル動画で即座に動作を体験
            </p>
          </div>
          <button
            type="button"
            onClick={handleSampleDemo}
            disabled={isProcessing || isGeneratingSample}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isGeneratingSample ? '生成中...' : 'サンプルで体験'}</span>
          </button>
        </div>

        {/* Burst Settings */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>バースト抽出の精度設定</span>
            </div>
            <p className="text-xs text-slate-400">
              コマ間隔と最大切り出し枚数
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
              disabled={isProcessing}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value={0.1}>0.10秒（超密）</option>
              <option value={0.15}>0.15秒（標準）</option>
              <option value={0.25}>0.25秒（軽快）</option>
            </select>

            <select
              value={maxFrames}
              onChange={(e) => setMaxFrames(parseInt(e.target.value, 10))}
              disabled={isProcessing}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
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
          <span className="font-semibold text-slate-300">おすすめの利用法: </span>
          スマホで撮影した自撮り・ダンス・ペット・日常Vlog動画などをドロップしてください。
          動きの中で最もピントが合っており、ブレのない奇跡の1コマをAIが自動選出します。
        </div>
      </div>
    </div>
  );
};
