'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ScanAnimation from '@/components/analyzing/ScanAnimation';
import Modal from '@/components/ui/Modal';
import { ROUTES } from '@/lib/constants';
import { DiagnosisResult, DiagnosisScores } from '@/types/diagnosis';
import { analyzeSkinTone } from '@/lib/skinToneAnalyzer';

const STEPS = [
  { id: 'init', textKey: 'analyzing.step.init', duration: 2000 },
  { id: 'darkCircles', textKey: 'analyzing.step.darkCircles', duration: 2000 },
  { id: 'wrinkles', textKey: 'analyzing.step.wrinkles', duration: 2000 },
  { id: 'firmness', textKey: 'analyzing.step.firmness', duration: 2000 },
  { id: 'age', textKey: 'analyzing.step.age', duration: 1500 },
  { id: 'complete', textKey: 'analyzing.step.complete', duration: 500 },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const {
    capturedImage,
    imageDimensions,
    forceType,
    setDiagnosisResult,
    setAnalysisData,
  } = useDiagnosis();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // ステップ進行
  useEffect(() => {
    if (currentStep >= STEPS.length) return;

    const step = STEPS[currentStep];
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setProgress(((currentStep + 1) / STEPS.length) * 100);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // API呼び出し
  useEffect(() => {
    if (!capturedImage) {
      router.push(ROUTES.CAMERA);
      return;
    }

    const analyze = async () => {
      // If force type is set (debug mode), skip actual analysis
      if (forceType) {
        const mockScores: DiagnosisScores = {
          darkCircles: forceType === 'dark_circles' ? 2 : 4,
          wrinkles: forceType === 'wrinkles' ? 2 : 4,
          firmness: 3,
          dullness: 3,
          moisture: 3,
        };

        const mockResult: DiagnosisResult = {
          scores: mockScores,
          eyeAge: {
            estimatedAge: forceType === 'dark_circles' ? 35 : 38,
            difference: forceType === 'dark_circles' ? 5 : 8,
            message: 'デバッグモードの結果です',
          },
          overallScore: 60,
          primaryConcern: forceType === 'dark_circles' ? 'darkCircles' : 'wrinkles',
          recommendation: forceType === 'dark_circles' ? 'クマケアがおすすめ' : 'シワケアがおすすめ',
          analysis: 'デバッグモードで実行中',
        };

        setDiagnosisResult(mockResult);
        setAnalysisData({
          brightness: forceType === 'dark_circles' ? 95 : 130,
          contrast: forceType === 'wrinkles' ? 45 : 25,
          landmarks: null,
        });
        setAnalysisComplete(true);
        return;
      }

      try {
        setShowError(false);
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: capturedImage,
            imageWidth: imageDimensions?.width || 640,
            imageHeight: imageDimensions?.height || 480,
            language: language,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error === 'NO_FACE_DETECTED') {
            setErrorMessage(t('camera.error.noFace'));
          } else if (errorData.error === 'API key not configured') {
            setErrorMessage(t('analyzing.apiKeyError'));
          } else {
            setErrorMessage(errorData.details || errorData.error || t('analyzing.analysisError'));
          }
          setShowError(true);
          return;
        }

        const result: DiagnosisResult = await response.json();
        console.log('Gemini analysis result:', result);

        // 肌トーン分析を実行
        const skinToneAnalysis = await analyzeSkinTone(capturedImage);
        console.log('Skin tone analysis:', skinToneAnalysis);

        // 肌トーン分析結果を追加
        const resultWithSkinTone: DiagnosisResult = {
          ...result,
          skinToneAnalysis,
        };

        setDiagnosisResult(resultWithSkinTone);
        setAnalysisData({
          eyePositions: result.eyePositions,
        });
        setAnalysisComplete(true);
      } catch (error) {
        console.error('Analysis failed:', error);
        setErrorMessage(error instanceof Error ? error.message : t('analyzing.analysisError'));
        setShowError(true);
      }
    };

    analyze();
  }, [capturedImage, forceType, imageDimensions, setDiagnosisResult, setAnalysisData, router, t, retryCount, language]);

  // 完了後の遷移
  useEffect(() => {
    if (currentStep === STEPS.length && analysisComplete) {
      setIsComplete(true);
      setTimeout(() => router.push(ROUTES.GATE), 800);
    }
  }, [currentStep, analysisComplete, router]);

  const handleRetry = useCallback(() => {
    setShowError(false);
    router.push(ROUTES.CAMERA);
  }, [router]);

  if (!capturedImage) {
    return null;
  }

  const currentStepText = currentStep < STEPS.length
    ? t(STEPS[currentStep].textKey)
    : t('analyzing.step.complete');

  return (
    <div className="min-h-screen bg-[#F5F3EF] relative overflow-hidden">
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 撮影画像 + スキャンアニメーション */}
        <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border border-[#E8E4DC]">
          <img
            src={capturedImage}
            alt="分析中"
            className="w-full h-full object-cover"
          />

          {/* スキャンオーバーレイ */}
          <ScanAnimation
            currentStep={STEPS[currentStep]?.id || 'init'}
            isComplete={isComplete}
          />
        </div>

        {/* 進捗表示 */}
        <div className="mt-8 max-w-sm mx-auto">
          {/* プログレスバー */}
          <div className="h-1 bg-[#E8E4DC] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#2C2C2C]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* ステップテキスト */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-4 text-lg font-light text-[#6B6B6B] tracking-wide"
            >
              {currentStepText}
            </motion.p>
          </AnimatePresence>

          {/* パーセンテージ */}
          <p className="text-center mt-2 text-4xl font-light text-[#2C2C2C]">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* 完了時のシンプルなエフェクト */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="relative">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5],
                    opacity: [1, 0],
                    x: Math.cos((i * 45 * Math.PI) / 180) * 80,
                    y: Math.sin((i * 45 * Math.PI) / 180) * 80,
                  }}
                  transition={{ duration: 0.6, delay: i * 0.02 }}
                  className="absolute w-3 h-3 rounded-full bg-[#8B7E74]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <Modal
        isOpen={showError}
        onClose={handleRetry}
        title={t('analyzing.errorTitle')}
      >
        <div className="text-center">
          <p className="text-[#6B6B6B] mb-6">
            {errorMessage || t('camera.error.noFace')}
          </p>
          {retryCount < 3 ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  setShowError(false);
                  setCurrentStep(0);
                  setProgress(0);
                }}
                className="w-full py-3 bg-[#2C2C2C] text-white rounded-xl font-medium hover:bg-[#3D3D3D] transition-colors"
              >
                {t('analyzing.retryButton')} ({retryCount + 1}/3)
              </button>
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-[#E8E4DC] text-[#2C2C2C] rounded-xl font-medium hover:bg-[#D4CFC4] transition-colors"
              >
                {t('common.retake')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-[#2C2C2C] text-white rounded-xl font-medium hover:bg-[#3D3D3D] transition-colors"
            >
              {t('common.retake')}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
