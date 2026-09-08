'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EmptyVoid } from '@/components/EmptyVoid';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { StudioHeader } from '@/components/StudioHeader';
import { StudioCanvas, AspectRatio } from '@/components/StudioCanvas';
import { TactileScrubber } from '@/components/TactileScrubber';
import { ToneToolbar, TonePreset, TONE_PRESETS } from '@/components/ToneToolbar';
import { PrintOrderModal } from '@/components/PrintOrderModal';
import { ProModal } from '@/components/ProModal';
import { ContactSheetModal } from '@/components/ContactSheetModal';
import { extractBurstFrames, BurstFrame } from '@/lib/video-burst';
import { scoreAllFrames } from '@/lib/image-scoring';
import { enhanceImage } from '@/lib/image-enhancer';
import { exportCroppedPng, downloadFramesZip } from '@/lib/crop-export';
import { triggerHapticTick } from '@/lib/haptics';

export default function Home() {
  const [stage, setStage] = useState<'idle' | 'extracting' | 'scoring' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [frames, setFrames] = useState<BurstFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [currentTone, setCurrentTone] = useState<TonePreset>('clear');
  const [toneIntensity, setToneIntensity] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  // Indices of top recommended frames (Rank 1, 2, 3)
  const recommendedIndices = useMemo(() => {
    return frames
      .map((f, idx) => ({ frame: f, index: idx }))
      .filter((item) => item.frame.rank && item.frame.rank <= 3)
      .sort((a, b) => (a.frame.rank || 0) - (b.frame.rank || 0))
      .map((item) => item.index);
  }, [frames]);

  // Handle video extraction and scoring
  const handleVideoSelected = async (
    videoSource: File | Blob | string,
    options: { intervalSeconds: number; maxFrames: number }
  ) => {
    setStage('extracting');
    setProgress(10);
    setProgressCurrent(0);
    setProgressTotal(options.maxFrames);

    try {
      let extracted: BurstFrame[] = [];

      // Strategy 1: Native server API (AVFoundation hardware decoding for 4K HDR MOV)
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
      } catch {
        // Fallback silently to client-side
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
        throw new Error('フレームを抽出できませんでした。');
      }

      // Step 2: Intelligent scoring
      setStage('scoring');
      setProgress(0);

      const scored = await scoreAllFrames(extracted, (p, cur, tot) => {
        setProgress(p);
        setProgressCurrent(cur);
        setProgressTotal(tot);
      });

      setFrames(scored);

      // Select top 1 frame by default
      const bestIdx = scored.findIndex((f) => f.rank === 1);
      const initialIdx = bestIdx !== -1 ? bestIdx : 0;
      setCurrentIndex(initialIdx);
      if (scored[initialIdx]) {
        setFavoritedIds([scored[initialIdx].id]);
      }
      setStage('ready');
      triggerHapticTick(1200, 0.05);
    } catch {
      setStage('idle');
    }
  };

  const currentFrame = frames[currentIndex];

  // Re-run image enhancement whenever current frame, tone, or intensity changes
  const runEnhancement = useCallback(async () => {
    if (!currentFrame) return;

    const matchedTone = TONE_PRESETS.find((t) => t.id === currentTone);
    if (!matchedTone || !matchedTone.settings) {
      setEnhancedUrl(null); // Original, no filter
      return;
    }

    try {
      const factor = toneIntensity / 100;
      const effectiveSettings = {
        sharpness: Math.round(matchedTone.settings.sharpness * factor),
        clarity: Math.round(matchedTone.settings.clarity * factor),
        brightness: Math.round(matchedTone.settings.brightness * factor),
        contrast: Math.round(matchedTone.settings.contrast * factor),
        saturation: Math.round(matchedTone.settings.saturation * factor),
        smoothSkin: Math.round(matchedTone.settings.smoothSkin * factor),
        upscale: matchedTone.settings.upscale,
      };

      const res = await enhanceImage(currentFrame.dataUrl, effectiveSettings);
      setEnhancedUrl(res.dataUrl);
    } catch {
      setEnhancedUrl(null);
    }
  }, [currentFrame, currentTone, toneIntensity]);

  useEffect(() => {
    if (stage === 'ready' && currentFrame) {
      const timer = setTimeout(() => {
        runEnhancement();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [stage, currentFrame, runEnhancement]);

  const handleToggleFavorite = (frameId: string) => {
    setFavoritedIds((prev) =>
      prev.includes(frameId) ? prev.filter((id) => id !== frameId) : [...prev, frameId]
    );
    triggerHapticTick(1400, 0.04);
  };

  const handleCancel = useCallback(() => {
    setStage('idle');
    setFrames([]);
    setCurrentIndex(0);
    setFavoritedIds([]);
    setEnhancedUrl(null);
  }, []);

  // Save current frame
  const handleSavePng = useCallback(async () => {
    if (!currentFrame) return;
    setIsSaving(true);
    try {
      const url = enhancedUrl || currentFrame.dataUrl;
      const timeStr = currentFrame.timestamp.toFixed(2).replace('.', '_');
      const filename = `luxs_photo_${timeStr}s.png`;
      await exportCroppedPng(url, aspectRatio, filename);
      triggerHapticTick(1500, 0.06);
    } catch {
      // Export failed
    } finally {
      setIsSaving(false);
    }
  }, [currentFrame, enhancedUrl, aspectRatio]);

  // Save all frames as ZIP
  const handleSaveAllZip = useCallback(async () => {
    if (frames.length === 0) return;
    setIsSavingAll(true);
    try {
      await downloadFramesZip(frames, 'luxs_burst_frames.zip');
      triggerHapticTick(1500, 0.06);
    } catch {
      // ZIP failed
    } finally {
      setIsSavingAll(false);
    }
  }, [frames]);

  // Keyboard global shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'ready') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (isContactSheetOpen) setIsContactSheetOpen(false);
        else if (isPrintModalOpen) setIsPrintModalOpen(false);
        else if (isProModalOpen) setIsProModalOpen(false);
        else handleCancel();
      } else if (e.key === 'Enter') {
        const isAnyModalOpen =
          isContactSheetOpen ||
          isPrintModalOpen ||
          isProModalOpen;
        if (!isAnyModalOpen) {
          handleSavePng();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    stage,
    handleCancel,
    handleSavePng,
    isContactSheetOpen,
    isPrintModalOpen,
    isProModalOpen,
  ]);

  return (
    <main className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-[#0C0C0C] text-[#F5F5F5] select-none">
      {/* Stage 1: Entrance */}
      {stage === 'idle' && (
        <EmptyVoid
          onVideoSelected={handleVideoSelected}
          isProcessing={false}
        />
      )}

      {/* Stage 2 & 3: Extraction & Scoring */}
      {(stage === 'extracting' || stage === 'scoring') && (
        <ProcessingProgress
          stage={stage}
          progress={progress}
          current={progressCurrent}
          total={progressTotal}
        />
      )}

      {/* Stage 4: Studio Workbench (Non-scrolling 100dvh) */}
      {stage === 'ready' && currentFrame && (
        <div className="h-full w-full flex flex-col overflow-hidden animate-fadeIn">
          {/* Top Bar */}
          <StudioHeader
            aspectRatio={aspectRatio}
            onSelectAspectRatio={setAspectRatio}
            onCancel={handleCancel}
            onSavePng={handleSavePng}
            onSaveAllZip={handleSaveAllZip}
            isSaving={isSaving}
            isSavingAll={isSavingAll}
            onOpenContactSheet={() => setIsContactSheetOpen(true)}
          />

          {/* Center Stage: Photo Canvas */}
          <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
            <StudioCanvas
              frame={currentFrame}
              enhancedUrl={enhancedUrl}
              aspectRatio={aspectRatio}
              isFavorited={favoritedIds.includes(currentFrame.id)}
              onToggleFavorite={() => handleToggleFavorite(currentFrame.id)}
            />
          </div>

          {/* Bottom Console: Scrubber + Tone Toolbar */}
          <div className="w-full max-w-3xl mx-auto px-4 pb-4 space-y-2 shrink-0">
            <TactileScrubber
              frames={frames}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              recommendedIndices={recommendedIndices}
              favoritedIds={favoritedIds}
            />

            <ToneToolbar
              currentTone={currentTone}
              onSelectTone={setCurrentTone}
              toneIntensity={toneIntensity}
              onChangeIntensity={setToneIntensity}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Discovery Modal: Contact Sheet (Grid Lightbox) */}
      <ContactSheetModal
        isOpen={isContactSheetOpen}
        onClose={() => setIsContactSheetOpen(false)}
        frames={frames}
        currentIndex={currentIndex}
        onSelectIndex={setCurrentIndex}
        favoritedIds={favoritedIds}
        onToggleFavorite={handleToggleFavorite}
        recommendedIndices={recommendedIndices}
      />

      {/* Physical Print Goods Modal */}
      {currentFrame && (
        <PrintOrderModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          frame={currentFrame}
        />
      )}

      {/* Pro Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </main>
  );
}
