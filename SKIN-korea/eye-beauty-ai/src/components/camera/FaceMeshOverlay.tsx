'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FACE_LANDMARKS, FACE_MESH_TESSELATION } from '@/lib/mediapipe';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FaceMeshOverlayProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
  videoWidth: number;
  videoHeight: number;
  isDetected: boolean;
}

// MediaPipe公式のテッセレーション接続（完全版）
const FULL_TESSELATION: [number, number][] = [
  // 顔全体のメッシュ接続
  [127, 34], [34, 139], [139, 127], [11, 0], [0, 37], [37, 11],
  [232, 231], [231, 120], [120, 232], [72, 37], [37, 39], [39, 72],
  [128, 121], [121, 47], [47, 128], [232, 121], [121, 128], [128, 232],
  [104, 69], [69, 67], [67, 104], [175, 171], [171, 148], [148, 175],
  [118, 50], [50, 101], [101, 118], [73, 39], [39, 40], [40, 73],
  [9, 151], [151, 108], [108, 9], [48, 115], [115, 131], [131, 48],
  [194, 204], [204, 211], [211, 194], [74, 40], [40, 185], [185, 74],
  [80, 42], [42, 183], [183, 80], [40, 92], [92, 186], [186, 40],
  [230, 229], [229, 118], [118, 230], [202, 212], [212, 214], [214, 202],
  [83, 18], [18, 17], [17, 83], [76, 61], [61, 146], [146, 76],
  [160, 29], [29, 30], [30, 160], [56, 157], [157, 173], [173, 56],
  [106, 204], [204, 194], [194, 106], [135, 214], [214, 192], [192, 135],
  [203, 165], [165, 98], [98, 203], [21, 71], [71, 68], [68, 21],
  [51, 45], [45, 4], [4, 51], [144, 24], [24, 23], [23, 144],
  [77, 146], [146, 91], [91, 77], [205, 50], [50, 187], [187, 205],
  [201, 200], [200, 18], [18, 201], [91, 106], [106, 182], [182, 91],
  [90, 91], [91, 181], [181, 90], [85, 84], [84, 17], [17, 85],
  [206, 203], [203, 36], [36, 206], [148, 171], [171, 140], [140, 148],
  [92, 40], [40, 39], [39, 92], [193, 189], [189, 244], [244, 193],
  [159, 158], [158, 28], [28, 159], [247, 246], [246, 161], [161, 247],
  [236, 3], [3, 196], [196, 236], [54, 68], [68, 104], [104, 54],
  [193, 168], [168, 8], [8, 193], [117, 228], [228, 31], [31, 117],
  [189, 193], [193, 55], [55, 189], [98, 97], [97, 99], [99, 98],
  [126, 47], [47, 100], [100, 126], [166, 79], [79, 218], [218, 166],
  [155, 154], [154, 26], [26, 155], [209, 49], [49, 131], [131, 209],
  [135, 136], [136, 150], [150, 135], [47, 126], [126, 217], [217, 47],
  [223, 52], [52, 53], [53, 223], [45, 51], [51, 134], [134, 45],
  [211, 170], [170, 140], [140, 211], [67, 69], [69, 108], [108, 67],
  [43, 106], [106, 91], [91, 43], [230, 119], [119, 120], [120, 230],
  [226, 130], [130, 247], [247, 226], [63, 53], [53, 52], [52, 63],
  [238, 20], [20, 242], [242, 238], [46, 70], [70, 63], [63, 46],
  [7, 163], [163, 144], [144, 7], [285, 8], [8, 417], [417, 285],
  [33, 246], [246, 161], [161, 33], [105, 63], [63, 52], [52, 105],
  [107, 66], [66, 69], [69, 107], [336, 296], [296, 334], [334, 336],
  // 顔の輪郭
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389],
  [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397],
  [397, 365], [365, 379], [379, 378], [378, 400], [400, 377], [377, 152],
  [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172],
  [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162],
  [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
  // 左目
  [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381],
  [381, 382], [382, 362], [362, 398], [398, 384], [384, 385], [385, 386],
  [386, 387], [387, 388], [388, 466], [466, 263],
  // 右目
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154],
  [154, 155], [155, 133], [133, 173], [173, 157], [157, 158], [158, 159],
  [159, 160], [160, 161], [161, 246], [246, 33],
  // 唇
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314],
  [314, 405], [405, 321], [321, 375], [375, 291], [291, 308], [308, 324],
  [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178],
  [178, 88], [88, 95], [95, 61],
  // 左眉
  [276, 283], [283, 282], [282, 295], [295, 285], [285, 300], [300, 293],
  [293, 334], [334, 296], [296, 336],
  // 右眉
  [46, 53], [53, 52], [52, 65], [65, 55], [55, 70], [70, 63],
  [63, 105], [105, 66], [66, 107],
  // 鼻
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1],
  [1, 19], [19, 94], [94, 2],
  // 追加の顔の接続
  [0, 267], [267, 269], [269, 270], [270, 409], [409, 291], [291, 375],
  [267, 0], [0, 37], [37, 267], [269, 267], [267, 270], [270, 269],
  [409, 270], [270, 291], [291, 409],
  // 頬
  [117, 118], [118, 119], [119, 120], [120, 121], [346, 347], [347, 348],
  [348, 349], [349, 350],
  // 額の追加接続
  [68, 104], [104, 63], [63, 68], [297, 338], [338, 10], [10, 297],
  // 顎周り
  [152, 377], [377, 400], [400, 378], [378, 379], [379, 365], [365, 397],
  // 目の周りの詳細
  [133, 243], [243, 190], [190, 56], [56, 28], [28, 27], [27, 29],
  [29, 30], [30, 247], [247, 130], [130, 25], [25, 110], [110, 24],
  [24, 23], [23, 22], [22, 26], [26, 112], [112, 243], [243, 133],
  [362, 463], [463, 414], [414, 286], [286, 258], [258, 257], [257, 259],
  [259, 260], [260, 467], [467, 359], [359, 255], [255, 339], [339, 254],
  [254, 253], [253, 252], [252, 256], [256, 341], [341, 463], [463, 362],
  // 鼻の周り
  [2, 326], [326, 327], [327, 278], [278, 279], [279, 280], [280, 281],
  [281, 282], [282, 283], [283, 276], [276, 352],
  [2, 97], [97, 98], [98, 48], [48, 49], [49, 50], [50, 51],
  [51, 52], [52, 53], [53, 46], [46, 123],
];

