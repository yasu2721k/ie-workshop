'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import BackButton from '@/components/ui/BackButton';
import { DiagnosisRadarChart } from '@/components/result/RadarChart';
import { EyeAgeDisplay } from '@/components/result/EyeAgeDisplay';
import ProductRecommend from '@/components/result/ProductRecommend';
import { ROUTES } from '@/lib/constants';

export default function ResultPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { capturedImage, diagnosisResult, reset } = useDiagnosis();

  // Redirect if no diagnosis result
  useEffect(() => {
    if (!diagnosisResult) {
      router.push(ROUTES.HOME);
    }
  }, [diagnosisResult, router]);

  const handleRetry = () => {
    reset();
    router.push(ROUTES.CAMERA);
  };

  const handleShare = async () => {
    if (navigator.share && diagnosisResult) {
      try {
        await navigator.share({
          title: 'Eye Beauty AI Diagnosis',
          text: language === 'ja'
            ? `私の目元年齢は${diagnosisResult.eyeAge.estimatedAge}歳でした！あなたも診断してみて`
            : `내 눈가 나이는 ${diagnosisResult.eyeAge.estimatedAge}세였어요! 당신도 진단해보세요`,
          url: window.location.origin,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  if (!diagnosisResult) {
    return null;
  }

  const { scores, eyeAge, overallScore, primaryConcern, recommendation } = diagnosisResult;

  return (
    <div className="min-h-screen bg-[#F5F3EF] relative">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#E8E4DC]">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <BackButton href={ROUTES.HOME} />
          <h1 className="flex-1 text-center font-medium text-lg text-[#2C2C2C] tracking-wide">
            {t('result.title')}
          </h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* 撮影画像 + マーカー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-[#E8E4DC] mb-6"
        >
          {capturedImage && (
            <img
              src={capturedImage}
              alt="診断画像"
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>

        {/* 目元年齢 */}
        <EyeAgeDisplay eyeAge={eyeAge} language={language} />

        {/* 総合スコア */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-[#6B6B6B] mb-1">{t('result.overallScore')}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-light text-[#2C2C2C]">
              {overallScore}
            </span>
            <span className="text-lg text-[#6B6B6B]">/ 100</span>
          </div>
        </motion.div>

        {/* レーダーチャート */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC] mb-6"
        >
          <h2 className="text-center font-medium text-[#2C2C2C] mb-2">
            {t('result.detailAnalysis')}
          </h2>
          <DiagnosisRadarChart scores={scores} language={language} />
        </motion.div>

        {/* 改善ポイント */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#E8E4DC] rounded-xl p-4 mb-6"
        >
          <h3 className="font-medium text-[#2C2C2C] mb-2">
            {t('result.primaryConcern')}
          </h3>
          <p className="text-[#6B6B6B] font-light">
            {recommendation}
          </p>
        </motion.div>

        {/* おすすめ商品 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ProductRecommend
            primaryConcern={primaryConcern}
            language={language}
          />
        </motion.div>
      </main>

      {/* フッター：再診断ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#E8E4DC]">
        <button
          onClick={handleRetry}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#2C2C2C] text-white font-medium shadow-lg hover:bg-[#3D3D3D] transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          {t('result.retry')}
        </button>
      </div>
    </div>
  );
}
