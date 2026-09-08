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
  Check,
  Zap,
  Split,
  Eye,
  Loader2,
} from 'lucide-react';

interface EnhancePreviewProps {
  frame: BurstFrame;
}

type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';

export const EnhancePreview: React.FC<EnhancePreviewProps> = ({ frame }) => {
  const [settings, setSettings] = useState<EnhancementSettings>(defaultEnhancementSettings);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const [isComparing, setIsComparing] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [isDownloading, setIsDownloading] = useState(false);

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
    }, 150);

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

  // Export & Download with selected Aspect Ratio
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

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                高画質化・レタッチプレビュー
              </h3>
              {frame.rank && frame.rank <= 3 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  {frame.rank === 1 ? 'TOP 1 PICK' : `RANK ${frame.rank}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              フレーム秒数: {frame.timestamp.toFixed(2)}s | 総合スコア: {frame.score ?? 0}pt
              （鮮明度: {frame.sharpnessScore ?? 0}）
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Comparison Mode Toggle */}
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isComparing
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            {isComparing ? <Split className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isComparing ? '比較スライダー表示' : '補正後のみ表示'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={() => setSettings(defaultEnhancementSettings)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
            title="調整値をリセット"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">リセット</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Viewer */}
      <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <div
          ref={containerRef}
          className="relative w-full aspect-video select-none overflow-hidden cursor-ew-resize"
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
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none shadow-[0_0_10px_rgba(251,191,36,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-xl">
                <Split className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-700">
              ORIGINAL (元フレーム)
            </span>
          </div>

          <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-2">
            {isEnhancing && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950/80 text-amber-400 backdrop-blur-md border border-amber-500/30">
                <Loader2 className="w-3 h-3 animate-spin" />
                処理中...
              </span>
            )}
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-amber-400 text-slate-950 shadow-md">
              ENHANCED (高画質化)
            </span>
          </div>
        </div>
      </div>

      {/* Controls & Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Sliders */}
        <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-200">
              画質・レタッチ微調整
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Sharpness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>シャープネス (輪郭強調)</span>
                <span className="font-mono text-amber-400">{settings.sharpness}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>明瞭度 (立体感・コントラスト)</span>
                <span className="font-mono text-amber-400">{settings.clarity}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>明るさ (露出補正)</span>
                <span className="font-mono text-amber-400">{settings.brightness}%</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>彩度 (色の鮮やかさ)</span>
                <span className="font-mono text-amber-400">{settings.saturation}%</span>
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

        {/* SNS Aspect Ratio & Export */}
        <div className="space-y-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Crop className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">
                SNS書き出しサイズ
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'original', label: 'オリジナル比率', desc: '動画そのまま' },
                { id: '1:1', label: '1:1 正方形', desc: 'Instagram フィード' },
                { id: '4:5', label: '4:5 ポートレート', desc: 'Instagram 縦型' },
                { id: '9:16', label: '9:16 フル縦型', desc: 'Stories / TikTok' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAspectRatio(item.id as AspectRatio)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    aspectRatio === item.id
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>{item.label}</span>
                    {aspectRatio === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading || !enhancedUrl}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>書き出し中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>高画質画像を保存 (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
