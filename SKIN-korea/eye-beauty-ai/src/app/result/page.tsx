'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import ProductRecommend from '@/components/result/ProductRecommend';
import SkinToneCard from '@/components/result/SkinToneCard';
import FaceAnalysisOverlay from '@/components/result/FaceAnalysisOverlay';
import { ROUTES } from '@/lib/constants';
import { DiagnosisScores } from '@/types/diagnosis';

type ScoreKey = keyof DiagnosisScores;

const SCORE_CONFIG: {
  key: ScoreKey;
  labelJa: string;
  labelKo: string;
  color: string;
}[] = [
  { key: 'darkCircles', labelJa: 'クマ', labelKo: '다크서클', color: '#7C9EB2' },
  { key: 'wrinkles', labelJa: 'シワ', labelKo: '주름', color: '#D4A574' },
  { key: 'firmness', labelJa: 'ハリ', labelKo: '탄력', color: '#8FB89A' },
  { key: 'dullness', labelJa: 'くすみ', labelKo: '칙칙함', color: '#A8A0B5' },
  { key: 'moisture', labelJa: '潤い', labelKo: '수분', color: '#7DBAD6' },
];

export default function ResultPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { capturedImage, diagnosisResult, reset } = useDiagnosis();

  useEffect(() => {
    if (!diagnosisResult) {
      router.push(ROUTES.HOME);
    }
  }, [diagnosisResult, router]);

  const handleRetry = () => {
    reset();
    router.push(ROUTES.CAMERA);
  };

  if (!diagnosisResult) {
    return null;
  }

  const { scores, eyeAge, overallScore, primaryConcern, recommendation, observation, detailedAnalysis, analysis, skinToneAnalysis } = diagnosisResult;

  // 総合評価のテキスト
  const getOverallRating = () => {
    if (overallScore >= 80) return language === 'ja' ? '素晴らしい' : '훌륭함';
    if (overallScore >= 60) return language === 'ja' ? '良好' : '양호';
    if (overallScore >= 40) return language === 'ja' ? '普通' : '보통';
    return language === 'ja' ? '要改善' : '개선필요';
  };

  // primaryConcernの日本語/韓国語ラベル
  const getPrimaryConcernLabel = () => {
    const config = SCORE_CONFIG.find(c => c.key === primaryConcern);
    return config ? (language === 'ja' ? config.labelJa : config.labelKo) : '';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E8] px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-lg font-medium text-[#1A1A1A] tracking-wide">
            {language === 'ja' ? '診断結果' : '진단 결과'}
          </h1>
          <button
            onClick={handleRetry}
            className="text-sm text-[#666] flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'ja' ? '再診断' : '다시 진단'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3 pb-6 space-y-5">
        {/* Photo & Eye Age Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex">
            {/* Captured Image */}
            {capturedImage && (
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={capturedImage}
                  alt="診断画像"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Eye Age Display */}
            <div className="flex-1 p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-[#666] mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">
                  {language === 'ja' ? '目元年齢' : '눈가 나이'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-[#1A1A1A]">
                  {eyeAge.estimatedAge}
                </span>
                <span className="text-lg text-[#666]">
                  {language === 'ja' ? '歳' : '세'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#1A1A1A]">
              {language === 'ja' ? '総合スコア' : '종합 점수'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-[#1A1A1A]">{overallScore}</span>
              <span className="text-sm text-[#666]">/100</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #D4A574, #8FB89A, #7DBAD6)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-medium text-[#1A1A1A] min-w-fit">
              {getOverallRating()}
            </span>
          </div>
        </motion.div>

        {/* Score Details Card - Compact Horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-5"
        >
          <h2 className="text-sm font-medium text-[#1A1A1A] mb-4">
            {language === 'ja' ? '項目別スコア' : '항목별 점수'}
          </h2>

          <div className="flex justify-between items-center">
            {SCORE_CONFIG.map((config, index) => (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: config.color }}
                >
                  {scores[config.key]}
                </div>
                <span className="text-xs text-[#666] mt-1.5">
                  {language === 'ja' ? config.labelJa : config.labelKo}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Skin Tone Analysis */}
        {skinToneAnalysis && (
          <SkinToneCard
            analysis={skinToneAnalysis}
            language={language as 'ja' | 'ko'}
          />
        )}

        {/* Face Analysis Overlay */}
        {capturedImage && (
          <FaceAnalysisOverlay
            capturedImage={capturedImage}
            scores={scores}
            language={language as 'ja' | 'ko'}
          />
        )}

        {/* Detailed Analysis - Always Open */}
        {(observation || detailedAnalysis || analysis) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {/* AI Analysis Summary */}
            {analysis && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h4 className="text-xs uppercase tracking-wider text-[#999] mb-2">
                  {language === 'ja' ? 'AI分析' : 'AI 분석'}
                </h4>
                <p className="text-sm text-[#333] leading-relaxed">{analysis}</p>
              </div>
            )}

            {/* Dark Circle Type */}
            {observation && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h4 className="text-xs uppercase tracking-wider text-[#999] mb-2">
                  {language === 'ja' ? 'クマの種類' : '다크서클 유형'}
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-[#333]">
                    <span className="text-[#666]">{language === 'ja' ? '種類: ' : '유형: '}</span>
                    {observation.darkCircleTypeJa}
                  </p>
                  <p className="text-sm text-[#333]">
                    <span className="text-[#666]">{language === 'ja' ? '原因: ' : '원인: '}</span>
                    {observation.mainCause}
                  </p>
                  {observation.subCause && (
                    <p className="text-sm text-[#333]">
                      <span className="text-[#666]">{language === 'ja' ? '副次的要因: ' : '부차적 요인: '}</span>
                      {observation.subCause}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Observations */}
            {detailedAnalysis && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h4 className="text-xs uppercase tracking-wider text-[#999] mb-2">
                  {language === 'ja' ? '詳細観察' : '상세 관찰'}
                </h4>
                <div className="space-y-2 text-sm text-[#333]">
                  {detailedAnalysis.darkCircles && (
                    <p><span className="text-[#7C9EB2]">●</span> {detailedAnalysis.darkCircles}</p>
                  )}
                  {detailedAnalysis.wrinkles && (
                    <p><span className="text-[#D4A574]">●</span> {detailedAnalysis.wrinkles}</p>
                  )}
                  {detailedAnalysis.firmness && (
                    <p><span className="text-[#8FB89A]">●</span> {detailedAnalysis.firmness}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Primary Concern & Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-1">
                {language === 'ja' ? '改善ポイント' : '개선 포인트'}
              </h3>
              <p className="text-sm text-[#D4A574] font-medium">
                {getPrimaryConcernLabel()}
              </p>
            </div>
          </div>
          <p className="text-sm text-[#666] leading-relaxed">
            {recommendation}
          </p>
        </motion.div>

        
        {/* Product Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ProductRecommend primaryConcern={primaryConcern} language={language} />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4 pb-8"
        >
          <button
            onClick={handleRetry}
            className="w-full py-4 rounded-full bg-[#1A1A1A] text-white font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {language === 'ja' ? 'もう一度診断する' : '다시 진단하기'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
