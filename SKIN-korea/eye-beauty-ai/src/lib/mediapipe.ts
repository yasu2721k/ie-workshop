// src/lib/mediapipe.ts
// MediaPipe Face Mesh設定（動的インポートで使用）

// 目の周りのランドマークインデックス
export const EYE_LANDMARKS = {
  // 左目（画面から見て右側）
  leftEye: {
    upper: [386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
    lower: [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380],
    corner: { inner: 362, outer: 263 },
    center: 468,  // iris center (refineLandmarks=true時)
  },
  // 右目（画面から見て左側）
  rightEye: {
    upper: [159, 160, 161, 246, 33, 7, 163, 144, 145, 153, 154, 155],
    lower: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153],
    corner: { inner: 133, outer: 33 },
    center: 473,  // iris center (refineLandmarks=true時)
  },
  // 目の下（クマ検出エリア）
  underEye: {
    left: [111, 117, 118, 119, 120, 121, 128, 245],
    right: [340, 346, 347, 348, 349, 350, 357, 465],
  },
  // 目尻（シワ検出エリア）
  crowsFeet: {
    left: [263, 249, 390, 373, 374],
    right: [33, 7, 163, 144, 145],
  },
};

// 顔のアウトラインとパーツのインデックス
export const FACE_LANDMARKS = {
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  leftEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  rightEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  lips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 61],
};

// MediaPipe FaceMeshの初期化（クライアントサイドでのみ使用）
export const initFaceMesh = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  // 動的インポート
  const { FaceMesh } = await import('@mediapipe/face_mesh');

  const faceMesh = new FaceMesh({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    },
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,  // 目・唇の詳細ランドマーク有効
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return faceMesh;
};
