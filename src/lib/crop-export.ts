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
