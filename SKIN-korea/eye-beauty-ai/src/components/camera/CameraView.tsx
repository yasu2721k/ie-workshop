'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCamera, CaptureResult } from '@/hooks/useCamera';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import FaceGuide from './FaceGuide';
import { getEyePositions } from '@/lib/eyeAnalyzer';
import { EyePositions } from '@/types/diagnosis';

interface CameraViewProps {
  onCapture: (result: CaptureResult & { eyePositions?: EyePositions }) => void;
  onError: (error: string) => void;
}

export default function CameraView({ onCapture, onError }: CameraViewProps) {
  const { t } = useLanguage();
  const { videoRef, canvasRef, isReady, error, startCamera, captureImage } = useCamera();
  const { landmarks, isDetected, processFrame, isLoading: isFaceMeshLoading } = useFaceMesh(videoRef);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentEyePositions, setCurrentEyePositions] = useState<EyePositions | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // カメラ開始
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // エラーハンドリング
  useEffect(() => {
    if (error) {
      const errorKey = error === 'denied' ? 'camera.error.denied' :
                       error === 'unsupported' ? 'camera.error.unsupported' :
                       'camera.error.denied';
      onError(t(errorKey));
    }
  }, [error, onError, t]);

  // フレームごとに顔検出を実行
  useEffect(() => {
    if (!isReady) return;

    let animationId: number;
    const detect = async () => {
      await processFrame();
      animationId = requestAnimationFrame(detect);
    };
    detect();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isReady, processFrame]);

  // ビデオ表示サイズ取得（CSSサイズではなく実際のピクセルサイズ）
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDimensions = () => {
      if (video) {
        const rect = video.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    video.addEventListener('loadedmetadata', updateDimensions);
    // リサイズ時も更新
    window.addEventListener('resize', updateDimensions);
    // 初期値も設定
    if (video.videoWidth > 0) {
      updateDimensions();
    }

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [videoRef]);

  // 目の位置を更新
  useEffect(() => {
    if (landmarks && isDetected) {
      const positions = getEyePositions(landmarks);
      setCurrentEyePositions(positions);
    }
  }, [landmarks, isDetected]);

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const result = captureImage();
      if (result) {
        onCapture({
          ...result,
          eyePositions: currentEyePositions || undefined,
        });
      }
    } finally {
      setIsCapturing(false);
    }
  }, [captureImage, onCapture, currentEyePositions, isCapturing]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera Preview Container */}
      <div className="relative aspect-[3/4] bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />

        {/* Hidden Canvas for Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Mesh Overlay */}
        {landmarks && dimensions.width > 0 && (
          <FaceMeshOverlay
            landmarks={landmarks}
            width={dimensions.width}
            height={dimensions.height}
            isDetected={isDetected}
          />
        )}

        {/* Face Guide Overlay（顔未検出時のみ） */}
        {!isDetected && <FaceGuide isActive={isReady} />}

        {/* Loading State */}
        {(!isReady || isFaceMeshLoading) && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]/80">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-[#8B7E74] border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-white text-sm">
                {t(`camera.error.${error}`)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCapture}
          disabled={!isReady || !isDetected || isCapturing}
          className={`
            relative w-20 h-20 rounded-full
            ${isReady && isDetected && !isCapturing
              ? 'bg-white shadow-lg'
              : 'bg-gray-600'
            }
            ${isCapturing ? 'opacity-50' : ''}
            flex items-center justify-center
            transition-all duration-200
            disabled:cursor-not-allowed
          `}
        >
          {isCapturing ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#2C2C2C]" />
          ) : (
            <>
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/30" />

              {/* Inner Circle */}
              <div className={`
                w-16 h-16 rounded-full border-4 border-[#2C2C2C]
                ${isReady && isDetected ? 'bg-white/20' : 'bg-gray-500/20'}
              `} />

              {/* Pulse Animation when ready */}
              {isReady && isDetected && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#8B7E74]"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Capture Text */}
      <p className="text-center text-white/80 mt-4 text-sm font-light tracking-wide">
        {isCapturing ? '処理中...' : (isDetected ? t('camera.capture') : t('camera.instruction'))}
      </p>
    </div>
  );
}
