export interface EnhancementSettings {
  sharpness: number; // 0 to 100 (default: 55)
  clarity: number; // 0 to 100 (default: 35)
  brightness: number; // -50 to 50 (default: 4)
  contrast: number; // -50 to 50 (default: 8)
  saturation: number; // -50 to 50 (default: 8)
  smoothSkin: number; // 0 to 100 (default: 15)
  warmth?: number; // -50 to 50 (default: 0)
  rose?: number; // 0 to 50 (default: 0, 血色感・トーンアップ)
  upscale: 1 | 2; // 1x or 2x resolution
}

export const defaultEnhancementSettings: EnhancementSettings = {
  sharpness: 55,
  clarity: 35,
  brightness: 4,
  contrast: 8,
  saturation: 8,
  smoothSkin: 15,
  warmth: 0,
  rose: 0,
  upscale: 2,
};

/**
 * Applies high-fidelity photo enhancements:
 * - Luminance-based adaptive unsharp masking (BT.709 luma, zero chromatic fringe)
 * - Micro-contrast & Local clarity boost
 * - Edge-preserving bilateral skin smoothing
 * - Detail-preserving upscale rendering
 */
export async function enhanceImage(
  sourceUrl: string,
  settings: EnhancementSettings = defaultEnhancementSettings
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = new Image();
  img.src = sourceUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load source image for enhancement'));
  });

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  const targetWidth = originalWidth * settings.upscale;
  const targetHeight = originalHeight * settings.upscale;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context for enhancement');

  // Draw scaled image using high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 1. Edge-preserving skin smoothing (before sharp edge recovery)
  if (settings.smoothSkin > 0) {
    applyEdgePreservingSkinSmoothing(ctx, targetWidth, targetHeight, settings.smoothSkin);
  }

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const len = data.length;

  // 2. Color, Brightness, Contrast, Saturation, Warmth & Rose Tint Adjustment
  const brightnessOffset = (settings.brightness / 100) * 255;
  const contrastFactor = (259 * (settings.contrast + 100)) / (100 * (259 - settings.contrast));
  const satFactor = 1 + settings.saturation / 100;
  const warmthVal = (settings.warmth || 0) * 0.4;
  const roseVal = (settings.rose || 0) * 0.5;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Saturation
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + satFactor * (r - gray);
    g = gray + satFactor * (g - gray);
    b = gray + satFactor * (b - gray);

    // Warmth & Rose tone
    if (warmthVal !== 0) {
      r += warmthVal;
      b -= warmthVal;
    }
    if (roseVal > 0) {
      r += roseVal * 0.9;
      g += roseVal * 0.1;
      b += roseVal * 0.4;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imageData, 0, 0);

  // 3. High-Fidelity Luminance Unsharp Mask & Micro-Contrast
  if (settings.sharpness > 0 || settings.clarity > 0) {
    applyLuminanceAdaptiveSharpen(
      ctx,
      targetWidth,
      targetHeight,
      settings.sharpness,
      settings.clarity
    );
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Luminance-based adaptive unsharp mask and micro-contrast.
 * Operates purely on perceptual luminance (Rec.709) to avoid color fringing,
 * using resolution-adaptive blur radii, noise coring, and halo suppression.
 */
function applyLuminanceAdaptiveSharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sharpness: number,
  clarity: number
) {
  const original = ctx.getImageData(0, 0, width, height);
  const origData = original.data;
  const minDim = Math.min(width, height);

  // Dynamic kernel radius scaled to image resolution (e.g. ~1.5px at 1080p, ~3px at 4K)
  const sharpRadius = Math.max(1.2, Math.round((minDim / 1080) * 1.6 * 10) / 10);
  const clarityRadius = Math.max(4.0, Math.round((minDim / 1080) * 8.0 * 10) / 10);

  // Generate high-frequency blur for unsharp mask
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext('2d');
  if (!blurCtx) return;

  blurCtx.filter = `blur(${sharpRadius}px)`;
  blurCtx.drawImage(ctx.canvas, 0, 0);
  const sharpBlurData = blurCtx.getImageData(0, 0, width, height).data;

  // Generate wide blur for clarity / local micro-contrast if requested
  let clarityBlurData: Uint8ClampedArray | null = null;
  if (clarity > 0) {
    blurCtx.clearRect(0, 0, width, height);
    blurCtx.filter = `blur(${clarityRadius}px)`;
    blurCtx.drawImage(ctx.canvas, 0, 0);
    clarityBlurData = blurCtx.getImageData(0, 0, width, height).data;
  }

  const sharpWeight = (sharpness / 100) * 1.8;
  const clarityWeight = (clarity / 100) * 0.9;
  const coringThreshold = 1.8; // Suppress noise below this luminance delta
  const maxHaloDelta = 45; // Prevent harsh overshooting/halos

  for (let i = 0; i < origData.length; i += 4) {
    const r = origData[i];
    const g = origData[i + 1];
    const b = origData[i + 2];

    // BT.709 perceptual luma
    const origLuma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // 1. High-frequency edge sharpening delta
    const sharpLuma =
      0.2126 * sharpBlurData[i] +
      0.7152 * sharpBlurData[i + 1] +
      0.0722 * sharpBlurData[i + 2];
    const diffSharp = origLuma - sharpLuma;

    let deltaSharp = 0;
    const absSharp = Math.abs(diffSharp);
    if (absSharp > coringThreshold) {
      const sign = diffSharp > 0 ? 1 : -1;
      const magnitude = Math.min(absSharp - coringThreshold, maxHaloDelta);
      deltaSharp = sign * magnitude * sharpWeight;
    }

    // 2. Mid-frequency local clarity delta
    let deltaClarity = 0;
    if (clarityBlurData && clarityWeight > 0) {
      const midLuma =
        0.2126 * clarityBlurData[i] +
        0.7152 * clarityBlurData[i + 1] +
        0.0722 * clarityBlurData[i + 2];
      const diffMid = origLuma - midLuma;
      // Soft sigmoid-like boost for mid-contrast
      deltaClarity = Math.max(-30, Math.min(30, diffMid)) * clarityWeight;
    }

    const totalDelta = deltaSharp + deltaClarity;
    if (totalDelta !== 0) {
      origData[i] = Math.min(255, Math.max(0, r + totalDelta));
      origData[i + 1] = Math.min(255, Math.max(0, g + totalDelta));
      origData[i + 2] = Math.min(255, Math.max(0, b + totalDelta));
    }
  }

  ctx.putImageData(original, 0, 0);
}

