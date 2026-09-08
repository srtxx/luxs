import { BurstFrame } from './video-burst';

export interface FrameScoreResult {
  score: number; // 0 - 100
  sharpnessScore: number;
  exposureScore: number;
  contrastScore: number;
  isBlurry: boolean;
}

/**
 * Calculates sharpness using the Variance of Laplacian on an HTML Image / Canvas.
 * Clearer, sharper images with less motion blur have significantly higher Laplacian variance.
 */
export function analyzeImageSharpness(imageData: ImageData): {
  variance: number;
  meanLuminance: number;
  contrast: number;
  clippingRatio: number;
} {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  // 1. Convert to grayscale luminance
  const gray = new Float32Array(pixelCount);
  let totalLum = 0;
  let clippedPixels = 0;

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Standard Rec. 709 luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    gray[i] = lum;
    totalLum += lum;

    if (lum < 8 || lum > 248) {
      clippedPixels++;
    }
  }

  const meanLuminance = totalLum / pixelCount;

  // Calculate contrast (standard deviation of luminance)
  let sumSqDiff = 0;
  for (let i = 0; i < pixelCount; i++) {
    const diff = gray[i] - meanLuminance;
    sumSqDiff += diff * diff;
  }
  const contrast = Math.sqrt(sumSqDiff / pixelCount);

  // 2. Laplacian operator convolution
  // Kernel:
  // [ 0,  1,  0 ]
  // [ 1, -4,  1 ]
  // [ 0,  1,  0 ]
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let laplacianCount = 0;

  // Step with stride 2 for performance on large images
  const step = width > 800 ? 2 : 1;

  for (let y = 1; y < height - 1; y += step) {
    const rowOffset = y * width;
    const upOffset = (y - 1) * width;
    const downOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x += step) {
      const center = gray[rowOffset + x];
      const top = gray[upOffset + x];
      const bottom = gray[downOffset + x];
      const left = gray[rowOffset + x - 1];
      const right = gray[rowOffset + x + 1];

      const lap = top + bottom + left + right - 4 * center;
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      laplacianCount++;
    }
  }

  const lapMean = laplacianSum / (laplacianCount || 1);
  const variance = laplacianSumSq / (laplacianCount || 1) - lapMean * lapMean;
  const clippingRatio = clippedPixels / pixelCount;

  return {
    variance: Math.max(0, variance),
    meanLuminance,
    contrast,
    clippingRatio,
  };
}

/**
 * Scores a single burst frame based on sharpness, exposure and contrast.
 */
export async function scoreFrame(frame: BurstFrame): Promise<FrameScoreResult> {
  const img = new Image();
  img.src = frame.dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for scoring'));
  });

  const canvas = document.createElement('canvas');
  // Downscale slightly for uniform and fast scoring calculation
  const targetWidth = Math.min(frame.width, 640);
  const scale = targetWidth / frame.width;
  const targetHeight = Math.round(frame.height * scale);

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context for scoring');

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

  const { variance, meanLuminance, contrast, clippingRatio } = analyzeImageSharpness(imageData);

  // Sharpness calculation: Logarithmic scale of variance
  // Typical sharp image variance > 100, blurry < 30
  const sharpnessScore = Math.min(100, Math.max(0, Math.log10(variance + 1) * 35));

  // Exposure calculation: penalize extreme darkness, extreme brightness, or heavy clipping
  let exposureScore = 100;
  const lumDistFromIdeal = Math.abs(meanLuminance - 128);
  exposureScore -= (lumDistFromIdeal / 128) * 40;
  exposureScore -= clippingRatio * 60;
  exposureScore = Math.min(100, Math.max(0, exposureScore));

  // Contrast calculation: good contrast gives depth
  const contrastScore = Math.min(100, Math.max(0, (contrast / 64) * 100));

  // Composite score: 65% Sharpness, 20% Exposure, 15% Contrast
  const finalScore = Math.round(sharpnessScore * 0.65 + exposureScore * 0.2 + contrastScore * 0.15);

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    sharpnessScore: Math.round(sharpnessScore),
    exposureScore: Math.round(exposureScore),
    contrastScore: Math.round(contrastScore),
    isBlurry: sharpnessScore < 35,
  };
}

/**
 * Scores an array of burst frames and assigns ranks (1 = best pick).
 */
export async function scoreAllFrames(
  frames: BurstFrame[],
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<BurstFrame[]> {
  const scoredFrames: BurstFrame[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const scoreResult = await scoreFrame(frame);

    scoredFrames.push({
      ...frame,
      score: scoreResult.score,
      sharpnessScore: scoreResult.sharpnessScore,
      exposureScore: scoreResult.exposureScore,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / frames.length) * 100), i + 1, frames.length);
    }
  }

  // Assign ranks based on final score descending
  const sorted = [...scoredFrames].sort((a, b) => (b.score || 0) - (a.score || 0));
  const rankMap = new Map<string, number>();
  sorted.forEach((item, index) => {
    rankMap.set(item.id, index + 1);
  });

  return scoredFrames.map((frame) => ({
    ...frame,
    rank: rankMap.get(frame.id) || 999,
  }));
}
