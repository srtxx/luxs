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
 * Robustly extracts burst frames from a video File, Blob, or URL completely client-side.
 * Compatible with MOV, MP4, WebM across modern browsers.
 */
export async function extractBurstFrames(
  videoSource: File | Blob | string,
  options: BurstExtractOptions = {}
): Promise<BurstFrame[]> {
  const {
    intervalSeconds = 0.15,
    maxFrames = 45,
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

  // Create video element and attach invisibly to DOM for reliable decoding & hardware acceleration
  const video = document.createElement('video');
  video.style.position = 'fixed';
  video.style.top = '-9999px';
  video.style.left = '-9999px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  video.style.width = '160px';
  video.style.height = '90px';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  document.body.appendChild(video);

  try {
    video.src = url;
    video.load();

    // Wait for metadata (dimensions, duration)
    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }

      const onLoadedMetadata = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        const err = video.error;
        let msg = '動画の読み込みに失敗しました。';
        if (err) {
          if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            msg = 'お使いのブラウザで直接デコードできない動画形式（一部のHEVC/Apple ProRes MOVなど）の可能性があります。Safariでお試しいただくか、MP4形式に変換してください。';
          } else if (err.message) {
            msg = `動画エラー: ${err.message}`;
          }
        }
        reject(new Error(msg));
      };

      const timeout = setTimeout(() => {
        cleanup();
        if (video.readyState >= 1) {
          resolve();
        } else {
          reject(new Error('動画の読み込みがタイムアウトしました。動画ファイルが破損していないかご確認ください。'));
        }
      }, 10000);

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        clearTimeout(timeout);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
    });

    const duration = video.duration || 1;
    const effectiveEndTime = Math.min(
      options.endTime !== undefined ? options.endTime : duration,
      duration
    );
    const effectiveStartTime = Math.max(0, Math.min(startTime, effectiveEndTime));

    // Generate sampling timestamps
    const timestamps: number[] = [];
    for (let t = effectiveStartTime; t <= effectiveEndTime; t += intervalSeconds) {
      timestamps.push(Math.round(t * 1000) / 1000);
      if (timestamps.length >= maxFrames) break;
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
      await seekVideoAccurately(video, t);

      // Render to canvas
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

    return frames;
  } finally {
    // Cleanup DOM and temporary object URLs
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (video.parentNode) {
      video.parentNode.removeChild(video);
    }
    if (isCreatedUrl) {
      // Small timeout before revoke to ensure any lingering canvas tasks finish
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

/**
 * Seeks video accurately to target timestamp.
 */
function seekVideoAccurately(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const targetTime = Math.min(Math.max(time, 0), video.duration || time);

    // If current time is already virtually identical, no need to seek
    if (Math.abs(video.currentTime - targetTime) < 0.005) {
      resolve();
      return;
    }

    let resolved = false;

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    }, 500);

    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      clearTimeout(timeout);
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = targetTime;
  });
}
