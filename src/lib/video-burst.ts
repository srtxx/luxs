export interface BurstFrame {
  id: string;
  index: number;
  timestamp: number; // in seconds
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  score?: number;
  sharpnessScore?: number;
  exposureScore?: number;
  rank?: number;
}

export interface BurstExtractOptions {
  intervalSeconds?: number; // interval between captured frames (e.g. 0.15s)
  maxFrames?: number; // upper bound of frames to avoid memory exhaustion
  startTime?: number;
  endTime?: number;
  maxWidth?: number; // resize width for faster processing if specified
  onProgress?: (progress: number, current: number, total: number) => void;
}

/**
 * Extracts burst frames from video files (including iPhone HEVC/hvc1 MOV, MP4, WebM)
 * completely client-side in Safari and Chrome.
 * Resolves Safari's blank/black frame issue by maintaining a valid viewport video element,
 * actively priming the GPU hardware decoder, and validating canvas frame buffers.
 */
async function createAndPrepareVideo(videoSource: File | Blob | string): Promise<{
  video: HTMLVideoElement;
  cleanup: () => void;
}> {
  let url: string;
  let isCreatedUrl = false;

  if (typeof videoSource === 'string') {
    url = videoSource;
  } else {
    url = URL.createObjectURL(videoSource);
    isCreatedUrl = true;
  }

  const video = document.createElement('video');
  video.style.position = 'fixed';
  video.style.bottom = '10px';
  video.style.right = '10px';
  video.style.width = '120px';
  video.style.height = '80px';
  video.style.opacity = '0.01';
  video.style.pointerEvents = 'none';
  video.style.zIndex = '-9999';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('muted', 'true');
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  document.body.appendChild(video);

  const cleanup = () => {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    } catch {
      // ignore
    }
    if (isCreatedUrl) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  try {
    video.src = url;
    video.load();

    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }

      const onLoadedMetadata = () => {
        cleanupListeners();
        resolve();
      };

      const onError = () => {
        cleanupListeners();
        const err = video.error;
        let msg = '動画の読み込みに失敗しました。';
        if (err) {
          if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            msg = 'お使いのブラウザで直接再生・デコードできない動画形式（一部のApple ProRes MOVなど）の可能性があります。MP4形式または別の動画でお試しください。';
          } else if (err.message) {
            msg = `動画エラー: ${err.message}`;
          }
        }
        reject(new Error(msg));
      };

      const timeout = setTimeout(() => {
        cleanupListeners();
        if (video.readyState >= 1) {
          resolve();
        } else {
          reject(new Error('動画メタデータの読み込みがタイムアウトしました。動画ファイルが破損していないかご確認ください。'));
        }
      }, 12000);

      const cleanupListeners = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        clearTimeout(timeout);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
    });

    try {
      await video.play();
      video.pause();
    } catch {
      // continue
    }

    return { video, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

/**
 * Extracts burst frames from video files (including iPhone HEVC/hvc1 MOV, MP4, WebM)
 * completely client-side in Safari and Chrome.
 */
export async function extractBurstFrames(
  videoSource: File | Blob | string,
  options: BurstExtractOptions = {}
): Promise<BurstFrame[]> {
  const {
    intervalSeconds = 0.15,
    maxFrames = 45,
    startTime = 0,
    maxWidth = 1080,
    onProgress,
  } = options;

  const { video, cleanup } = await createAndPrepareVideo(videoSource);

  try {
    const duration = video.duration || 1;
    const effectiveEndTime = Math.min(
      options.endTime !== undefined ? options.endTime : duration,
      duration
    );
    const effectiveStartTime = Math.max(0, Math.min(startTime, effectiveEndTime));

    const totalDuration = Math.max(0.01, effectiveEndTime - effectiveStartTime);

    // Calculate dynamic evenly-spaced timestamps across entire duration
    const timestamps: number[] = [];
    const naturalCount = Math.floor(totalDuration / intervalSeconds) + 1;

    if (naturalCount <= maxFrames) {
      for (let i = 0; i < naturalCount; i++) {
        const t = Math.min(effectiveEndTime, effectiveStartTime + i * intervalSeconds);
        timestamps.push(Math.round(t * 1000) / 1000);
      }
    } else {
      const step = totalDuration / (maxFrames - 1);
      for (let i = 0; i < maxFrames; i++) {
        const t = Math.min(effectiveEndTime, effectiveStartTime + i * step);
        timestamps.push(Math.round(t * 1000) / 1000);
      }
    }

    if (timestamps.length === 0) {
      timestamps.push(0);
    }

    // Determine target canvas dimensions
    let targetWidth = video.videoWidth || 1280;
    let targetHeight = video.videoHeight || 720;

    if (maxWidth && targetWidth > maxWidth) {
      const scale = maxWidth / targetWidth;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Canvas context could not be created');
    }

    const frames: BurstFrame[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      await seekAndCaptureFrame(video, ctx, t, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), 'image/jpeg', 0.95)
      );

      if (blob) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        frames.push({
          id: `frame-${i}-${Date.now()}`,
          index: i,
          timestamp: t,
          blob,
          dataUrl,
          width: targetWidth,
          height: targetHeight,
        });
      }

      if (onProgress) {
        const progress = Math.round(((i + 1) / timestamps.length) * 100);
        onProgress(progress, i + 1, timestamps.length);
      }
    }

    return frames;
  } finally {
    cleanup();
  }
}

