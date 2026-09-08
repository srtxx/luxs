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
  Split,
  Eye,
  Loader2,
  Archive,
  ZoomIn,
  Sparkles,
  Package,
  Columns2,
  Crown,
} from 'lucide-react';
import JSZip from 'jszip';

interface EnhancePreviewProps {
  frame: BurstFrame;
  allFrames?: BurstFrame[];
  favoritedFrames?: BurstFrame[];
  onOpenPrintModal: () => void;
  onOpenProModal: () => void;
}

type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';
type PresetType = 'natural' | 'glow' | 'cinematic' | 'monochrome';

const PRESETS: Record<PresetType, { label: string; desc: string; settings: EnhancementSettings }> = {
  natural: {
    label: 'Natural',
    desc: '自然な透明感と素肌補正',
    settings: { ...defaultEnhancementSettings, sharpness: 50, clarity: 35, brightness: 4, contrast: 8, saturation: 6 },
  },
  glow: {
    label: 'Glow',
    desc: '瞳の輝きと血色感アップ',
    settings: { ...defaultEnhancementSettings, sharpness: 65, clarity: 45, brightness: 8, contrast: 12, saturation: 16 },
  },
  cinematic: {
    label: 'Cinematic',
    desc: '映画のような柔らかい階調',
    settings: { ...defaultEnhancementSettings, sharpness: 55, clarity: 50, brightness: -2, contrast: 15, saturation: -5 },
  },
  monochrome: {
    label: 'Classic B&W',
    desc: '銀塩クラシックなエモい白黒',
    settings: { ...defaultEnhancementSettings, sharpness: 70, clarity: 55, brightness: 2, contrast: 18, saturation: -100 },
  },
};

