export interface EnhancementSettings {
  sharpness: number; // 0 to 100 (default: 60)
  clarity: number; // 0 to 100 (default: 40)
  brightness: number; // -50 to 50 (default: 5)
  contrast: number; // -50 to 50 (default: 10)
  saturation: number; // -50 to 50 (default: 10)
  smoothSkin: number; // 0 to 100 (default: 20)
  warmth?: number; // -50 to 50 (default: 0)
  rose?: number; // 0 to 50 (default: 0, 血色感・トーンアップ)
  upscale: 1 | 2; // 1x or 2x resolution
}

export const defaultEnhancementSettings: EnhancementSettings = {
  sharpness: 60,
  clarity: 40,
  brightness: 5,
  contrast: 10,
  saturation: 10,
  smoothSkin: 25,
  warmth: 0,
  rose: 0,
  upscale: 2,
};

/**
 * Applies professional-grade client-side photo enhancements:
 * - Unsharp Mask (spatial sharpening)
 * - Local tone mapping & Clarity
 * - Bilateral-style skin smoothing & tone up
 * - High-DPI upscale rendering
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

  // Optional: Skin smoothing before sharpening if smoothSkin > 0
  if (settings.smoothSkin > 0) {
    applySkinSmoothing(ctx, targetWidth, targetHeight, settings.smoothSkin);
  }

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const len = data.length;

  // 1. Color, Brightness, Contrast, Saturation, Warmth & Rose Tint Adjustment
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
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = gray + satFactor * (r - gray);
    g = gray + satFactor * (g - gray);
    b = gray + satFactor * (b - gray);

    // Warmth & Rose tone (血色感・透明感)
    if (warmthVal !== 0) {
      r += warmthVal;
      b -= warmthVal;
    }
    if (roseVal > 0) {
      // Natural rosy tint targeting skin/highlights
      r += roseVal * 0.9;
      g += roseVal * 0.1;
      b += roseVal * 0.4;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  // Put color adjusted pixels back to canvas
  ctx.putImageData(imageData, 0, 0);

  // 2. Unsharp Mask (High-pass sharpening)
  if (settings.sharpness > 0 || settings.clarity > 0) {
    const sharpenAmount = (settings.sharpness / 100) * 1.5;
    const clarityAmount = (settings.clarity / 100) * 0.8;
    const totalBoost = sharpenAmount + clarityAmount;

    applyUnsharpMask(ctx, targetWidth, targetHeight, totalBoost);
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Unsharp mask implementation using separable convolution.
 */
function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  const original = ctx.getImageData(0, 0, width, height);
  const origData = original.data;

  // Create blurred copy for high-pass difference
  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = width;
  blurredCanvas.height = height;
  const blurCtx = blurredCanvas.getContext('2d');
  if (!blurCtx) return;

  // Approximate blur with built-in filter
  blurCtx.filter = 'blur(2px)';
  blurCtx.drawImage(ctx.canvas, 0, 0);

  const blurData = blurCtx.getImageData(0, 0, width, height).data;

  // High-pass blending: Enhanced = Original + amount * (Original - Blurred)
  for (let i = 0; i < origData.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const origVal = origData[i + c];
      const blurVal = blurData[i + c];
      const diff = origVal - blurVal;

      // Thresholding to prevent amplifying noise in smooth areas
      if (Math.abs(diff) > 2) {
        origData[i + c] = Math.min(255, Math.max(0, origVal + diff * amount));
      }
    }
  }

  ctx.putImageData(original, 0, 0);
}

/**
 * Gentle skin smoothing filter preserving sharp facial edges
 */
function applySkinSmoothing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const original = ctx.getImageData(0, 0, width, height);
  const origData = original.data;

  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = width;
  blurredCanvas.height = height;
  const blurCtx = blurredCanvas.getContext('2d');
  if (!blurCtx) return;

  const blurRadius = Math.max(1, Math.round((intensity / 100) * 3));
  blurCtx.filter = `blur(${blurRadius}px)`;
  blurCtx.drawImage(ctx.canvas, 0, 0);

  const blurData = blurCtx.getImageData(0, 0, width, height).data;
  const blendFactor = (intensity / 100) * 0.45;

  for (let i = 0; i < origData.length; i += 4) {
    const r = origData[i];
    const g = origData[i + 1];
    const b = origData[i + 2];

    // Simple skin tone heuristic
    const isSkin = r > 60 && g > 40 && b > 20 && r > g && g >= b && (r - g) >= 8 && (r - b) >= 15;

    if (isSkin) {
      const edgeDiff = Math.abs(r - blurData[i]) + Math.abs(g - blurData[i + 1]) + Math.abs(b - blurData[i + 2]);
      // Only blend if not an edge (eyes, hair, lips, contours)
      if (edgeDiff < 45) {
        origData[i] = Math.round(r * (1 - blendFactor) + blurData[i] * blendFactor);
        origData[i + 1] = Math.round(g * (1 - blendFactor) + blurData[i + 1] * blendFactor);
        origData[i + 2] = Math.round(b * (1 - blendFactor) + blurData[i + 2] * blendFactor);
      }
    }
  }

  ctx.putImageData(original, 0, 0);
}