/**
 * Captures a single frame at the video's full native resolution (e.g. 4K 3840x2160, 1080p).
 * Completely lossless without downscaling or lossy compression artifacts.
 */
export async function captureNativeResolutionFrame(
  videoSource: File | Blob | string,
  timestamp: number
): Promise<{ dataUrl: string; width: number; height: number; blob: Blob }> {
  const { video, cleanup } = await createAndPrepareVideo(videoSource);
  try {
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas context could not be created');
    }

    await seekAndCaptureFrame(video, ctx, timestamp, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to capture native resolution frame'));
      }, 'image/png');
    });

    const dataUrl = canvas.toDataURL('image/png');

    return {
      dataUrl,
      width,
      height,
      blob,
    };
  } finally {
    cleanup();
  }
}

/**
 * Seeks to target timestamp and ensures the GPU frame is accurately flushed to Canvas.
 */
async function seekAndCaptureFrame(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number
): Promise<void> {
  const targetTime = Math.min(Math.max(time, 0), video.duration || time);

  // 1. Seek to exact timestamp
  await new Promise<void>((resolve) => {
    let done = false;
    const onSeeked = () => {
      if (!done) {
        done = true;
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        cleanup();
        resolve();
      }
    }, 450);

    video.addEventListener('seeked', onSeeked);
    video.currentTime = targetTime;
  });

  // 2. Wait for GPU render pipeline synchronization
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  // 3. Draw video frame to canvas
  ctx.drawImage(video, 0, 0, width, height);

  // 4. Black-frame protection:
  // If canvas is entirely black (Safari HEVC pipeline stall), force a micro-playback tick
  if (isCanvasPureBlack(ctx, width, height)) {
    try {
      await video.play();
      await new Promise((r) => setTimeout(r, 40));
      video.pause();
      ctx.drawImage(video, 0, 0, width, height);
    } catch {
      // Fallback: seek slightly forward
      video.currentTime = Math.min((video.duration || 1) - 0.01, targetTime + 0.02);
      await new Promise((r) => setTimeout(r, 60));
      ctx.drawImage(video, 0, 0, width, height);
    }
  }
}

/**
 * Samples center pixels to verify whether frame is rendered or stuck on pure black (0,0,0)
 */
function isCanvasPureBlack(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleSize = 16;
    const startX = Math.max(0, Math.floor(width / 2) - 8);
    const startY = Math.max(0, Math.floor(height / 2) - 8);
    const sample = ctx.getImageData(startX, startY, sampleSize, sampleSize);
    const d = sample.data;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 12 || d[i + 1] > 12 || d[i + 2] > 12) {
        return false; // Found color/luminance, not pure black
      }
    }
    return true;
  } catch {
    return false;
  }
}
