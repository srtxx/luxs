'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import {
  enhanceImage,
  EnhancementSettings,
  defaultEnhancementSettings,
} from '@/lib/image-enhancer';
import {
  Sliders,
  Download,
  RotateCcw,
  Crop,
  Zap,
  Split,
  Eye,
  Loader2,
  Archive,
} from 'lucide-react';
import JSZip from 'jszip';

interface EnhancePreviewProps {
  frame: BurstFrame;
  allFrames?: BurstFrame[];
}

type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';

export const EnhancePreview: React.FC<EnhancePreviewProps> = ({ frame, allFrames = [] }) => {
  const [settings, setSettings] = useState<EnhancementSettings>(defaultEnhancementSettings);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const [isComparing, setIsComparing] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [allDownloadProgress, setAllDownloadProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Trigger enhancement whenever frame or settings change
  const runEnhancement = useCallback(async () => {
    setIsEnhancing(true);
    try {
      const result = await enhanceImage(frame.dataUrl, settings);
      setEnhancedUrl(result.dataUrl);
    } catch (err) {
      console.error('Enhancement error:', err);
    } finally {
      setIsEnhancing(false);
    }
  }, [frame.dataUrl, settings]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      runEnhancement();
    }, 120);

    return () => clearTimeout(debounceTimer);
  }, [runEnhancement]);

  // Handle Before/After comparison slider dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    updateSlider(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches[0]) updateSlider(e.touches[0].clientX);
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      updateSlider(e.clientX);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      updateSlider(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Export current enhanced frame with selected Aspect Ratio
  const handleDownload = async () => {
    if (!enhancedUrl) return;
    setIsDownloading(true);

    try {
      const img = new Image();
      img.src = enhancedUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const srcWidth = img.naturalWidth;
      const srcHeight = img.naturalHeight;

      let cropWidth = srcWidth;
      let cropHeight = srcHeight;
      let startX = 0;
      let startY = 0;

      if (aspectRatio === '1:1') {
        const size = Math.min(srcWidth, srcHeight);
        cropWidth = size;
        cropHeight = size;
        startX = (srcWidth - size) / 2;
        startY = (srcHeight - size) / 2;
      } else if (aspectRatio === '4:5') {
        const targetRatio = 4 / 5;
        if (srcWidth / srcHeight > targetRatio) {
          cropWidth = srcHeight * targetRatio;
          cropHeight = srcHeight;
          startX = (srcWidth - cropWidth) / 2;
        } else {
          cropWidth = srcWidth;
          cropHeight = srcWidth / targetRatio;
          startY = (srcHeight - cropHeight) / 2;
        }
      } else if (aspectRatio === '9:16') {
        const targetRatio = 9 / 16;
        if (srcWidth / srcHeight > targetRatio) {
          cropWidth = srcHeight * targetRatio;
          cropHeight = srcHeight;
          startX = (srcWidth - cropWidth) / 2;
        } else {
          cropWidth = srcWidth;
          cropHeight = srcWidth / targetRatio;
          startY = (srcHeight - cropHeight) / 2;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(cropWidth);
      canvas.height = Math.round(cropHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timeStr = frame.timestamp.toFixed(2).replace('.', '_');
      link.download = `luxs-shot-${timeStr}s-score${frame.score ?? 0}.png`;
      link.href = downloadUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download all burst frames in a single ZIP archive
  const handleDownloadAll = async () => {
    const framesToExport = allFrames.length > 0 ? allFrames : [frame];
    if (framesToExport.length === 0) return;

    setIsDownloadingAll(true);
    setAllDownloadProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder('luxs-burst-frames') || zip;

      // Sort frames chronologically for cleaner file naming
      const sorted = [...framesToExport].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        const seq = String(i + 1).padStart(3, '0');
        const timeStr = f.timestamp.toFixed(2).replace('.', '_');
        const rankStr = f.rank ? `_rank${f.rank}` : '';
        const filename = `burst_${seq}_${timeStr}s_score${f.score ?? 0}${rankStr}.jpg`;

        // Extract raw base64 data
        const base64Data = f.dataUrl.split(',')[1];
        if (base64Data) {
          folder.file(filename, base64Data, { base64: true });
        }

        setAllDownloadProgress(Math.round(((i + 1) / sorted.length) * 80));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setAllDownloadProgress(80 + Math.round(metadata.percent * 0.2));
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `luxs-all-burst-${sorted.length}frames.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('Failed to export all frames:', err);
    } finally {
      setIsDownloadingAll(false);
      setAllDownloadProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      {/* Integrated Frame Card: Preview and Sliders tightly combined */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        {/* Card Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  高画質化・レタッチプレビュー
                </h3>
                {frame.rank && frame.rank <= 3 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                    {frame.rank === 1 ? 'TOP 1 PICK' : `RANK ${frame.rank}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {frame.timestamp.toFixed(2)}s | 総合スコア: {frame.score ?? 0}pt (鮮明度: {frame.sharpnessScore ?? 0})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Comparison Mode Toggle */}
            <button
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isComparing
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {isComparing ? <Split className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isComparing ? 'スライダー比較' : '補正後のみ'}</span>
            </button>

            {/* Reset button */}
            <button
              onClick={() => setSettings(defaultEnhancementSettings)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="調整値をリセット"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">リセット</span>
            </button>
          </div>
        </div>

        {/* Main Comparison Viewer (Directly attached above sliders) */}
        <div
          ref={containerRef}
          className="relative w-full h-[360px] sm:h-[440px] md:h-[500px] select-none overflow-hidden cursor-ew-resize bg-slate-950 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Base: Enhanced Image */}
          <img
            src={enhancedUrl || frame.dataUrl}
            alt="Enhanced"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Overlay: Original Image with clip path */}
          {isComparing && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`,
              }}
            >
              <img
                src={frame.dataUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Slider Divider Line */}
          {isComparing && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-[0_0_12px_rgba(251,191,36,0.9)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-xl">
                <Split className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Status Badges on Preview */}
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-700">
              ORIGINAL (元フレーム)
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 pointer-events-none flex items-center gap-2">
            {isEnhancing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 backdrop-blur-md border border-amber-500/30">
                <Loader2 className="w-3 h-3 animate-spin" />
                補正中...
              </span>
            )}
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-md">
              ENHANCED (高画質化)
            </span>
          </div>
        </div>

        {/* Sliders Area: Placed DIRECTLY below preview with zero gap */}
        <div className="border-t border-slate-800 bg-slate-950/90 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>画質・レタッチ微調整スライダー</span>
              <span className="text-[11px] font-normal text-slate-400 normal-case hidden sm:inline">
                (上のプレビューを見ながらリアルタイム調整)
              </span>
            </div>
            {isComparing && (
              <span className="text-[10px] font-mono text-slate-500">
                比較スライダー位置: {sliderPosition}%
              </span>
            )}
          </div>

          {/* 4 Retouch Sliders in 2x2 Grid right under preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Sharpness */}
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">シャープネス</span>
                <span className="font-mono font-bold text-amber-400">{settings.sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sharpness}
                onChange={(e) =>
                  setSettings({ ...settings, sharpness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Clarity */}
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">明瞭度 (立体感)</span>
                <span className="font-mono font-bold text-amber-400">{settings.clarity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.clarity}
                onChange={(e) =>
                  setSettings({ ...settings, clarity: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Brightness */}
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">明るさ (露出)</span>
                <span className="font-mono font-bold text-amber-400">{settings.brightness}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={settings.brightness}
                onChange={(e) =>
                  setSettings({ ...settings, brightness: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">彩度 (鮮やかさ)</span>
                <span className="font-mono font-bold text-amber-400">{settings.saturation}%</span>
              </div>
              <input
                type="range"
                min="-20"
                max="40"
                value={settings.saturation}
                onChange={(e) =>
                  setSettings({ ...settings, saturation: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export & Actions Bar (Aspect ratio selection and Single / All-Download Buttons) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Aspect Ratio Selector */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1">
            <Crop className="w-3.5 h-3.5 text-amber-400" />
            <span>サイズ比率:</span>
          </div>

          {[
            { id: 'original', label: 'オリジナル' },
            { id: '1:1', label: '1:1 正方形' },
            { id: '4:5', label: '4:5 縦型' },
            { id: '9:16', label: '9:16 リール' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAspectRatio(item.id as AspectRatio)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                aspectRatio === item.id
                  ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-semibold shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Download Buttons: Single Frame + ALL Frames in ZIP */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          {/* All Frames ZIP Download Button */}
          {allFrames.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              title="抽出された全コマを一括ZIP保存"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>全件圧縮中 ({allDownloadProgress}%)</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>全{allFrames.length}件を一括保存 (ZIP)</span>
                </>
              )}
            </button>
          )}

          {/* Current Frame PNG Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || !enhancedUrl}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>書き出し中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>このコマを保存 (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
