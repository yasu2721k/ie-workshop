// src/lib/eyeAnalyzer.ts
import { EYE_LANDMARKS } from './mediapipe';
import { EyePosition, EyePositions } from '@/types/diagnosis';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

export const getEyePositions = (
  landmarks: Landmark[]
): EyePositions => {
  // 目の中心（虹彩）- MediaPipeの468+は虹彩ランドマーク
  const leftEyeCenter = landmarks[EYE_LANDMARKS.leftEye.center];
  const rightEyeCenter = landmarks[EYE_LANDMARKS.rightEye.center];

  // 目の下エリア
  const leftUnderEye = EYE_LANDMARKS.underEye.left.map(i => ({
    x: landmarks[i]?.x || 0,
    y: landmarks[i]?.y || 0,
  }));
  const rightUnderEye = EYE_LANDMARKS.underEye.right.map(i => ({
    x: landmarks[i]?.x || 0,
    y: landmarks[i]?.y || 0,
  }));

  return {
    leftEye: {
      x: leftEyeCenter?.x || 0,
      y: leftEyeCenter?.y || 0
    },
    rightEye: {
      x: rightEyeCenter?.x || 0,
      y: rightEyeCenter?.y || 0
    },
    leftUnderEye,
    rightUnderEye,
  };
};

// 目の開き具合を計算
export const calculateEyeOpenness = (landmarks: Landmark[]): { left: number; right: number } => {
  const leftUpper = landmarks[EYE_LANDMARKS.leftEye.upper[0]];
  const leftLower = landmarks[EYE_LANDMARKS.leftEye.lower[0]];
  const rightUpper = landmarks[EYE_LANDMARKS.rightEye.upper[0]];
  const rightLower = landmarks[EYE_LANDMARKS.rightEye.lower[0]];

  const leftOpenness = leftUpper && leftLower
    ? Math.abs(leftUpper.y - leftLower.y)
    : 0;
  const rightOpenness = rightUpper && rightLower
    ? Math.abs(rightUpper.y - rightLower.y)
    : 0;

  return { left: leftOpenness, right: rightOpenness };
};

// 目尻の角度を計算
export const calculateEyeCornerAngle = (landmarks: Landmark[]): { left: number; right: number } => {
  const leftInner = landmarks[EYE_LANDMARKS.leftEye.corner.inner];
  const leftOuter = landmarks[EYE_LANDMARKS.leftEye.corner.outer];
  const rightInner = landmarks[EYE_LANDMARKS.rightEye.corner.inner];
  const rightOuter = landmarks[EYE_LANDMARKS.rightEye.corner.outer];

  const leftAngle = leftInner && leftOuter
    ? Math.atan2(leftOuter.y - leftInner.y, leftOuter.x - leftInner.x) * (180 / Math.PI)
    : 0;
  const rightAngle = rightInner && rightOuter
    ? Math.atan2(rightOuter.y - rightInner.y, rightOuter.x - rightInner.x) * (180 / Math.PI)
    : 0;

  return { left: leftAngle, right: rightAngle };
};

// Extract pixel data from a specific region
function extractRegionPixels(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): Uint8ClampedArray {
  const pixels: number[] = [];
  const { data, width: imgWidth } = imageData;

  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(imgWidth, Math.floor(x + width));
  const endY = Math.min(imageData.height, Math.floor(y + height));

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const idx = (py * imgWidth + px) * 4;
      pixels.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
    }
  }

  return new Uint8ClampedArray(pixels);
}

// Calculate average brightness (luminance) of pixels
function calculateBrightness(pixels: Uint8ClampedArray): number {
  if (pixels.length === 0) return 128;

  let totalLuminance = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Using perceived luminance formula
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
  }

  return totalLuminance / pixelCount;
}

