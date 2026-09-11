'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EmptyVoid } from '@/components/EmptyVoid';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { StudioHeader, AppTheme } from '@/components/StudioHeader';
import { StudioCanvas, AspectRatio } from '@/components/StudioCanvas';
import { TactileScrubber } from '@/components/TactileScrubber';
import { ToneToolbar, TonePreset, TONE_PRESETS } from '@/components/ToneToolbar';
import { PrintOrderModal } from '@/components/PrintOrderModal';
import { ProModal } from '@/components/ProModal';
import { ContactSheetModal } from '@/components/ContactSheetModal';
import { CollageModal } from '@/components/CollageModal';
import { LiveLoopModal } from '@/components/LiveLoopModal';
import { SavedSuccessModal } from '@/components/SavedSuccessModal';
import { extractBurstFrames, captureNativeResolutionFrame, BurstFrame } from '@/lib/video-burst';
import { scoreAllFrames, pickEquidistantFrameIndices } from '@/lib/image-scoring';
import { enhanceImage } from '@/lib/image-enhancer';
import { exportCroppedPng, downloadFramesZip } from '@/lib/crop-export';
import { triggerHapticTick } from '@/lib/haptics';
import { useAppTheme } from '@/lib/theme';

export default function Home() {
  const [theme, setTheme] = useAppTheme();
  const [rawVideoSource, setRawVideoSource] = useState<File | Blob | string | null>(null);
  const [stage, setStage] = useState<'idle' | 'extracting' | 'scoring' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [frames, setFrames] = useState<BurstFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [currentTone, setCurrentTone] = useState<TonePreset>('natural');
  const [toneIntensity, setToneIntensity] = useState(100);
  const [smoothSkinOffset, setSmoothSkinOffset] = useState(0);
  const [brightnessOffset, setBrightnessOffset] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [lastSavedUrl, setLastSavedUrl] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const [isCollageModalOpen, setIsCollageModalOpen] = useState(false);
  const [isLiveLoopModalOpen, setIsLiveLoopModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'scrub' | 'tone'>('scrub');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
  };

  // Diverse recommended frame indices ordered chronologically across the video timeline
  const recommendedIndices = useMemo(() => {
    return frames
      .map((f, idx) => ({ frame: f, index: idx }))
      .filter((item) => item.frame.isRecommended || (item.frame.rank && item.frame.rank <= 6))
      .sort((a, b) => a.index - b.index)
      .map((item) => item.index);
  }, [frames]);

  // Handler for equidistant frame batch selection
  const handleSelectEquidistant = useCallback(
    (count: number) => {
      if (frames.length === 0) return;
      const indices = pickEquidistantFrameIndices(frames.length, count);
      const ids = indices.map((idx) => frames[idx]?.id).filter(Boolean) as string[];
      setFavoritedIds(ids);
      triggerHapticTick(1400, 0.05);
      showToast(`等間隔に ${ids.length} コマを選定しました`);
    },
    [frames, showToast]
  );

  // Handle video extraction and scoring
  const handleVideoSelected = async (
    videoSource: File | Blob | string,
    options: { intervalSeconds: number; maxFrames: number }
  ) => {
    setStage('extracting');
    setProgress(10);
    setProgressCurrent(0);
    setProgressTotal(options.maxFrames);
    setRawVideoSource(videoSource);

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
              maxWidth: 1080,
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
          formData.append('maxWidth', '1080');

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
          maxWidth: 1080,
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
        brightness: Math.max(-50, Math.min(50, Math.round(matchedTone.settings.brightness * factor) + brightnessOffset)),
        contrast: Math.round(matchedTone.settings.contrast * factor),
        saturation: Math.round(matchedTone.settings.saturation * factor),
        smoothSkin: Math.max(0, Math.min(100, Math.round(matchedTone.settings.smoothSkin * factor) + smoothSkinOffset)),
        warmth: matchedTone.settings.warmth !== undefined ? Math.round(matchedTone.settings.warmth * factor) : 0,
        rose: matchedTone.settings.rose !== undefined ? Math.round(matchedTone.settings.rose * factor) : 0,
        upscale: matchedTone.settings.upscale,
      };

      const res = await enhanceImage(currentFrame.dataUrl, effectiveSettings);
      setEnhancedUrl(res.dataUrl);
    } catch {
      setEnhancedUrl(null);
    }
  }, [currentFrame, currentTone, toneIntensity, smoothSkinOffset, brightnessOffset]);

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
    setRawVideoSource(null);
    setSmoothSkinOffset(0);
    setBrightnessOffset(0);
    setIsSavedModalOpen(false);
  }, []);

  // Helper to obtain the highest-quality master image URL (extracts 4K/FHD native frame if source available)
  const getMasterProcessedUrl = useCallback(async (): Promise<string> => {
    if (!currentFrame) throw new Error('No frame selected');

    if (rawVideoSource) {
      try {
        const nativeFrame = await captureNativeResolutionFrame(
          rawVideoSource,
          currentFrame.timestamp
        );

        const matchedTone = TONE_PRESETS.find((t) => t.id === currentTone);
        if (!matchedTone || !matchedTone.settings) {
          return nativeFrame.dataUrl;
        }

        const factor = toneIntensity / 100;
        const effectiveSettings = {
          sharpness: Math.round(matchedTone.settings.sharpness * factor),
          clarity: Math.round(matchedTone.settings.clarity * factor),
          brightness: Math.max(-50, Math.min(50, Math.round(matchedTone.settings.brightness * factor) + brightnessOffset)),
          contrast: Math.round(matchedTone.settings.contrast * factor),
          saturation: Math.round(matchedTone.settings.saturation * factor),
          smoothSkin: Math.max(0, Math.min(100, Math.round(matchedTone.settings.smoothSkin * factor) + smoothSkinOffset)),
          warmth:
            matchedTone.settings.warmth !== undefined
              ? Math.round(matchedTone.settings.warmth * factor)
              : 0,
          rose:
            matchedTone.settings.rose !== undefined
              ? Math.round(matchedTone.settings.rose * factor)
              : 0,
          upscale: 1 as const, // Native frame is already original 4K/FullHD resolution
        };

        const enhanced = await enhanceImage(nativeFrame.dataUrl, effectiveSettings);
        return enhanced.dataUrl;
      } catch (err) {
        console.warn('Native resolution capture fallback to preview image:', err);
      }
    }

    return enhancedUrl || currentFrame.dataUrl;
  }, [currentFrame, rawVideoSource, currentTone, toneIntensity, smoothSkinOffset, brightnessOffset, enhancedUrl]);

  // Save current frame as PNG at full master resolution
  const handleSavePng = useCallback(async () => {
    if (!currentFrame) return;
    setIsSaving(true);
    try {
      const url = await getMasterProcessedUrl();
      const timeStr = currentFrame.timestamp.toFixed(2).replace('.', '_');
      const filename = `luxs_photo_${timeStr}s.png`;
      await exportCroppedPng(url, aspectRatio, filename);
      setLastSavedUrl(url);
      setIsSavedModalOpen(true);
      triggerHapticTick(1500, 0.06);
    } catch {
      showToast('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [currentFrame, getMasterProcessedUrl, aspectRatio, showToast]);

  // Copy current image to clipboard at full master resolution
  const handleCopyImage = useCallback(async () => {
    if (!currentFrame) return;
    setIsCopying(true);
    try {
      const url = await getMasterProcessedUrl();
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      showToast('クリップボードにコピーしました');
      triggerHapticTick(1400, 0.05);
    } catch {
      showToast('クリップボードへのコピーに失敗しました');
    } finally {
      setIsCopying(false);
    }
  }, [currentFrame, getMasterProcessedUrl, showToast]);

  // Save all frames as ZIP
  const handleSaveAllZip = useCallback(async () => {
    if (frames.length === 0) return;
    setIsSavingAll(true);
    try {
      await downloadFramesZip(frames, 'luxs_burst_frames.zip');
      triggerHapticTick(1500, 0.06);
      showToast('全コマをZIP保存しました');
    } catch {
      showToast('ZIPの書き出しに失敗しました');
    } finally {
      setIsSavingAll(false);
    }
  }, [frames, showToast]);

  // Keyboard global shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'ready') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (isSavedModalOpen) setIsSavedModalOpen(false);
        else if (isCollageModalOpen) setIsCollageModalOpen(false);
        else if (isLiveLoopModalOpen) setIsLiveLoopModalOpen(false);
        else if (isContactSheetOpen) setIsContactSheetOpen(false);
        else if (isPrintModalOpen) setIsPrintModalOpen(false);
        else if (isProModalOpen) setIsProModalOpen(false);
        else handleCancel();
      } else if (e.key === 'Enter') {
        const isAnyModalOpen =
          isSavedModalOpen ||
          isContactSheetOpen ||
          isPrintModalOpen ||
          isProModalOpen ||
          isCollageModalOpen ||
          isLiveLoopModalOpen;
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
    isSavedModalOpen,
    isContactSheetOpen,
    isPrintModalOpen,
    isProModalOpen,
    isCollageModalOpen,
    isLiveLoopModalOpen,
  ]);

  return (
    <main className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-[var(--background)] text-[var(--foreground)] select-none transition-colors duration-200">
      {/* Stage 1: Entrance */}
      {stage === 'idle' && (
        <EmptyVoid
          onVideoSelected={handleVideoSelected}
          isProcessing={false}
          theme={theme}
          onSelectTheme={handleSelectTheme}
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
            onCopyImage={handleCopyImage}
            isSaving={isSaving}
            isSavingAll={isSavingAll}
            isCopying={isCopying}
            onOpenContactSheet={() => setIsContactSheetOpen(true)}
            onOpenCollage={() => setIsCollageModalOpen(true)}
            onOpenLiveLoop={() => setIsLiveLoopModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onOpenProModal={() => setIsProModalOpen(true)}
            theme={theme}
            onSelectTheme={handleSelectTheme}
            favoritedCount={favoritedIds.length}
            currentTimestamp={currentFrame.timestamp}
            currentIndex={currentIndex}
            totalFrames={frames.length}
          />

          {/* Center Stage: Photo Canvas */}
          <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
            <StudioCanvas
              frame={currentFrame}
              prevFrame={currentIndex > 0 ? frames[currentIndex - 1] : null}
              nextFrame={currentIndex < frames.length - 1 ? frames[currentIndex + 1] : null}
              enhancedUrl={enhancedUrl}
              aspectRatio={aspectRatio}
              isFavorited={favoritedIds.includes(currentFrame.id)}
              onToggleFavorite={() => handleToggleFavorite(currentFrame.id)}
            />
          </div>

          {/* Bottom Console: Scrubber + Tone Toolbar */}
          <div className="w-full max-w-3xl mx-auto px-4 pb-4 shrink-0 space-y-2">
            {/* Mobile Tab Switcher */}
            <div className="sm:hidden flex items-center justify-center">
              <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--surface-border)]">
                <button
                  type="button"
                  onClick={() => setMobileTab('scrub')}
                  className={`px-4 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    mobileTab === 'scrub'
                      ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs'
                      : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  コマ送り
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('tone')}
                  className={`px-4 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    mobileTab === 'tone'
                      ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs'
                      : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  レタッチ
                </button>
              </div>
            </div>

            {/* Scrubber (Always visible on desktop, tabbed on mobile) */}
            <div className={mobileTab === 'scrub' ? 'block' : 'hidden sm:block'}>
              <TactileScrubber
                frames={frames}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                recommendedIndices={recommendedIndices}
                favoritedIds={favoritedIds}
              />
            </div>

            {/* Tone Toolbar (Always visible on desktop, tabbed on mobile) */}
            <div className={mobileTab === 'tone' ? 'block' : 'hidden sm:block'}>
              <ToneToolbar
                currentTone={currentTone}
                onSelectTone={setCurrentTone}
                toneIntensity={toneIntensity}
                onChangeIntensity={setToneIntensity}
                smoothSkinOffset={smoothSkinOffset}
                onChangeSmoothSkin={setSmoothSkinOffset}
                brightnessOffset={brightnessOffset}
                onChangeBrightness={setBrightnessOffset}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-max z-50 px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] shadow-lg text-xs font-medium animate-fadeIn">
          {toastMessage}
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
        onSelectEquidistant={handleSelectEquidistant}
      />

      {/* Physical Print Goods Modal */}
      {currentFrame && (
        <PrintOrderModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          frame={currentFrame}
          onOrderSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Collage (組写真) Modal */}
      <CollageModal
        isOpen={isCollageModalOpen}
        onClose={() => setIsCollageModalOpen(false)}
        frames={frames}
        favoritedIds={favoritedIds}
        enhancedUrl={enhancedUrl}
        currentFrameId={currentFrame?.id || ''}
      />

      {/* Live Loop (ショートループ動画) Modal */}
      <LiveLoopModal
        isOpen={isLiveLoopModalOpen}
        onClose={() => setIsLiveLoopModalOpen(false)}
        frames={frames}
        currentIndex={currentIndex}
        aspectRatio={aspectRatio}
      />

      {/* Saved Success Modal (Next creative actions) */}
      <SavedSuccessModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedImageUrl={lastSavedUrl}
        onOpenCollage={() => setIsCollageModalOpen(true)}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onOpenLiveLoop={() => setIsLiveLoopModalOpen(true)}
        onResetVideo={handleCancel}
      />

      {/* Pro Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </main>
  );
}
