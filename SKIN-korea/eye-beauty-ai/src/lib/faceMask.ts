// 顔の領域マスクを生成するユーティリティ
import { FACE_LANDMARKS } from './mediapipe';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

// 顔の輪郭内かどうかを判定
export function isInsideFace(
  x: number, 
  y: number, 
  landmarks: Landmark[], 
  width: number, 
  height: number
): boolean {
  const faceOval = FACE_LANDMARKS.faceOval;
  
  // ポリゴンのポイント配列を作成
  const polygon = faceOval.map(idx => ({
    x: landmarks[idx].x * width,
    y: landmarks[idx].y * height
  }));
  
  // Point in polygon アルゴリズム
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// 顔のマスクをキャンバスに描画
export function drawFaceMask(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
) {
  const faceOval = FACE_LANDMARKS.faceOval;
  
  ctx.save();
  ctx.beginPath();
  
  // 顔の輪郭をパスとして描画
  faceOval.forEach((idx, i) => {
    const point = landmarks[idx];
    const x = point.x * width;
    const y = point.y * height;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.closePath();
  ctx.clip(); // この範囲内のみ描画可能にする
}

// 顔の特定部位の中心点を取得
export function getFacialRegionCenter(
  region: 'forehead' | 'leftCheek' | 'rightCheek' | 'nose' | 'chin',
  landmarks: Landmark[]
): { x: number; y: number } {
  let indices: number[] = [];
  
  switch (region) {
    case 'forehead':
      indices = [9, 10, 151, 337, 299, 333, 298, 301];
      break;
    case 'leftCheek':
      indices = [36, 205, 206, 207, 213, 192, 147, 123, 116];
      break;
    case 'rightCheek':
      indices = [266, 425, 426, 427, 436, 416, 376, 352, 345];
      break;
    case 'nose':
      indices = [1, 2, 5, 6, 19, 20, 94, 168, 195, 197];
      break;
    case 'chin':
      indices = [18, 175, 199, 200, 9, 17, 18];
      break;
  }
  
  if (indices.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  
  // 平均位置を計算
  let sumX = 0, sumY = 0;
  indices.forEach(idx => {
    sumX += landmarks[idx].x;
    sumY += landmarks[idx].y;
  });
  
  return {
    x: sumX / indices.length,
    y: sumY / indices.length
  };
}

// 顔の領域の境界ボックスを取得
export function getFaceBounds(landmarks: Landmark[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const faceOval = FACE_LANDMARKS.faceOval;
  
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  
  faceOval.forEach(idx => {
    const point = landmarks[idx];
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  
  return { minX, maxX, minY, maxY };
}