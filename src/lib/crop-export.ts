import JSZip from 'jszip';
import { BurstFrame } from './video-burst';

export type AspectRatio = 'original' | '4:5' | '1:1' | '9:16';

/**
 * Crops and exports an image data URL with aspect ratio.
 */
export async function exportCroppedPng(
  imageUrl: string,
  aspectRatio: AspectRatio,
  filename: string
): Promise<void> {
  const img = new Image();
  img.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for export'));
  });

  const srcWidth = img.naturalWidth;
  const srcHeight = img.naturalHeight;

  let cropWidth = srcWidth;
  let cropHeight = srcHeight;
  let startX = 0;
  let startY = 0;

  if (aspectRatio === '1:1') {
    const size = Math.min(srcWidth, srcHeight);
    cropWidth = size;
    cropHeight = size;
    startX = (srcWidth - size) / 2;
    startY = (srcHeight - size) / 2;
  } else if (aspectRatio === '4:5') {
    const targetRatio = 4 / 5;
    if (srcWidth / srcHeight > targetRatio) {
      cropWidth = srcHeight * targetRatio;
      cropHeight = srcHeight;
      startX = (srcWidth - cropWidth) / 2;
    } else {
      cropWidth = srcWidth;
      cropHeight = srcWidth / targetRatio;
      startY = (srcHeight - cropHeight) / 2;
    }
  } else if (aspectRatio === '9:16') {
    const targetRatio = 9 / 16;
    if (srcWidth / srcHeight > targetRatio) {
      cropWidth = srcHeight * targetRatio;
      cropHeight = srcHeight;
      startX = (srcWidth - cropWidth) / 2;
    } else {
      cropWidth = srcWidth;
      cropHeight = srcWidth / targetRatio;
      startY = (srcHeight - cropHeight) / 2;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cropWidth);
  canvas.height = Math.round(cropHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    startX,
    startY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const downloadUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = downloadUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads multiple frames as a single ZIP archive.
 */
export async function downloadFramesZip(
  frames: BurstFrame[],
  zipFilename: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('luxs_frames') || zip;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const base64Data = frame.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
    const rankPrefix = frame.rank && frame.rank <= 3 ? `best_${frame.rank}_` : '';
    const name = `${rankPrefix}shot_${String(i + 1).padStart(3, '0')}_${frame.timestamp.toFixed(2)}s.png`;
    folder.file(name, base64Data, { base64: true });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / frames.length) * 50));
    }
  }

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent / 2));
      }
    }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type CollageLayout =
  | 'grid-2-h' // 左右2分割
  | 'grid-2-v' // 上下2分割
  | 'grid-3-h' // 横3連
  | 'grid-3-v' // 縦3連
  | 'grid-4-sq' // 2x2 正方形
  | 'grid-4-h'; // 横4連

export interface CollageOptions {
  layout: CollageLayout;
  aspectRatio: '1:1' | '4:5' | '9:16';
  gap: number; // in pixels (relative to target canvas)
  borderRadius: number;
  backgroundColor: string;
}

/**
 * Generates high-resolution collage canvas from 2-4 images.
 */
