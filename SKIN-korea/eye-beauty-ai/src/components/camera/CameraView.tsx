'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCamera, CaptureResult } from '@/hooks/useCamera';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import FaceGuide from './FaceGuide';
import { getEyePositions } from '@/lib/eyeAnalyzer';
import { EyePositions } from '@/types/diagnosis';
import { checkFacePosition, FacePositionStatus } from '@/lib/facePositionChecker';

interface CameraViewProps {
  onCapture: (result: CaptureResult & { eyePositions?: EyePositions }) => void;
  onError: (error: string | null) => void;
}

export default function CameraView({ onCapture, onError }: CameraViewProps) {
  const { t } = useLanguage();
  const { videoRef, canvasRef, isReady, error, startCamera, captureImage } = useCamera();
  const { landmarks, isDetected, processFrame, isLoading: isFaceMeshLoading } = useFaceMesh(videoRef);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [videoAspect, setVideoAspect] = useState({ videoWidth: 0, videoHeight: 0 });
  const [currentEyePositions, setCurrentEyePositions] = useState<EyePositions | null>(null);
  const [faceStatus, setFaceStatus] = useState<FacePositionStatus | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [autoShutterCountdown, setAutoShutterCountdown] = useState<number | null>(null);
  const [isWarmupComplete, setIsWarmupComplete] = useState(false);
  const autoShutterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conditionMetDelayRef = useRef<NodeJS.Timeout | null>(null);
  const [isConditionDelayComplete, setIsConditionDelayComplete] = useState(false);

  // カメラ開始
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // エラーハンドリング - カメラの状態に応じてエラーを通知/クリア
  useEffect(() => {
    if (isReady) {
      // カメラが成功したらエラーをクリア
      onError(null);
      // カメラ準備完了後、2秒待ってからウォームアップ完了とする
      const warmupTimer = setTimeout(() => {
        setIsWarmupComplete(true);
      }, 2000);
      return () => clearTimeout(warmupTimer);
    } else if (error) {
      const errorKey = error === 'denied' ? 'camera.error.denied' :
                       error === 'unsupported' ? 'camera.error.unsupported' :
                       'camera.error.denied';
      onError(t(errorKey));
    }
  }, [error, isReady, onError, t]);

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

  // ビデオ表示サイズ取得
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDimensions = () => {
      if (video && video.parentElement) {
        // 親コンテナのサイズを使用（object-coverに対応）
        const container = video.parentElement;
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
        // ビデオの元の解像度も保存
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoAspect({
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          });
        }
      }
    };

    video.addEventListener('loadedmetadata', updateDimensions);
    video.addEventListener('playing', updateDimensions);
    // リサイズ時も更新
    window.addEventListener('resize', updateDimensions);
    // 初期値も設定
    updateDimensions();
    // 少し遅延して再度更新（レイアウト完了後）
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      video.removeEventListener('playing', updateDimensions);
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, [videoRef, isReady]);

  // 目の位置と顔のステータスを更新
  useEffect(() => {
    if (landmarks && isDetected && dimensions.width > 0) {
      const positions = getEyePositions(landmarks);
      setCurrentEyePositions(positions);

      // 顔の位置・サイズをチェック
      const status = checkFacePosition(landmarks, dimensions.width, dimensions.height);
      setFaceStatus(status);
    } else {
      setFaceStatus(null);
    }
  }, [landmarks, isDetected, dimensions]);

  const handleCapture = useCallback(() => {
    if (isCapturing) return;

    setIsCapturing(true);

    // タイマーをクリア
    setAutoShutterCountdown(null);
    if (autoShutterTimerRef.current) {
      clearInterval(autoShutterTimerRef.current);
      autoShutterTimerRef.current = null;
    }

    // 即座に撮影
    const result = captureImage();

    if (result) {
      // 撮影画像をプレビューとして表示（画面をフリーズ）
      setCapturedPreview(result.imageData);

      // 少し待ってから遷移（フラッシュエフェクト用）
      setTimeout(() => {
        onCapture({
          ...result,
          eyePositions: currentEyePositions || undefined,
        });
      }, 300);
    } else {
      setIsCapturing(false);
    }
  }, [captureImage, onCapture, currentEyePositions, isCapturing]);

  // 自動シャッター条件チェック
  const isAllConditionsMet = !!(faceStatus &&
    faceStatus.isPositionOK &&
    faceStatus.isSizeOK &&
    faceStatus.isFrontFacing &&
    isDetected &&
    !isCapturing);


  // 自動シャッターのカウントダウン処理用ref
  const countdownRef = useRef<number>(0);
  const handleCaptureRef = useRef(handleCapture);
  handleCaptureRef.current = handleCapture;

  // 条件が整ってから2秒待つ処理
  // isAllConditionsMetの前回値を追跡
  const prevConditionsMetRef = useRef(false);

  useEffect(() => {
    // 条件が新たに満たされた瞬間を検出（false → true への変化）
    const justBecameMet = isAllConditionsMet && !prevConditionsMetRef.current;
    prevConditionsMetRef.current = isAllConditionsMet;

    // 条件が新たに満たされた場合、2秒待ってからカウントダウン開始可能にする
    if (justBecameMet && isWarmupComplete && conditionMetDelayRef.current === null) {
      setIsConditionDelayComplete(false); // リセット
      conditionMetDelayRef.current = setTimeout(() => {
        setIsConditionDelayComplete(true);
        conditionMetDelayRef.current = null;
      }, 2000);
    }

    // 条件が満たされなくなった場合、遅延タイマーをリセット
    if (!isAllConditionsMet) {
      if (conditionMetDelayRef.current) {
        clearTimeout(conditionMetDelayRef.current);
        conditionMetDelayRef.current = null;
      }
      setIsConditionDelayComplete(false);
    }
  }, [isAllConditionsMet, isWarmupComplete]);

  // 自動シャッター開始・停止の制御
  useEffect(() => {
    // 条件が満たされ、2秒の遅延が完了した場合、カウントダウン開始
    if (isAllConditionsMet && isWarmupComplete && isConditionDelayComplete && autoShutterTimerRef.current === null) {
      // カウントダウン開始
      countdownRef.current = 3;
      setAutoShutterCountdown(3);

      autoShutterTimerRef.current = setInterval(() => {
        countdownRef.current -= 1;

        if (countdownRef.current > 0) {
          setAutoShutterCountdown(countdownRef.current);
        } else {
          // カウント0で撮影
          if (autoShutterTimerRef.current) {
            clearInterval(autoShutterTimerRef.current);
            autoShutterTimerRef.current = null;
          }
          setAutoShutterCountdown(null);
          handleCaptureRef.current();
        }
      }, 1000);
    }

    // 条件が満たされなくなった場合のみリセット（カウントダウン中に条件が外れた場合）
    if (!isAllConditionsMet && autoShutterTimerRef.current !== null) {
      clearInterval(autoShutterTimerRef.current);
      autoShutterTimerRef.current = null;
      countdownRef.current = 0;
      setAutoShutterCountdown(null);
    }
  }, [isAllConditionsMet, isWarmupComplete, isConditionDelayComplete]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (autoShutterTimerRef.current) {
        clearInterval(autoShutterTimerRef.current);
        autoShutterTimerRef.current = null;
      }
      if (conditionMetDelayRef.current) {
        clearTimeout(conditionMetDelayRef.current);
        conditionMetDelayRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera Preview Container */}
      <div className="relative aspect-[3/4] bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Video Element - 撮影後は非表示 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${capturedPreview ? 'hidden' : ''}`}
        />

        {/* 撮影後のプレビュー画像（フリーズ効果） */}
        {capturedPreview && (
          <img
            src={capturedPreview}
            alt="撮影画像"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* フラッシュエフェクト */}
        {capturedPreview && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white"
          />
        )}

        {/* Hidden Canvas for Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Mesh Overlay - 撮影後は非表示 */}
        {!capturedPreview && landmarks && dimensions.width > 0 && (
          <FaceMeshOverlay
            landmarks={landmarks}
            width={dimensions.width}
            height={dimensions.height}
            videoWidth={videoAspect.videoWidth}
            videoHeight={videoAspect.videoHeight}
            isDetected={isDetected}
          />
        )}

        {/* Face Guide Overlay（常に表示、撮影後は非表示） */}
        {!capturedPreview && (
          <FaceGuide
            isActive={isReady}
            faceStatus={faceStatus}
            isDetected={isDetected}
            countdown={autoShutterCountdown}
          />
        )}

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

        {/* Error State - カメラが動作中でない場合のみ表示 */}
        {error && !isReady && (
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
          disabled={!isReady || !isDetected || isCapturing || !faceStatus?.isSizeOK}
          className={`
            relative w-20 h-20 rounded-full
            ${isReady && isDetected && !isCapturing && faceStatus?.isSizeOK
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
                ${isReady && isDetected && faceStatus?.isSizeOK ? 'bg-white/20' : 'bg-gray-500/20'}
              `} />

              {/* Pulse Animation when ready */}
              {isReady && isDetected && faceStatus?.isSizeOK && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#4ADE80]"
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
        {isCapturing
          ? t('common.processing')
          : faceStatus?.isSizeOK && isDetected
            ? t('camera.capture')
            : ''
        }
      </p>
    </div>
  );
}
