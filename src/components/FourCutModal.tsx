'use client';

import React, { useState } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Download, LayoutTemplate } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

interface FourCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  currentIndex: number;
  favoritedIds: string[];
  recommendedIndices: number[];
}

type CardTheme = 'charcoal' | 'white' | 'stone';

const THEMES: { id: CardTheme; label: string; bg: string; text: string; border: string }[] = [
  { id: 'charcoal', label: 'チャコール', bg: '#121212', text: '#E5E5E5', border: '#262626' },
  { id: 'white', label: 'ピュアホワイト', bg: '#FFFFFF', text: '#1A1A1A', border: '#E0E0E0' },
  { id: 'stone', label: 'ストーングレー', bg: '#EAEAEA', text: '#202020', border: '#CCCCCC' },
];

export const FourCutModal: React.FC<FourCutModalProps> = ({
  isOpen,
  onClose,
  frames,
  currentIndex,
  favoritedIds,
  recommendedIndices,
}) => {
  // Select initial 4 frames
  const getInitialSlots = (): number[] => {
    const slots: number[] = [];
    // Priority 1: Favorited frames
    const favIndices = frames
      .map((f, i) => (favoritedIds.includes(f.id) ? i : -1))
      .filter((i) => i !== -1);

    for (const idx of favIndices) {
      if (slots.length < 4 && !slots.includes(idx)) slots.push(idx);
    }

    // Priority 2: Recommended frames
    for (const idx of recommendedIndices) {
      if (slots.length < 4 && !slots.includes(idx)) slots.push(idx);
    }

    // Priority 3: Current index and neighbors
    const seq = [currentIndex, currentIndex + 1, currentIndex + 2, currentIndex + 3];
    for (const idx of seq) {
      if (slots.length < 4 && idx < frames.length && !slots.includes(idx)) {
        slots.push(idx);
      }
    }

    // Priority 4: Fill from start
    let fill = 0;
    while (slots.length < 4 && fill < frames.length) {
      if (!slots.includes(fill)) slots.push(fill);
      fill++;
    }

    return slots;
  };

  const [slotIndices, setSlotIndices] = useState<number[]>(getInitialSlots);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [theme, setTheme] = useState<CardTheme>('charcoal');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  const handleSlotClick = (slotIdx: number) => {
    setActiveSlot(slotIdx);
    triggerHapticTick(1100, 0.03);
  };

  const handleReplaceSlot = (frameIndex: number) => {
    setSlotIndices((prev) => {
      const next = [...prev];
      next[activeSlot] = frameIndex;
      return next;
    });
    triggerHapticTick(1200, 0.04);
  };

  // Export 4-Cut photo as high-res PNG via Canvas
  const handleExport = async () => {
    setIsExporting(true);
    triggerHapticTick(1400, 0.05);

    try {
      // 1. Create canvas with classic photo strip proportions (e.g., 1080 x 2880)
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 2880;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      // 2. Background
      ctx.fillStyle = currentTheme.bg;
      ctx.fillRect(0, 0, width, height);

      // 3. Dimensions & Padding
      const padX = 72;
      const padTop = 96;
      const gap = 36;
      const photoWidth = width - padX * 2;
      const photoHeight = Math.round((photoWidth * 3) / 4); // 4:3 aspect for each cell

      // 4. Load & draw 4 images
      for (let i = 0; i < 4; i++) {
        const frameIdx = slotIndices[i] ?? 0;
        const frame = frames[frameIdx];
        if (!frame) continue;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = frame.dataUrl;
        });

        const y = padTop + i * (photoHeight + gap);

        // Draw image cover-cropped into rect
        const imgAspect = img.width / img.height;
        const targetAspect = photoWidth / photoHeight;
        let sx = 0,
          sy = 0,
          sw = img.width,
          sh = img.height;

        if (imgAspect > targetAspect) {
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, padX, y, photoWidth, photoHeight);
      }

      // 5. Typography / Branding footer
      const footerY = height - 120;
      ctx.fillStyle = currentTheme.text;
      ctx.textAlign = 'center';

      // Title
      ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif';
      ctx.fillText('LUXS PHOTO STRIP', width / 2, footerY);

      // Date stamp
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
        now.getDate()
      ).padStart(2, '0')}`;
      ctx.font = '400 22px "SF Mono", Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = currentTheme.text === '#FFFFFF' || currentTheme.text === '#E5E5E5' ? '#888888' : '#777777';
      ctx.fillText(dateStr, width / 2, footerY + 44);

      // 6. Download
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luxs_4cut_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // Export failed
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[#121212] rounded-2xl border border-[#242424] shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#161616]">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-stone-400" />
            <h2 className="text-xs font-semibold tracking-wide text-white uppercase">
              4カットフォト作成
            </h2>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-[#202020] p-0.5 rounded-lg border border-[#2c2c2c]">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  theme === t.id
                    ? 'bg-[#2E2E2E] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Canvas Preview Area */}
        <div className="flex-1 min-h-0 bg-[#0A0A0A] p-4 flex items-center justify-center overflow-hidden">
          {/* Vertical Photo Strip Box */}
          <div
            className="h-full max-h-[62vh] aspect-[1/2.8] rounded-xl shadow-2xl p-3 sm:p-4 flex flex-col justify-between transition-colors duration-200 border"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
            }}
          >
            {/* 4 Photo Slots */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const frameIdx = slotIndices[slotIdx] ?? 0;
                const frame = frames[frameIdx];
                const isActive = activeSlot === slotIdx;

                return (
                  <div
                    key={slotIdx}
                    onClick={() => handleSlotClick(slotIdx)}
                    className={`relative flex-1 rounded-md overflow-hidden bg-black/40 cursor-pointer border transition-all ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                        : 'border-transparent hover:border-stone-400'
                    }`}
                  >
                    {frame && (
                      <img
                        src={frame.dataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-amber-400/10 flex items-center justify-center pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                          編集中 #{slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer stamp */}
            <div
              className="pt-2 text-center select-none"
              style={{ color: currentTheme.text }}
            >
              <p className="text-[10px] font-semibold tracking-wider uppercase">
                LUXS PHOTO STRIP
              </p>
              <p className="text-[8px] font-mono opacity-60">
                2026.09.09
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Replacement Strip */}
        <div className="px-5 py-3 border-t border-[#202020] bg-[#141414] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-stone-400">
                枠 #{activeSlot + 1} に入れる写真を選択：
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                全 {frames.length} コマ
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {frames.map((f, idx) => {
                const isUsedInAnySlot = slotIndices.includes(idx);
                const isCurrentActive = slotIndices[activeSlot] === idx;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleReplaceSlot(idx)}
                    className={`relative shrink-0 w-11 h-11 rounded-md overflow-hidden border transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'border-amber-400 ring-2 ring-amber-400/50'
                        : isUsedInAnySlot
                        ? 'border-white/40 opacity-75'
                        : 'border-[#2c2c2c] opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={f.dataUrl} alt="" className="w-full h-full object-cover" />
                    {isUsedInAnySlot && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? '生成中...' : '4カット画像を保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
