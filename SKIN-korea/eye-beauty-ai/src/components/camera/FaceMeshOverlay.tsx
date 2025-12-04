'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FACE_LANDMARKS } from '@/lib/mediapipe';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FaceMeshOverlayProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
  isDetected: boolean;
}

export const FaceMeshOverlay = ({
  landmarks,
  width,
  height,
  isDetected
}: FaceMeshOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks || width === 0 || height === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // クリア
    ctx.clearRect(0, 0, width, height);

    // グラデーション設定 - ゴールドベージュ・トープ系
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(184, 168, 144, 0.7)');   // ゴールドベージュ
    gradient.addColorStop(1, 'rgba(139, 126, 116, 0.7)');  // トープ

    // 線のスタイル
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ミラーリング対応: x座標を反転させる
    const getX = (point: { x: number }) => (1 - point.x) * width;
    const getY = (point: { y: number }) => point.y * height;

    // 輪郭線を描画する関数
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

    // 各パーツを描画
    drawPath(FACE_LANDMARKS.faceOval);
    drawPath(FACE_LANDMARKS.leftEye);
    drawPath(FACE_LANDMARKS.rightEye);
    drawPath(FACE_LANDMARKS.lips);

    // 目のランドマークにポイント
    const eyePoints = [...FACE_LANDMARKS.leftEye.slice(0, 8), ...FACE_LANDMARKS.rightEye.slice(0, 8)];
    eyePoints.forEach(index => {
      const point = landmarks[index];
      if (!point) return;
      const x = getX(point);
      const y = getY(point);

      // 中心ポイント
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // 外側のグロー - トープ系
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 126, 116, 0.3)';
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
                className="w-2 h-2 bg-[#7A8B6E] rounded-full"
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
