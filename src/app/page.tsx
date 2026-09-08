'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { BestPicksPanel } from '@/components/BestPicksPanel';
import { BurstFilmstrip } from '@/components/BurstFilmstrip';
import { EnhancePreview } from '@/components/EnhancePreview';
import { ProModal } from '@/components/ProModal';
import { PrintOrderModal } from '@/components/PrintOrderModal';
import { extractBurstFrames, BurstFrame } from '@/lib/video-burst';
import { scoreAllFrames } from '@/lib/image-scoring';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [stage, setStage] = useState<'idle' | 'extracting' | 'scoring' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [frames, setFrames] = useState<BurstFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVideoSelected = async (
    videoSource: File | Blob | string,
    options: { intervalSeconds: number; maxFrames: number }
  ) => {
    setErrorMessage(null);
    setStage('extracting');
    setProgress(10);
    setProgressCurrent(0);
    setProgressTotal(options.maxFrames);

    try {
      let extracted: BurstFrame[] = [];

      // Strategy 1: Native Server API (AVFoundation hardware decoding, 100% reliable for iPhone 4K HDR/HEVC MOV)
      try {
        if (typeof videoSource === 'string') {
          const res = await fetch('/api/extract-burst', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: videoSource,
              intervalSeconds: options.intervalSeconds,
              maxFrames: options.maxFrames,
              maxWidth: 720,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.frames && data.frames.length > 0) {
              extracted = data.frames;
            }
          }
        } else if (videoSource instanceof File || videoSource instanceof Blob) {
          const formData = new FormData();
          formData.append('video', videoSource);
          formData.append('intervalSeconds', String(options.intervalSeconds));
          formData.append('maxFrames', String(options.maxFrames));
          formData.append('maxWidth', '720');

          const res = await fetch('/api/extract-burst', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.frames && data.frames.length > 0) {
              extracted = data.frames;
            }
          }
        }
      } catch (apiErr) {
        console.warn('Native extraction API fallback to client-side:', apiErr);
      }

      // Strategy 2: Fallback to client-side HTML5 Video + Canvas extraction
      if (extracted.length === 0) {
        extracted = await extractBurstFrames(videoSource, {
          intervalSeconds: options.intervalSeconds,
          maxFrames: options.maxFrames,
          onProgress: (p, cur, tot) => {
            setProgress(p);
            setProgressCurrent(cur);
            setProgressTotal(tot);
          },
        });
      }

      if (extracted.length === 0) {
        throw new Error('動画からフレームを抽出できませんでした。別の動画をお試しください。');
      }

      // Step 2: Intelligent scoring (Variance of Laplacian & exposure analysis)
      setStage('scoring');
      setProgress(0);

      const scored = await scoreAllFrames(extracted, (p, cur, tot) => {
        setProgress(p);
        setProgressCurrent(cur);
        setProgressTotal(tot);
      });

      setFrames(scored);

      // Select top 1 frame by default
      const bestFrame = scored.find((f) => f.rank === 1) || scored[0];
      setSelectedFrameId(bestFrame.id);
      setFavoritedIds([bestFrame.id]);
      setStage('ready');
    } catch (err: unknown) {
      console.error('Processing error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : '動画の処理中にエラーが発生しました。対応形式（MP4, MOV, WebM）をご確認ください。'
      );
      setStage('idle');
    }
  };

  const handleToggleFavorite = (frameId: string) => {
    setFavoritedIds((prev) =>
      prev.includes(frameId) ? prev.filter((id) => id !== frameId) : [...prev, frameId]
    );
  };

  const handleReset = () => {
    setStage('idle');
    setFrames([]);
    setSelectedFrameId(null);
    setFavoritedIds([]);
    setErrorMessage(null);
  };

  const selectedFrame = frames.find((f) => f.id === selectedFrameId) || frames[0];
  const favoritedFrames = frames.filter((f) => favoritedIds.includes(f.id));

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans">
      <Header
        hasVideo={stage === 'ready'}
        onReset={handleReset}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs sm:text-sm shadow-xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Initial / Idle Stage: DropZone */}
        {stage === 'idle' && (
          <DropZone onVideoSelected={handleVideoSelected} isProcessing={false} />
        )}

        {/* Processing Stage: Extracting or Scoring */}
        {(stage === 'extracting' || stage === 'scoring') && (
          <ProcessingProgress
            stage={stage}
            progress={progress}
            current={progressCurrent}
            total={progressTotal}
          />
        )}

        {/* Ready Stage: Complete Dashboard */}
        {stage === 'ready' && selectedFrame && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Recommended Picks */}
            <BestPicksPanel
              frames={frames}
              selectedFrameId={selectedFrameId}
              favoritedIds={favoritedIds}
              onSelectFrame={(f) => setSelectedFrameId(f.id)}
              onToggleFavorite={handleToggleFavorite}
            />

            {/* Main Preview with Before/After Slider & Retouching */}
            <EnhancePreview
              frame={selectedFrame}
              allFrames={frames}
              favoritedFrames={favoritedFrames}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onOpenProModal={() => setIsProModalOpen(true)}
            />

            {/* Burst Filmstrip Timeline */}
            <BurstFilmstrip
              frames={frames}
              selectedFrameId={selectedFrameId}
              favoritedIds={favoritedIds}
              onSelectFrame={(f) => setSelectedFrameId(f.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </main>

      {/* Pro Modal */}
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />

      {/* Print Order Modal */}
      {selectedFrame && (
        <PrintOrderModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          frame={selectedFrame}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/50 py-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-serif-brand font-bold text-stone-700 tracking-wider">
            LUXS • AURA OF A MOMENT
          </p>
          <p className="text-[11px] text-stone-400">
            複製技術の奔流から、いま・ここにしかない奇跡の一瞬を救い出す。
          </p>
        </div>
      </footer>
    </div>
  );
}
