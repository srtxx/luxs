'use client';

import React, { useState, useRef, useCallback } from 'react';
import { BurstFrame } from '@/lib/video-burst';
import { X, Check, Columns2, Sliders, Heart, ZoomIn } from 'lucide-react';
import { triggerHapticTick } from '@/lib/haptics';

interface CompareSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BurstFrame[];
  currentIndex: number;
  onSelectWinningIndex: (index: number) => void;
  favoritedIds: string[];
  onToggleFavorite: (frameId: string) => void;
  recommendedIndices: number[];
}

type ViewMode = 'side-by-side' | 'split-wipe';

export const CompareSplitModal: React.FC<CompareSplitModalProps> = ({
  isOpen,
  onClose,
  frames,
  currentIndex,
  onSelectWinningIndex,
  favoritedIds,
  onToggleFavorite,
  recommendedIndices,
}) => {
  // Select initial frame A and B
  const [indexA, setIndexA] = useState<number>(() => currentIndex);
  const [indexB, setIndexB] = useState<number>(() => {
    // Pick another recommended frame, or adjacent frame
    const otherRec = recommendedIndices.find((idx) => idx !== currentIndex);
    if (otherRec !== undefined) return otherRec;
    if (currentIndex + 1 < frames.length) return currentIndex + 1;
    if (currentIndex - 1 >= 0) return currentIndex - 1;
    return 0;
  });

  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('B');
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoord, setZoomCoord] = useState({ x: 50, y: 50 });

  const isDraggingSplitRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const frameA = frames[indexA] || frames[0];
  const frameB = frames[indexB] || frames[frames.length > 1 ? 1 : 0];

  const handlePointerDownSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSplitRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSplit = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitRef.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (rawX / rect.width) * 100));
    setSplitPos(pct);
  }, []);

  const handlePointerUpSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSplitRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoord({ x, y });
  };

  const handlePickWinner = (winnerIndex: number) => {
    onSelectWinningIndex(winnerIndex);
    triggerHapticTick(1400, 0.05);
    onClose();
  };

  const handleReplaceSlot = (newIndex: number) => {
    if (activeSlot === 'A') {
      setIndexA(newIndex);
    } else {
      setIndexB(newIndex);
    }
    triggerHapticTick(1100, 0.03);
  };

  if (!isOpen || !frameA || !frameB) return null;

  const isFavA = favoritedIds.includes(frameA.id);
  const isFavB = favoritedIds.includes(frameB.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#121212] rounded-2xl border border-[#242424] shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#161616]">
          <div className="flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-stone-400" />
            <h2 className="text-xs font-semibold tracking-wide text-white uppercase">
              2コマ決選比較
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#202020] p-0.5 rounded-lg border border-[#2c2c2c]">
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'side-by-side'
                  ? 'bg-[#2E2E2E] text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Columns2 className="w-3 h-3" />
              並列比較
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split-wipe')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'split-wipe'
                  ? 'bg-[#2E2E2E] text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              スプリットワイプ
            </button>
          </div>

          {/* Zoom Toggle & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isZoomed
                  ? 'bg-white text-black'
                  : 'text-stone-400 hover:text-white hover:bg-[#242424]'
              }`}
              title="ルーペ拡大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Comparison Area */}
        <div className="flex-1 min-h-0 bg-[#0A0A0A] p-4 flex items-center justify-center overflow-hidden">
          {viewMode === 'side-by-side' ? (
            <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Frame A */}
              <div
                onClick={() => setActiveSlot('A')}
                className={`relative h-full flex flex-col rounded-xl overflow-hidden bg-[#141414] border transition-all ${
                  activeSlot === 'A'
                    ? 'border-amber-500/70 ring-1 ring-amber-500/40 shadow-xl'
                    : 'border-[#262626] hover:border-stone-600'
                }`}
              >
                {/* Image */}
                <div
                  onMouseMove={handleMouseMove}
                  className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-black overflow-hidden"
                >
                  <img
                    src={frameA.dataUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-100"
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${zoomCoord.x}% ${zoomCoord.y}%`,
                            transform: 'scale(2.2)',
                          }
                        : undefined
                    }
                  />

                  {/* Slot Tag */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-stone-300 backdrop-blur-xs flex items-center gap-1.5">
                    <span className="font-semibold text-white">候補 A</span>
                    <span className="text-stone-400">#{indexA + 1}</span>
                    <span className="text-stone-500">{frameA.timestamp.toFixed(2)}s</span>
                  </div>

                  {/* Favorite */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(frameA.id);
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                      isFavA ? 'bg-rose-500/80 text-white' : 'bg-black/60 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavA ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Bottom Action for A */}
                <div className="p-3 bg-[#181818] border-t border-[#222222] flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {activeSlot === 'A' ? '編集中（下の写真で差替可能）' : 'タップして差替'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePickWinner(indexA)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    こちらを採用
                  </button>
                </div>
              </div>

              {/* Frame B */}
              <div
                onClick={() => setActiveSlot('B')}
                className={`relative h-full flex flex-col rounded-xl overflow-hidden bg-[#141414] border transition-all ${
                  activeSlot === 'B'
                    ? 'border-amber-500/70 ring-1 ring-amber-500/40 shadow-xl'
                    : 'border-[#262626] hover:border-stone-600'
                }`}
              >
                {/* Image */}
                <div
                  onMouseMove={handleMouseMove}
                  className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-black overflow-hidden"
                >
                  <img
                    src={frameB.dataUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-100"
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${zoomCoord.x}% ${zoomCoord.y}%`,
                            transform: 'scale(2.2)',
                          }
                        : undefined
                    }
                  />

                  {/* Slot Tag */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-stone-300 backdrop-blur-xs flex items-center gap-1.5">
                    <span className="font-semibold text-white">候補 B</span>
                    <span className="text-stone-400">#{indexB + 1}</span>
                    <span className="text-stone-500">{frameB.timestamp.toFixed(2)}s</span>
                  </div>

                  {/* Favorite */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(frameB.id);
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                      isFavB ? 'bg-rose-500/80 text-white' : 'bg-black/60 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavB ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Bottom Action for B */}
                <div className="p-3 bg-[#181818] border-t border-[#222222] flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {activeSlot === 'B' ? '編集中（下の写真で差替可能）' : 'タップして差替'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePickWinner(indexB)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    こちらを採用
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Split Wipe View */
            <div
              ref={splitContainerRef}
              onPointerDown={handlePointerDownSplit}
              onPointerMove={handlePointerMoveSplit}
              onPointerUp={handlePointerUpSplit}
              className="relative w-full max-w-2xl h-full flex items-center justify-center rounded-xl overflow-hidden bg-black border border-[#262626] cursor-ew-resize select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Bottom Layer: Frame B */}
              <img
                src={frameB.dataUrl}
                alt=""
                className="max-h-full max-w-full object-contain pointer-events-none"
              />

              {/* Top Layer: Frame A (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
              >
                <img
                  src={frameA.dataUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black shadow-md flex items-center justify-center text-[10px] font-bold">
                  VS
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-stone-300">
                A: #{indexA + 1}
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-stone-300">
                B: #{indexB + 1}
              </div>

              {/* Bottom Quick Winner Buttons */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => handlePickWinner(indexA)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-black bg-white/90 hover:bg-white shadow-lg cursor-pointer transition-colors"
                >
                  Aを採用 (#{indexA + 1})
                </button>
                <button
                  type="button"
                  onClick={() => handlePickWinner(indexB)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-black bg-white/90 hover:bg-white shadow-lg cursor-pointer transition-colors"
                >
                  Bを採用 (#{indexB + 1})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Replacement Tray */}
        <div className="px-5 py-3 border-t border-[#202020] bg-[#141414] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-400">
              枠「{activeSlot === 'A' ? 'A' : 'B'}」に入れるフレームを選択：
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              全 {frames.length} コマ
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {frames.map((f, idx) => {
              const isSelectedA = idx === indexA;
              const isSelectedB = idx === indexB;
              const isRec = recommendedIndices.includes(idx);

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleReplaceSlot(idx)}
                  className={`relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all cursor-pointer ${
                    isSelectedA
                      ? 'border-white ring-2 ring-white/50'
                      : isSelectedB
                      ? 'border-amber-400 ring-2 ring-amber-400/50'
                      : 'border-[#2c2c2c] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={f.dataUrl} alt="" className="w-full h-full object-cover" />
                  {isRec && (
                    <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                  {isSelectedA && (
                    <span className="absolute top-0.5 left-0.5 px-0.5 rounded bg-black/80 text-[8px] font-bold text-white leading-none">
                      A
                    </span>
                  )}
                  {isSelectedB && (
                    <span className="absolute top-0.5 left-0.5 px-0.5 rounded bg-amber-500 text-[8px] font-bold text-black leading-none">
                      B
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