export const FaceMeshOverlay = ({
  landmarks,
  width,
  height,
  videoWidth,
  videoHeight,
  isDetected
}: FaceMeshOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks || width === 0 || height === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // クリア
    ctx.clearRect(0, 0, width, height);

    // object-cover の座標補正を計算
    // ビデオとコンテナのアスペクト比を比較
    const containerAspect = width / height;
    const videoAspect = videoWidth && videoHeight ? videoWidth / videoHeight : containerAspect;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > containerAspect) {
      // ビデオの方が横長 → 左右がトリミングされる
      scale = height / (videoHeight || height);
      const scaledVideoWidth = (videoWidth || width) * scale;
      offsetX = (scaledVideoWidth - width) / 2;
    } else {
      // ビデオの方が縦長 → 上下がトリミングされる
      scale = width / (videoWidth || width);
      const scaledVideoHeight = (videoHeight || height) * scale;
      offsetY = (scaledVideoHeight - height) / 2;
    }

    // ミラーリング対応 + object-cover補正: x座標を反転させる
    const getX = (point: { x: number }) => {
      const x = (1 - point.x) * (videoWidth || width) * scale - offsetX;
      return x;
    };
    const getY = (point: { y: number }) => {
      const y = point.y * (videoHeight || height) * scale - offsetY;
      return y;
    };

    // グラデーション設定 - サイバー感のあるゴールド/クリーム
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.5)');   // ゴールド
    gradient.addColorStop(0.5, 'rgba(184, 168, 144, 0.4)'); // ベージュ
    gradient.addColorStop(1, 'rgba(139, 126, 116, 0.5)');  // トープ

    // === メッシュ線を描画 ===
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // すべての接続線を描画
    FULL_TESSELATION.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(getX(p1), getY(p1));
      ctx.lineTo(getX(p2), getY(p2));
      ctx.stroke();
    });

    // === 輪郭線を強調描画 ===
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.lineWidth = 1.5;

    const drawPath = (indices: number[], closed = true) => {
      ctx.beginPath();
      indices.forEach((index, i) => {
        const point = landmarks[index];
        if (!point) return;
        const x = getX(point);
        const y = getY(point);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      if (closed) ctx.closePath();
      ctx.stroke();
    };

    // 顔の輪郭
    drawPath(FACE_LANDMARKS.faceOval);

    // 目（他と同じ濃さ）
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.lineWidth = 1.5;
    drawPath(FACE_LANDMARKS.leftEye);
    drawPath(FACE_LANDMARKS.rightEye);

    // 眉
    ctx.strokeStyle = 'rgba(184, 168, 144, 0.7)';
    ctx.lineWidth = 1.5;
    drawPath(FACE_LANDMARKS.leftEyebrow, false);
    drawPath(FACE_LANDMARKS.rightEyebrow, false);

    // 唇
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 1.5;
    drawPath(FACE_LANDMARKS.lips);

    // 鼻筋
    ctx.strokeStyle = 'rgba(184, 168, 144, 0.6)';
    ctx.lineWidth = 1;
    drawPath(FACE_LANDMARKS.noseBridge, false);

    // === ランドマークポイントを描画 ===
    // 全ポイントを同じ大きさ・濃さで描画
    landmarks.forEach((point) => {
      if (!point) return;
      const x = getX(point);
      const y = getY(point);

      // すべてのポイントを同じスタイルで描画
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.fill();
    });

  }, [landmarks, width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
      />

      {/* 検出成功時のパルスエフェクト */}
      <AnimatePresence>
        {isDetected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-[#D4AF37] rounded-full"
              />
              <span className="text-sm font-medium text-[#2C2C2C]">
                顔を認識しました
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