// Calculate contrast using standard deviation
function calculateContrast(pixels: Uint8ClampedArray): number {
  if (pixels.length === 0) return 0;

  const brightness = calculateBrightness(pixels);
  let sumSquaredDiff = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    sumSquaredDiff += Math.pow(luminance - brightness, 2);
  }

  return Math.sqrt(sumSquaredDiff / pixelCount);
}

export interface LegacyAnalysisResult {
  type: 'dark_circles' | 'wrinkles';
  score: number;
  brightness: number;
  contrast: number;
  eyePositions: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    imageWidth: number;
    imageHeight: number;
  };
}

// Legacy face-api.js compatible analysis function
export function analyzeEyeAreaLegacy(
  imageData: ImageData,
  landmarks: { positions: { x: number; y: number }[] }
): LegacyAnalysisResult {
  const positions = landmarks.positions;

  // Get eye centers
  const leftEyePoints = positions.slice(36, 42);
  const rightEyePoints = positions.slice(42, 48);

  const leftEyeCenter = {
    x: leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length,
    y: leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length,
  };

  const rightEyeCenter = {
    x: rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length,
    y: rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length,
  };

  // Get under-eye region
  const leftEyeBottom = positions[40];
  const rightEyeBottom = positions[46];
  const regionSize = 20;
  const offsetY = 5;

  const leftPixels = extractRegionPixels(
    imageData,
    leftEyeBottom.x - regionSize / 2,
    leftEyeBottom.y + offsetY,
    regionSize,
    regionSize / 2
  );

  const rightPixels = extractRegionPixels(
    imageData,
    rightEyeBottom.x - regionSize / 2,
    rightEyeBottom.y + offsetY,
    regionSize,
    regionSize / 2
  );

  const leftBrightness = calculateBrightness(leftPixels);
  const rightBrightness = calculateBrightness(rightPixels);
  const avgBrightness = (leftBrightness + rightBrightness) / 2;

  // Get eye corner region for wrinkle detection
  const leftCorner = positions[36];
  const rightCorner = positions[45];
  const cornerRegionSize = 15;
  const offsetX = -10;

  const leftCornerPixels = extractRegionPixels(
    imageData,
    leftCorner.x + offsetX - cornerRegionSize / 2,
    leftCorner.y - cornerRegionSize / 2,
    cornerRegionSize,
    cornerRegionSize
  );

  const rightCornerPixels = extractRegionPixels(
    imageData,
    rightCorner.x - offsetX - cornerRegionSize / 2,
    rightCorner.y - cornerRegionSize / 2,
    cornerRegionSize,
    cornerRegionSize
  );

  const leftContrast = calculateContrast(leftCornerPixels);
  const rightContrast = calculateContrast(rightCornerPixels);
  const avgContrast = (leftContrast + rightContrast) / 2;

  // Classification thresholds
  const BRIGHTNESS_THRESHOLD = 120;
  const CONTRAST_THRESHOLD = 35;

  let type: 'dark_circles' | 'wrinkles';
  let score: number;

  if (avgBrightness < BRIGHTNESS_THRESHOLD) {
    type = 'dark_circles';
    const darknessLevel = (BRIGHTNESS_THRESHOLD - avgBrightness) / BRIGHTNESS_THRESHOLD;
    score = Math.max(60, Math.min(95, 100 - darknessLevel * 40));
  } else if (avgContrast > CONTRAST_THRESHOLD) {
    type = 'wrinkles';
    const wrinkleLevel = (avgContrast - CONTRAST_THRESHOLD) / 50;
    score = Math.max(60, Math.min(95, 100 - wrinkleLevel * 40));
  } else {
    if (avgBrightness < 140) {
      type = 'dark_circles';
      score = 80;
    } else {
      type = 'wrinkles';
      score = 75;
    }
  }

  return {
    type,
    score: Math.round(score),
    brightness: Math.round(avgBrightness),
    contrast: Math.round(avgContrast),
    eyePositions: {
      leftEye: leftEyeCenter,
      rightEye: rightEyeCenter,
      imageWidth: imageData.width,
      imageHeight: imageData.height,
    },
  };
}
