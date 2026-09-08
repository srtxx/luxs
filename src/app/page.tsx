'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { BestPicksPanel } from '@/components/BestPicksPanel';
import { BurstFilmstrip } from '@/components/BurstFilmstrip';
import { EnhancePreview } from '@/components/EnhancePreview';
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

      // Strategy 1: Try Native Server API (AVFoundation hardware decoding, 100% reliable for iPhone HDR/HEVC MOV)
      try {
        if (typeof videoSource === 'string') {
          // Direct file path
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
        console.warn('Native extraction API error, falling back to client-side:', apiErr);
      }

      // Strategy 2: Fallback to client-side HTML5 Video + Canvas extraction if needed
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

  const handleReset = () => {
    setStage('idle');
    setFrames([]);
    setSelectedFrameId(null);
    setErrorMessage(null);
  };

  const selectedFrame = frames.find((f) => f.id === selectedFrameId) || frames[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header hasVideo={stage === 'ready'} onReset={handleReset} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
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
              onSelectFrame={(f) => setSelectedFrameId(f.id)}
            />

            {/* Main Preview with Before/After Slider & Retouching */}
            <EnhancePreview frame={selectedFrame} />

            {/* Burst Filmstrip Timeline */}
            <BurstFilmstrip
              frames={frames}
              selectedFrameId={selectedFrameId}
              onSelectFrame={(f) => setSelectedFrameId(f.id)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>LUXS - Video Burst Shot Picker & Quality Booster</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Hardware-accelerated native frame extraction supporting iPhone 4K HDR & HEVC MOV.
        </p>
      </footer>
    </div>
  );
}
