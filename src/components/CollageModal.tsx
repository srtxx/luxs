'use client';

import React, { useState, useEffect } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Download, Copy, Grid2X2, Check } from 'lucide-react';
import {
  CollageLayout,
  CollageOptions,
  renderCollageCanvas,
} from '@/lib/crop-export';
import { triggerHapticTick } from '@/lib/haptics';

interface CollageModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  favoritedIds: string[];
  enhancedUrl: string | null;
  currentFrameId: string;
}

export const CollageModal: React.FC<CollageModalProps> = ({
  isOpen,
  onClose,
  frames,
  favoritedIds,
  enhancedUrl,
  currentFrameId,
}) => {
  // Select which frames to include (2 to 4 frames)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    let initial = favoritedIds.slice(0, 4);
    if (initial.length < 2) {
      const needed = 2 - initial.length;
      const candidates = frames
        .map((f) => f.id)
        .filter((id) => !initial.includes(id));
      initial = [...initial, ...candidates.slice(0, needed)];
    }
    return initial;
  });

  const [layout, setLayout] = useState<CollageLayout>(() => {
    const len = favoritedIds.length;
    if (len === 3) return 'grid-3-h';
    if (len >= 4) return 'grid-4-sq';
    return 'grid-2-h';
  });

  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [gap, setGap] = useState<number>(14);
  const [bgColor, setBgColor] = useState<string>('#FAF7F2');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Adjust default layout when count changes
  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // minimum 2
        next = prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 4) return prev; // maximum 4
        next = [...prev, id];
      }

      // Auto update layout
      if (next.length === 2) setLayout('grid-2-h');
      else if (next.length === 3) setLayout('grid-3-h');
      else if (next.length === 4) setLayout('grid-4-sq');

      return next;
    });
    triggerHapticTick(1000, 0.02);
  };

  // Re-render preview canvas whenever settings change
  useEffect(() => {
    if (!isOpen || selectedIds.length < 2) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        if (isMounted) setIsRendering(true);
        const imageUrls = selectedIds.map((id) => {
          if (id === currentFrameId && enhancedUrl) {
            return enhancedUrl;
          }
          const f = frames.find((item) => item.id === id);
          return f ? f.dataUrl : '';
        }).filter(Boolean);

        const options: CollageOptions = {
          layout,
          aspectRatio,
          gap,
          borderRadius: gap > 0 ? 12 : 0,
          backgroundColor: bgColor,
        };

        const canvas = await renderCollageCanvas(imageUrls, options);
        if (isMounted) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Render failed
      } finally {
        if (isMounted) setIsRendering(false);
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, selectedIds, layout, aspectRatio, gap, bgColor, frames, enhancedUrl, currentFrameId]);

  if (!isOpen) return null;

  const count = selectedIds.length;

  const handleSavePng = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `luxs_collage_${aspectRatio.replace(':', '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerHapticTick(1500, 0.06);
  };

  const handleCopy = async () => {
    if (!previewUrl) return;
    setIsCopying(true);
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setIsCopied(true);
      triggerHapticTick(1400, 0.05);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Copy failed
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] shadow-2xl flex flex-col overflow-hidden text-[var(--foreground)] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--surface-border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2">
            <Grid2X2 className="w-4 h-4 opacity-70" />
            <h2 className="text-xs font-semibold tracking-wide uppercase">
              組写真の作成
            </h2>
            <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
              ({count}コマ選択中)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Body: Preview & Controls */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Interactive Canvas Preview */}
          <div className="flex-1 bg-[var(--canvas-bg)] p-4 sm:p-6 flex items-center justify-center overflow-hidden relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="組写真プレビュー"
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-[var(--surface-border)] transition-opacity duration-150"
                style={{ opacity: isRendering ? 0.7 : 1 }}
              />
            ) : (
              <div className="text-xs text-[var(--foreground-muted)]">
                レンダリング中...
              </div>
            )}
          </div>

          {/* Right: Inspector & Style Controls */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--surface-border)] bg-[var(--surface)] p-5 space-y-5 overflow-y-auto shrink-0">
            {/* 1. Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">比率</label>
              <div className="grid grid-cols-3 gap-1 bg-[var(--surface-subtle)] p-1 rounded-lg border border-[var(--surface-border)]">
                {(['1:1', '4:5', '9:16'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setAspectRatio(r);
                      triggerHapticTick(950, 0.02);
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      aspectRatio === r
                        ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {r === '1:1' ? '1:1 正方形' : r === '4:5' ? '4:5 縦型' : '9:16 全画面'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Layout Options based on count */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">レイアウト</label>
              <div className="grid grid-cols-2 gap-1.5">
                {count === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-2-h')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-2-h'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      左右2分割
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-2-v')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-2-v'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      上下2分割
                    </button>
                  </>
                )}
                {count === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-3-h')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-3-h'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      横3連ストリップ
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-3-v')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-3-v'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      縦3連
                    </button>
                  </>
                )}
                {count === 4 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-4-sq')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-4-sq'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      2×2 グリッド
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayout('grid-4-h')}
                      className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        layout === 'grid-4-h'
                          ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                          : 'border-[var(--surface-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      横4連ストリップ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. Margin & Gap */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-medium">
                <span>フレーム余白</span>
                <span className="tabular-numbers font-mono">{gap}px</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'なし', val: 0 },
                  { label: '極細', val: 10 },
                  { label: '標準', val: 18 },
                  { label: '広め', val: 28 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setGap(item.val);
                      triggerHapticTick(900, 0.02);
                    }}
                    className={`flex-1 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                      gap === item.val
                        ? 'bg-[var(--surface-subtle)] border-[var(--accent-primary)] text-[var(--foreground)] font-semibold'
                        : 'border-[var(--surface-border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Background Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">背景色</label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'シェル', color: '#FAF7F2' },
                  { label: 'ホワイト', color: '#FFFFFF' },
                  { label: 'ブラッシュ', color: '#FCF6F7' },
                  { label: 'ノワール', color: '#181717' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => {
                      setBgColor(item.color);
                      triggerHapticTick(900, 0.02);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      bgColor === item.color
                        ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30 font-semibold text-[var(--foreground)]'
                        : 'border-[var(--surface-border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-black/15"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Frame Selection Thumbnails */}
            <div className="space-y-2 pt-2 border-t border-[var(--surface-border)]">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>使用コマ（2〜4枚選択）</span>
                <span className="tabular-numbers font-mono">{count} / 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-[var(--surface-subtle)] rounded-xl border border-[var(--surface-border)]">
                {frames.map((frame, idx) => {
                  const isSelected = selectedIds.includes(frame.id);
                  return (
                    <div
                      key={frame.id}
                      onClick={() => handleToggleSelectId(frame.id)}
                      className={`aspect-square relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 scale-95'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={frame.dataUrl}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono">
                        #{idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[var(--surface-border)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            閉じる
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={isCopying || !previewUrl}
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span>画像をコピー</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSavePng}
              disabled={!previewUrl}
              className="flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>組写真を保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
