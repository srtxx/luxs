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
 * Extracts burst frames from a video File or URL completely on the client side using HTML5 Video + Canvas.
 */
export async function extractBurstFrames(
  videoSource: File | Blob | string,
  options: BurstExtractOptions = {}
): Promise<BurstFrame[]> {
  const {
    intervalSeconds = 0.15,
    maxFrames = 60,
    startTime = 0,
    maxWidth = 1280,
    onProgress,
  } = options;

  let url: string;
  let isCreatedUrl = false;

  if (typeof videoSource === 'string') {
    url = videoSource;
  } else {
    url = URL.createObjectURL(videoSource);
    isCreatedUrl = true;
  }

  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  // Wait for metadata to load
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = (e) => reject(new Error('Failed to load video metadata: ' + e));
  });

  const duration = video.duration || 1;
  const effectiveEndTime = Math.min(
    options.endTime !== undefined ? options.endTime : duration,
    duration
  );
  const effectiveStartTime = Math.max(0, Math.min(startTime, effectiveEndTime));

  // Determine frame timestamps
  const timestamps: number[] = [];
  for (let t = effectiveStartTime; t <= effectiveEndTime; t += intervalSeconds) {
    timestamps.push(Math.round(t * 1000) / 1000);
    if (timestamps.length >= maxFrames) break;
  }

  if (timestamps.length === 0) {
    timestamps.push(0);
  }

  // Calculate target canvas size
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
    if (isCreatedUrl) URL.revokeObjectURL(url);
    throw new Error('Could not create canvas context');
  }

  const frames: BurstFrame[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    await seekVideo(video, t);

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), 'image/jpeg', 0.92)
    );

    if (blob) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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

  if (isCreatedUrl) {
    video.src = '';
  }

  return frames;
}

/**
 * Seek video to a specific timestamp accurately.
 */
function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.min(Math.max(time, 0), video.duration || time);

    // Safety timeout in case seeked event hangs
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    }, 400);
  });
}
