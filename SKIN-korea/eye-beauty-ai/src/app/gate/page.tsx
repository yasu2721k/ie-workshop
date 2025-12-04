'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import { ROUTES } from '@/lib/constants';

export default function GatePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { diagnosisType, score } = useDiagnosis();

  // Redirect if no diagnosis result
  useEffect(() => {
    if (!diagnosisType) {
      router.push(ROUTES.HOME);
    }
  }, [diagnosisType, router]);

  const handleLineClick = () => {
    // For demo, just navigate to result
    // In production, this would redirect to LINE
    router.push(ROUTES.RESULT);
  };

  if (!diagnosisType) {
    return null;
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#F5F3EF]">
      {/* Background - Blurred Result Preview */}
      <div className="absolute inset-0">
        {/* Fake result preview with blur */}
        <div className="absolute inset-0 flex items-center justify-center blur-lg opacity-50">
          <div className="bg-white rounded-3xl p-8 w-80 border border-[#E8E4DC]">
            <div className="space-y-4">
              <div className="h-6 bg-[#E8E4DC] rounded-full w-3/4 mx-auto" />
              <div className="h-32 bg-gradient-to-br from-[#E8E4DC] to-[#D4CFC4] rounded-2xl" />
              <div className="h-4 bg-[#E8E4DC] rounded-full w-1/2 mx-auto" />
              <div className="h-4 bg-[#E8E4DC] rounded-full w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#8B7E74]"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${25 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Gate Popup */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full border border-[#E8E4DC]"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#E8E4DC] flex items-center justify-center"
          >
            <motion.span
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-4xl"
            >
              <svg className="w-10 h-10 text-[#8B7E74]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-light text-center text-[#2C2C2C] mb-4 tracking-wide"
          >
            {t('gate.title')}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#6B6B6B] text-center mb-8 leading-relaxed font-light"
          >
            {t('gate.description')}
          </motion.p>

          {/* LINE Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLineClick}
            className="w-full py-4 bg-[#06C755] hover:bg-[#05b34d] text-white rounded-xl font-medium text-lg flex items-center justify-center gap-3 shadow-lg transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            {t('gate.cta')}
          </motion.button>

          {/* Skip link (for demo) */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={handleLineClick}
            className="w-full mt-4 py-2 text-[#9B9B9B] text-sm hover:text-[#6B6B6B] transition-colors"
          >
            スキップして結果を見る（デモ用）
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
