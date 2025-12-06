import { NormalizedLandmarkList } from '@mediapipe/face_mesh';

export interface FacePositionStatus {
  isPositionOK: boolean;
  isSizeOK: boolean;
  isFrontFacing: boolean;
  message: string;
  messageKey: 'ok' | 'closer' | 'farther' | 'center' | 'turn';
}

// 顔の位置とサイズをチェック
export function checkFacePosition(
  landmarks: NormalizedLandmarkList,
  containerWidth: number,
  containerHeight: number
): FacePositionStatus {
  // 顔の境界ボックスを計算
  let minX = 1, maxX = 0, minY = 1, maxY = 0;

  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const faceCenterX = (minX + maxX) / 2;
  const faceCenterY = (minY + maxY) / 2;

  // 顔のサイズチェック（画面に対する割合）
  // 理想: 顔の幅が画面幅の40-60%程度
  const sizeRatio = faceWidth;
  const isSizeTooSmall = sizeRatio < 0.35; // 35%未満は小さすぎ
  const isSizeTooBig = sizeRatio > 0.75;   // 75%以上は大きすぎ
  const isSizeOK = !isSizeTooSmall && !isSizeTooBig;

  // 顔の位置チェック（中央に近いか）
  // 許容範囲: 中央から±15%以内
  const centerOffsetX = Math.abs(faceCenterX - 0.5);
  const centerOffsetY = Math.abs(faceCenterY - 0.45); // 少し上寄りを期待
  const isPositionOK = centerOffsetX < 0.15 && centerOffsetY < 0.15;

  // 正面を向いているかチェック（鼻と目の位置関係）
  // 鼻先(1)、左目外側(33)、右目外側(263)
  const noseTip = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];

  // 鼻が両目の中間付近にあるか
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const noseOffset = Math.abs(noseTip.x - eyeMidX);
  const isFrontFacing = noseOffset < 0.05; // 5%以内のズレは許容

  // メッセージ決定
  let message = '';
  let messageKey: FacePositionStatus['messageKey'] = 'ok';

  if (!isSizeOK) {
    if (isSizeTooSmall) {
      message = '顔を近づけてください';
      messageKey = 'closer';
    } else {
      message = '少し離れてください';
      messageKey = 'farther';
    }
  } else if (!isPositionOK) {
    message = '顔を中心に合わせてください';
    messageKey = 'center';
  } else if (!isFrontFacing) {
    message = '正面を向いてください';
    messageKey = 'turn';
  } else {
    message = '';
    messageKey = 'ok';
  }

  return {
    isPositionOK,
    isSizeOK,
    isFrontFacing,
    message,
    messageKey,
  };
}

// 顔の境界ボックスを取得（ガイド表示用）
export function getFaceBoundingBox(landmarks: NormalizedLandmarkList) {
  let minX = 1, maxX = 0, minY = 1, maxY = 0;

  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
