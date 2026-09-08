'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveView } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { HeroCanvas } from '@/components/HeroCanvas';
import { TactileRibbon } from '@/components/TactileRibbon';
import { CuratedMomentsView } from '@/components/CuratedMomentsView';
import { CompareView } from '@/components/CompareView';
import { AuraFinishesBar, AuraStyle, AspectRatio, AURA_STYLES } from '@/components/AuraFinishesBar';
import { ProModal } from '@/components/ProModal';
import { PrintOrderModal } from '@/components/PrintOrderModal';
import { extractBurstFrames, BurstFrame } from '@/lib/video-burst';
import { scoreAllFrames } from '@/lib/image-scoring';
import { enhanceImage, EnhancementSettings } from '@/lib/image-enhancer';
import { exportCroppedPng, downloadFramesZip } from '@/lib/crop-export';
import { AlertCircle } from 'lucide-react';

const AURA_TITLES_MAP: Record<number, string> = {
  1: '奇跡の瞬間 #1: 最高の笑顔',
  2: '奇跡の瞬間 #2: 澄んだ眼差し',
  3: '奇跡の瞬間 #3: 柔らかな光',
};

export default function Home() {
  const [stage, setStage] = useState<'idle' | 'extracting' | 'scoring' | 'ready'>('idle');
  const [activeView, setActiveView] = useState<ActiveView>('curated');
  const [progress, setProgress] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [frames, setFrames] = useState<BurstFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [currentStyle, setCurrentStyle] = useState<AuraStyle>('natural');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [fineTuneSettings, setFineTuneSettings] = useState<EnhancementSettings>(
    AURA_STYLES[0].settings
  );
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
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
      setActiveView('curated'); // Default to curated 3-moments view
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
    setEnhancedUrl(null);
    setActiveView('curated');
    setErrorMessage(null);
  };

  const selectedFrame = frames.find((f) => f.id === selectedFrameId) || frames[0];

  // Style change handler
  const handleSelectStyle = (styleId: AuraStyle) => {
    setCurrentStyle(styleId);
    const matched = AURA_STYLES.find((s) => s.id === styleId);
    if (matched) {
      setFineTuneSettings({ ...matched.settings });
    }
  };

  // Re-run image enhancement whenever selected frame or fine-tune settings change
  const runEnhancement = useCallback(async () => {
    if (!selectedFrame) return;
    try {
      const res = await enhanceImage(selectedFrame.dataUrl, fineTuneSettings);
      setEnhancedUrl(res.dataUrl);
    } catch (err) {
      console.error('Enhancement error:', err);
    }
  }, [selectedFrame, fineTuneSettings]);

  useEffect(() => {
    if (stage === 'ready' && selectedFrame) {
      const timer = setTimeout(() => {
        runEnhancement();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stage, selectedFrame, runEnhancement]);

  // Export current frame
  const handleSavePng = async () => {
    if (!selectedFrame) return;
    setIsDownloading(true);
    try {
      const url = enhancedUrl || selectedFrame.dataUrl;
      const timeStr = selectedFrame.timestamp.toFixed(2).replace('.', '_');
      const filename = `luxs_aura_${timeStr}s_${currentStyle}.png`;
      await exportCroppedPng(url, aspectRatio, filename);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Batch export curated top 3 frames
  const handleSaveCuratedBatch = async () => {
    const topFrames = frames
      .filter((f) => f.rank && f.rank <= 3)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    const exportTargets = topFrames.length > 0 ? topFrames : frames.slice(0, 3);
    await downloadFramesZip(exportTargets, 'luxs_curated_aura_moments.zip');
  };

  // Full archive export
  const handleSaveAllZip = async () => {
    if (frames.length === 0) return;
    setIsDownloadingAll(true);
    try {
      await downloadFramesZip(frames, 'luxs_all_moments_archive.zip');
    } catch (err) {
      console.error('Failed to export ZIP:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const currentAuraTitle =
    selectedFrame && selectedFrame.rank && selectedFrame.rank <= 3
      ? AURA_TITLES_MAP[selectedFrame.rank]
      : undefined;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-stone-900 flex flex-col font-sans">
      <Header
        hasVideo={stage === 'ready'}
        activeView={activeView}
        onSelectView={setActiveView}
        onReset={handleReset}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col items-center">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
            >
              閉じる
            </button>
          </div>
        )}

        {/* Stage 1: Entrance / DropZone */}
        {stage === 'idle' && (
          <DropZone
            onVideoSelected={handleVideoSelected}
            isProcessing={false}
          />
        )}

        {/* Stage 2 & 3: Extraction & Scoring Progress */}
        {(stage === 'extracting' || stage === 'scoring') && (
          <ProcessingProgress
            stage={stage}
            progress={progress}
            current={progressCurrent}
            total={progressTotal}
          />
        )}

        {/* Stage 4: Atelier Playground */}
        {stage === 'ready' && selectedFrame && (
          <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn">
            {/* View 1: Curated 3 Moments */}
            {activeView === 'curated' && (
              <CuratedMomentsView
                frames={frames}
                favoritedIds={favoritedIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectFrameAndOpenAtelier={(frameId) => {
                  setSelectedFrameId(frameId);
                  setActiveView('atelier');
                }}
                onSaveCuratedBatch={handleSaveCuratedBatch}
                onGoToTimeline={() => setActiveView('atelier')}
              />
            )}

            {/* View 2: Atelier (Hero Canvas + Tactile Ribbon + Finishes Bar) */}
            {activeView === 'atelier' && (
              <div className="w-full flex flex-col items-center space-y-5">
                {/* Hero Canvas */}
                <HeroCanvas
                  frame={selectedFrame}
                  enhancedUrl={enhancedUrl}
                  isFavorited={favoritedIds.includes(selectedFrame.id)}
                  onToggleFavorite={() => handleToggleFavorite(selectedFrame.id)}
                  aspectRatio={aspectRatio}
                  auraTitle={currentAuraTitle}
                />

                {/* Tactile Scrubber Ribbon */}
                <TactileRibbon
                  frames={frames}
                  selectedFrameId={selectedFrame.id}
                  onSelectFrame={setSelectedFrameId}
                  favoritedIds={favoritedIds}
                />

                {/* Finishes & Actions Floating Dock */}
                <AuraFinishesBar
                  currentStyle={currentStyle}
                  onSelectStyle={handleSelectStyle}
                  aspectRatio={aspectRatio}
                  onSelectAspectRatio={setAspectRatio}
                  onSavePng={handleSavePng}
                  onOpenPrintModal={() => setIsPrintModalOpen(true)}
                  onSaveAllZip={handleSaveAllZip}
                  isDownloading={isDownloading}
                  isDownloadingAll={isDownloadingAll}
                  fineTuneSettings={fineTuneSettings}
                  onChangeFineTune={setFineTuneSettings}
                />
              </div>
            )}

            {/* View 3: Side-by-Side Comparison */}
            {activeView === 'compare' && (
              <CompareView
                frames={frames}
                favoritedIds={favoritedIds}
                initialFrameAId={selectedFrame.id}
                onSelectWinningFrame={(winningId) => {
                  setSelectedFrameId(winningId);
                  setActiveView('atelier');
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </div>
        )}
      </main>

      {/* Pro Subscription Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />

      {/* AURA PRINT Physical Goods Modal */}
      {selectedFrame && (
        <PrintOrderModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          frame={selectedFrame}
        />
      )}
    </div>
  );
}
