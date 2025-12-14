/**
 * 肌トーン・血色の詳細分析
 * 目元周辺の色情報を解析し、科学的な数値を算出
 */

export interface SkinToneAnalysis {
  // 青み成分（青クマ度）- 血行不良による青み 0-100
  blueness: number;
  // 茶み成分（茶クマ度）- 色素沈着による茶色み 0-100
  brownness: number;
  // 黄ぐすみ度 0-100
  yellowness: number;
  // 赤み度（炎症・血管の透け）0-100
  redness: number;
  // 透明感スコア（明るさ・均一性）0-100
  clarity: number;
  // 肌の明るさ 0-100
  brightness: number;
}

/**
 * 画像から目元領域の色分析を行う
 */
export function analyzeSkinTone(imageData: string): Promise<SkinToneAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(getDefaultAnalysis());
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 目元領域を抽出（画像中央上部の30%を分析対象）
      const eyeRegion = {
        x: Math.floor(img.width * 0.2),
        y: Math.floor(img.height * 0.25),
        width: Math.floor(img.width * 0.6),
        height: Math.floor(img.height * 0.2),
      };

      const pixels = ctx.getImageData(
        eyeRegion.x,
        eyeRegion.y,
        eyeRegion.width,
        eyeRegion.height
      );

      const analysis = analyzePixels(pixels.data);
      resolve(analysis);
    };

    img.onerror = () => {
      resolve(getDefaultAnalysis());
    };

    img.src = imageData;
  });
}

/**
 * ピクセルデータから色成分を分析
 */
function analyzePixels(data: Uint8ClampedArray): SkinToneAnalysis {
  let totalR = 0, totalG = 0, totalB = 0;
  let totalH = 0, totalS = 0, totalL = 0;
  let pixelCount = 0;

  // 色の偏りを計算するための配列
  const hues: number[] = [];
  const saturations: number[] = [];
  const lightnesses: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // const a = data[i + 3]; // Alpha（未使用）

    // 肌色っぽいピクセルのみを分析（ノイズ除去）
    if (isSkinTone(r, g, b)) {
      totalR += r;
      totalG += g;
      totalB += b;

      const hsl = rgbToHsl(r, g, b);
      totalH += hsl.h;
      totalS += hsl.s;
      totalL += hsl.l;

      hues.push(hsl.h);
      saturations.push(hsl.s);
      lightnesses.push(hsl.l);

      pixelCount++;
    }
  }

  if (pixelCount === 0) {
    return getDefaultAnalysis();
  }

  // 平均値を計算
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgH = totalH / pixelCount;
  const avgS = totalS / pixelCount;
  const avgL = totalL / pixelCount;

  // 各成分を計算
  // 青み成分：青が強い + 明度が低い = 青クマ
  const blueness = calculateBlueness(avgR, avgG, avgB, avgL);

  // 茶み成分：色相が茶色寄り + 彩度が高い = 茶クマ
  const brownness = calculateBrownness(avgH, avgS, avgL);

  // 黄ぐすみ：黄色成分が強い
  const yellowness = calculateYellowness(avgR, avgG, avgB, avgH);

  // 赤み：赤成分が突出している
  const redness = calculateRedness(avgR, avgG, avgB);

  // 透明感：明度が高く、彩度が低め、色ムラが少ない
  const clarity = calculateClarity(avgL, avgS, lightnesses);

  // 明るさ
  const brightness = Math.min(100, Math.round(avgL * 100));

  return {
    blueness: clamp(blueness, 0, 100),
    brownness: clamp(brownness, 0, 100),
    yellowness: clamp(yellowness, 0, 100),
    redness: clamp(redness, 0, 100),
    clarity: clamp(clarity, 0, 100),
    brightness: clamp(brightness, 0, 100),
  };
}

/**
 * 肌色かどうかを判定
 */
function isSkinTone(r: number, g: number, b: number): boolean {
  // 簡易的な肌色判定
  // R > G > B の傾向があり、極端に暗すぎたり明るすぎない
  const isRgbOrder = r > g && g > b * 0.8;
  const notTooDark = r > 60 && g > 40 && b > 20;
  const notTooLight = r < 255 && g < 240 && b < 230;
  const notGray = Math.abs(r - g) > 5 || Math.abs(g - b) > 5;

  return isRgbOrder && notTooDark && notTooLight && notGray;
}

/**
 * RGB to HSL変換
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * 青み成分を計算（青クマ度）
 */
function calculateBlueness(r: number, g: number, b: number, l: number): number {
  // 青が相対的に強く、明度が低いほど青クマ
  const blueRatio = b / Math.max(1, (r + g) / 2);
  const darknessBonus = (1 - l) * 0.5;
  return Math.round((blueRatio * 50 + darknessBonus * 50) * (1 - l * 0.3));
}

/**
 * 茶み成分を計算（茶クマ度）
 */
function calculateBrownness(h: number, s: number, l: number): number {
  // 色相が茶色範囲（0.02-0.12）で彩度が高いほど茶クマ
  const brownHueRange = h >= 0.02 && h <= 0.12;
  const hueScore = brownHueRange ? 1 - Math.abs(h - 0.07) * 10 : 0;
  const satScore = s * 0.7;
  const darkScore = (1 - l) * 0.3;
  return Math.round((hueScore * 40 + satScore * 40 + darkScore * 20) * 100) / 100 * 100;
}

/**
 * 黄ぐすみ度を計算
 */
function calculateYellowness(r: number, g: number, b: number, h: number): number {
  // 黄色の色相範囲（0.1-0.2）
  const yellowHue = h >= 0.1 && h <= 0.2;
  const yellowRatio = (r + g) / 2 / Math.max(1, b);
  const hueScore = yellowHue ? 1 : 0.3;
  return Math.round(Math.min(100, yellowRatio * 10 * hueScore));
}

/**
 * 赤み度を計算
 */
function calculateRedness(r: number, g: number, b: number): number {
  // 赤が突出している度合い
  const avg = (r + g + b) / 3;
  const redExcess = Math.max(0, r - avg) / avg;
  return Math.round(Math.min(100, redExcess * 200));
}

/**
 * 透明感スコアを計算
 */
function calculateClarity(avgL: number, avgS: number, lightnesses: number[]): number {
  // 明度が高い
  const lightnessScore = avgL * 40;

  // 彩度が適度（高すぎず低すぎず）
  const saturationScore = (1 - Math.abs(avgS - 0.3)) * 30;

  // 色ムラが少ない（明度の標準偏差が小さい）
  const variance = calculateVariance(lightnesses);
  const uniformityScore = Math.max(0, 30 - variance * 100);

  return Math.round(lightnessScore + saturationScore + uniformityScore);
}

/**
 * 分散を計算
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * 値を範囲内に収める
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * デフォルト値
 */
function getDefaultAnalysis(): SkinToneAnalysis {
  return {
    blueness: 20,
    brownness: 15,
    yellowness: 10,
    redness: 15,
    clarity: 70,
    brightness: 65,
  };
}