/**
 * Edge-preserving bilateral skin smoothing filter.
 * Protects high-contrast facial contours (eyes, brows, eyelashes, lips, hair)
 * while gently smoothing mid-tone skin textures.
 */
function applyEdgePreservingSkinSmoothing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const original = ctx.getImageData(0, 0, width, height);
  const origData = original.data;
  const minDim = Math.min(width, height);

  const blurRadius = Math.max(1.5, Math.round((minDim / 1080) * (intensity / 100) * 3.5 * 10) / 10);

  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = width;
  blurredCanvas.height = height;
  const blurCtx = blurredCanvas.getContext('2d');
  if (!blurCtx) return;

  blurCtx.filter = `blur(${blurRadius}px)`;
  blurCtx.drawImage(ctx.canvas, 0, 0);

  const blurData = blurCtx.getImageData(0, 0, width, height).data;
  const maxBlend = (intensity / 100) * 0.5;

  for (let i = 0; i < origData.length; i += 4) {
    const r = origData[i];
    const g = origData[i + 1];
    const b = origData[i + 2];

    // Perceptual skin range heuristic with soft feathering
    const isSkin =
      r > 50 &&
      g > 35 &&
      b > 20 &&
      r > g &&
      g >= b &&
      (r - g) >= 6 &&
      (r - b) >= 12 &&
      (r - g) <= 85;

    if (isSkin) {
      const diffLuma =
        Math.abs(r - blurData[i]) * 0.299 +
        Math.abs(g - blurData[i + 1]) * 0.587 +
        Math.abs(b - blurData[i + 2]) * 0.114;

      // Strict edge protection: do not smooth across sharp edges (eyes, lashes, lips)
      if (diffLuma < 28) {
        // Soft feather weight based on proximity to edge
        const edgeFactor = Math.max(0, 1 - diffLuma / 28);
        const blend = maxBlend * edgeFactor;

        origData[i] = Math.round(r * (1 - blend) + blurData[i] * blend);
        origData[i + 1] = Math.round(g * (1 - blend) + blurData[i + 1] * blend);
        origData[i + 2] = Math.round(b * (1 - blend) + blurData[i + 2] * blend);
      }
    }
  }

  ctx.putImageData(original, 0, 0);
}