export const EnhancePreview: React.FC<EnhancePreviewProps> = ({
  frame,
  allFrames = [],
  favoritedFrames = [],
  onOpenPrintModal,
  onOpenProModal,
}) => {
  const [settings, setSettings] = useState<EnhancementSettings>(PRESETS.natural.settings);
  const [activePreset, setActivePreset] = useState<PresetType>('natural');
  const [showAdvancedSliders, setShowAdvancedSliders] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const [isComparing, setIsComparing] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAbMode, setIsAbMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [allDownloadProgress, setAllDownloadProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Pick target frame for A/B comparison (another favorited frame, or previous frame)
  const abTarget =
    favoritedFrames.find((f) => f.id !== frame.id) ||
    allFrames.find((f) => f.id !== frame.id) ||
    frame;

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

  const handleApplyPreset = (presetKey: PresetType) => {
    setActivePreset(presetKey);
    setSettings(PRESETS[presetKey].settings);
  };

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

  // Export current enhanced frame
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

      // Subtle brand watermark for free version
      ctx.save();
      ctx.font = 'bold 15px Didot, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText('LUXS • AURA', canvas.width - 124, canvas.height - 22);
      ctx.restore();

      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timeStr = frame.timestamp.toFixed(2).replace('.', '_');
      link.download = `luxs-aura-${timeStr}s-score${frame.score ?? 0}.png`;
      link.href = downloadUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download all burst frames in a single ZIP
  const handleDownloadAll = async () => {
    const framesToExport = allFrames.length > 0 ? allFrames : [frame];
    if (framesToExport.length === 0) return;

    setIsDownloadingAll(true);
    setAllDownloadProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder('luxs-aura-burst') || zip;
      const sorted = [...framesToExport].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        const seq = String(i + 1).padStart(3, '0');
        const timeStr = f.timestamp.toFixed(2).replace('.', '_');
        const rankStr = f.rank ? `_rank${f.rank}` : '';
        const filename = `aura_${seq}_${timeStr}s_score${f.score ?? 0}${rankStr}.jpg`;

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
      link.download = `luxs-all-burst-${sorted.length}shots.zip`;
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
    <div className="space-y-3.5 animate-fadeIn">
      {/* Integrated Frame Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-white shadow-xl overflow-hidden">
        {/* Card Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-6 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-brand text-sm sm:text-base font-bold text-stone-900">
                  AURA RETOUCH & PREVIEW
                </h3>
                {frame.rank && frame.rank <= 3 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                    {frame.rank === 1 ? 'BEST PICK' : `RANK ${frame.rank}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-mono">
                {frame.timestamp.toFixed(2)}s | 総合スコア: {frame.score ?? 0}pt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* A/B Comparison Toggle */}
            <button
              onClick={() => setIsAbMode(!isAbMode)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                isAbMode
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs font-bold'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              title="2つのコマを左右に並べて比較"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{isAbMode ? '2画面比較中' : '2画面並列比較'}</span>
            </button>

            {/* Zoom / Loupe Toggle */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                isZoomed
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              title="瞳や表情のブレを拡大チェック"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{isZoomed ? '標準表示' : '目元ズーム'}</span>
            </button>

            {/* Before / After Slider Toggle */}
            {!isAbMode && (
              <button
                onClick={() => setIsComparing(!isComparing)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  isComparing
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {isComparing ? <Split className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isComparing ? 'スライダー比較' : '補正後のみ'}</span>
              </button>
            )}

            {/* Reset */}
            <button
              onClick={() => handleApplyPreset('natural')}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              title="設定をリセット"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Viewer Area (Supports Normal Slider or 2-Screen A/B Comparison) */}
        {isAbMode ? (
          /* A/B Side-by-Side Comparison Mode */
          <div className="w-full h-[360px] sm:h-[440px] md:h-[480px] bg-stone-100 grid grid-cols-2 gap-2 p-3 overflow-hidden">
            {/* Left: Current Frame */}
            <div className="relative h-full bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col items-center justify-center p-2">
              <span className="absolute top-2 left-2 z-10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-900 text-white">
                SHOT A: {frame.timestamp.toFixed(2)}s
              </span>
              <img
                src={enhancedUrl || frame.dataUrl}
                alt="Shot A"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Right: Compare Target Frame */}
            <div className="relative h-full bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col items-center justify-center p-2">
              <span className="absolute top-2 left-2 z-10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                SHOT B: {abTarget.timestamp.toFixed(2)}s
              </span>
              <img
                src={abTarget.dataUrl}
                alt="Shot B"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        ) : (
          /* Standard Before/After Slider Viewer */
          <div
            ref={containerRef}
            className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] select-none overflow-hidden cursor-ew-resize bg-stone-100 flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Base: Enhanced Image */}
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${isZoomed ? 'scale-175' : 'scale-100'}`}>
              <img
                src={enhancedUrl || frame.dataUrl}
                alt="Enhanced"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>

            {/* Overlay: Original Image with clip path */}
            {isComparing && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                style={{
                  clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`,
                }}
              >
                <div className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${isZoomed ? 'scale-175' : 'scale-100'}`}>
                  <img
                    src={frame.dataUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Slider Divider Line */}
            {isComparing && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 pointer-events-none shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-amber-500 text-amber-700 flex items-center justify-center shadow-lg">
                  <Split className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Status Badges on Preview */}
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/90 text-stone-800 backdrop-blur-md shadow-xs border border-stone-200/80">
                ORIGINAL (元フレーム)
              </span>
            </div>

            <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-2">
              {isEnhancing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/90 text-amber-800 backdrop-blur-md border border-amber-300 shadow-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  補正中...
                </span>
              )}
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-900 text-white shadow-md">
                AURA ENHANCED
              </span>
            </div>
          </div>
        )}

        {/* Sliders & Controls Area: Placed DIRECTLY below preview with zero gap */}
        <div className="border-t border-stone-200/80 bg-white p-4 sm:p-5 space-y-4">
          {/* Quick Preset Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>アウラ・フィルター:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(PRESETS) as PresetType[]).map((key) => {
                const p = PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleApplyPreset(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 border border-transparent'
                    }`}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                );
              })}

              <button
                onClick={() => setShowAdvancedSliders(!showAdvancedSliders)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ml-1 ${
                  showAdvancedSliders
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-500 border-stone-200 hover:text-stone-800'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{showAdvancedSliders ? '微調整を閉じる' : '微調整スライダー'}</span>
              </button>
            </div>
          </div>

          {/* 4 Fine-tune Sliders (Collapsible / expandable right under preview) */}
          {showAdvancedSliders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 animate-fadeIn">
              {/* Sharpness */}
              <div className="space-y-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70">
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">シャープネス (輪郭)</span>
                  <span className="font-mono font-bold text-amber-800">{settings.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sharpness}
                  onChange={(e) =>
                    setSettings({ ...settings, sharpness: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Clarity */}
              <div className="space-y-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70">
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">明瞭度 (立体感)</span>
                  <span className="font-mono font-bold text-amber-800">{settings.clarity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.clarity}
                  onChange={(e) =>
                    setSettings({ ...settings, clarity: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70">
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">明るさ (透明感)</span>
                  <span className="font-mono font-bold text-amber-800">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={settings.brightness}
                  onChange={(e) =>
                    setSettings({ ...settings, brightness: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70">
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">彩度 (血色感)</span>
                  <span className="font-mono font-bold text-amber-800">{settings.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="40"
                  value={settings.saturation}
                  onChange={(e) =>
                    setSettings({ ...settings, saturation: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export & Commerce Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/90 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Aspect Ratio Selector */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mr-1">
            <Crop className="w-3.5 h-3.5 text-amber-600" />
            <span>サイズ比率:</span>
          </div>

          {[
            { id: 'original', label: 'オリジナル' },
            { id: '1:1', label: '1:1 正方形' },
            { id: '4:5', label: '4:5 ポートレート' },
            { id: '9:16', label: '9:16 リール' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAspectRatio(item.id as AspectRatio)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                aspectRatio === item.id
                  ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-800'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons: AURA PRINT (Physical) + Pro Watermark + ZIP + Single PNG */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">
          {/* Physical Print Button (High Monetization) */}
          <button
            onClick={onOpenPrintModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            title="アクリルブロックやポラロイドカードとして形に残す"
          >
            <Package className="w-4 h-4 text-amber-700" />
            <span>AURA PRINT (形に残す)</span>
          </button>

          {/* Remove Watermark with Pro */}
          <button
            onClick={onOpenProModal}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium text-amber-800 bg-amber-50/60 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            title="透かしを消す・4K超解像"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">透かしを消す</span>
          </button>

          {/* All Frames ZIP Download */}
          {allFrames.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              title="全コマを一括ZIPダウンロード"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                  <span>全件圧縮中 ({allDownloadProgress}%)</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-stone-500" />
                  <span>全{allFrames.length}件保存 (ZIP)</span>
                </>
              )}
            </button>
          )}

          {/* Current Frame PNG Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || !enhancedUrl}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 text-white shadow-md shadow-stone-900/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
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