export async function renderCollageCanvas(
  imageUrls: string[],
  options: CollageOptions
): Promise<HTMLCanvasElement> {
  const images: HTMLImageElement[] = await Promise.all(
    imageUrls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load collage item image'));
          img.src = url;
        })
    )
  );

  const canvas = document.createElement('canvas');
  let totalWidth = 1600;
  let totalHeight = 1600;

  if (options.aspectRatio === '4:5') {
    totalWidth = 1600;
    totalHeight = 2000;
  } else if (options.aspectRatio === '9:16') {
    totalWidth = 1080;
    totalHeight = 1920;
  }

  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for collage');

  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Compute bounding boxes for each image slot based on layout
  interface Slot {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  const slots: Slot[] = [];
  const g = options.gap;
  const outerPad = g > 0 ? g : 0;
  const innerW = totalWidth - outerPad * 2;
  const innerH = totalHeight - outerPad * 2;

  if (options.layout === 'grid-2-h') {
    const slotW = (innerW - g) / 2;
    slots.push({ x: outerPad, y: outerPad, w: slotW, h: innerH });
    slots.push({ x: outerPad + slotW + g, y: outerPad, w: slotW, h: innerH });
  } else if (options.layout === 'grid-2-v') {
    const slotH = (innerH - g) / 2;
    slots.push({ x: outerPad, y: outerPad, w: innerW, h: slotH });
    slots.push({ x: outerPad, y: outerPad + slotH + g, w: innerW, h: slotH });
  } else if (options.layout === 'grid-3-h') {
    const slotW = (innerW - g * 2) / 3;
    slots.push({ x: outerPad, y: outerPad, w: slotW, h: innerH });
    slots.push({ x: outerPad + slotW + g, y: outerPad, w: slotW, h: innerH });
    slots.push({ x: outerPad + (slotW + g) * 2, y: outerPad, w: slotW, h: innerH });
  } else if (options.layout === 'grid-3-v') {
    const slotH = (innerH - g * 2) / 3;
    slots.push({ x: outerPad, y: outerPad, w: innerW, h: slotH });
    slots.push({ x: outerPad, y: outerPad + slotH + g, w: innerW, h: slotH });
    slots.push({ x: outerPad, y: outerPad + (slotH + g) * 2, w: innerW, h: slotH });
  } else if (options.layout === 'grid-4-sq') {
    const slotW = (innerW - g) / 2;
    const slotH = (innerH - g) / 2;
    slots.push({ x: outerPad, y: outerPad, w: slotW, h: slotH });
    slots.push({ x: outerPad + slotW + g, y: outerPad, w: slotW, h: slotH });
    slots.push({ x: outerPad, y: outerPad + slotH + g, w: slotW, h: slotH });
    slots.push({ x: outerPad + slotW + g, y: outerPad + slotH + g, w: slotW, h: slotH });
  } else if (options.layout === 'grid-4-h') {
    const slotW = (innerW - g * 3) / 4;
    for (let i = 0; i < 4; i++) {
      slots.push({ x: outerPad + (slotW + g) * i, y: outerPad, w: slotW, h: innerH });
    }
  }

  // Draw images into slots with aspect-cover cropping and concentric rounded corners
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < Math.min(images.length, slots.length); i++) {
    const img = images[i];
    const slot = slots[i];

    ctx.save();
    if (options.borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, options.borderRadius);
      ctx.clip();
    }

    // Aspect cover math
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const slotRatio = slot.w / slot.h;
    let sW = img.naturalWidth;
    let sH = img.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imgRatio > slotRatio) {
      sW = img.naturalHeight * slotRatio;
      sx = (img.naturalWidth - sW) / 2;
    } else {
      sH = img.naturalWidth / slotRatio;
      sy = (img.naturalHeight - sH) / 2;
    }

    ctx.drawImage(img, sx, sy, sW, sH, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
  }

  return canvas;
}

/**
 * Encodes sequence of frames into a looping video (Live Photo style).
 */
export async function exportLiveLoopVideo(
  frames: BurstFrame[],
  options: {
    bounce: boolean;
    aspectRatio: AspectRatio;
    fps?: number;
    cycles?: number;
    filename: string;
  }
): Promise<void> {
  if (frames.length === 0) return;

  const fps = options.fps || 12;
  const cycles = options.cycles || 3;

  // Build play order: bounce (1,2,3,4,3,2) or forward (1,2,3,4)
  const orderedFrames: BurstFrame[] = [];
  if (options.bounce && frames.length > 2) {
    const forward = [...frames];
    const backward = [...frames.slice(1, -1)].reverse();
    const oneCycle = [...forward, ...backward];
    for (let c = 0; c < cycles; c++) {
      orderedFrames.push(...oneCycle);
    }
  } else {
    for (let c = 0; c < cycles; c++) {
      orderedFrames.push(...frames);
    }
  }

  // Preload images
  const loadedImages: HTMLImageElement[] = await Promise.all(
    orderedFrames.map(
      (f) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load frame image for loop export'));
          img.src = f.dataUrl;
        })
    )
  );

  const firstImg = loadedImages[0];
  const srcW = firstImg.naturalWidth;
  const srcH = firstImg.naturalHeight;

  let targetW = srcW;
  let targetH = srcH;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (options.aspectRatio === '1:1') {
    const size = Math.min(srcW, srcH);
    sw = size;
    sh = size;
    sx = (srcW - size) / 2;
    sy = (srcH - size) / 2;
    targetW = 720;
    targetH = 720;
  } else if (options.aspectRatio === '4:5') {
    const r = 4 / 5;
    if (srcW / srcH > r) {
      sw = srcH * r;
      sh = srcH;
      sx = (srcW - sw) / 2;
    } else {
      sw = srcW;
      sh = srcW / r;
      sy = (srcH - sh) / 2;
    }
    targetW = 720;
    targetH = 900;
  } else if (options.aspectRatio === '9:16') {
    const r = 9 / 16;
    if (srcW / srcH > r) {
      sw = srcH * r;
      sh = srcH;
      sx = (srcW - sw) / 2;
    } else {
      sw = srcW;
      sh = srcW / r;
      sy = (srcH - sh) / 2;
    }
    targetW = 720;
    targetH = 1280;
  }

  // Canvas dimensions must be even for video codecs
  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Choose supported mimeType
  let mimeType = 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    mimeType = 'video/webm;codecs=vp8';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    mimeType = 'video/webm';
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  recorder.start();

  // Draw each frame with precise delay
  const frameIntervalMs = 1000 / fps;
  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
    await new Promise((r) => setTimeout(r, frameIntervalMs));
  }

  recorder.stop();
  const videoBlob = await recordingPromise;

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const outFilename = options.filename.endsWith(`.${ext}`)
    ? options.filename
    : `${options.filename.replace(/\.[^/.]+$/, '')}.${ext}`;

  const downloadUrl = URL.createObjectURL(videoBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = outFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
