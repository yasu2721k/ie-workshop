'use client';

import { motion } from 'framer-motion';

interface ScanAnimationProps {
  imageUrl?: string;
  currentStep: string;
  isComplete: boolean;
}

export default function ScanAnimation({ imageUrl, currentStep, isComplete }: ScanAnimationProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* スキャンライン（上から下に流れる光） */}
      {!isComplete && (
        <motion.div
          className="absolute left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139, 126, 116, 0.6), transparent)',
            boxShadow: '0 0 20px rgba(139, 126, 116, 0.3)',
          }}
          initial={{ top: 0 }}
          animate={{ top: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* 目の下エリアハイライト（クマ分析時） */}
      {currentStep === 'darkCircles' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute"
            style={{
              left: '25%',
              top: '45%',
              width: '20%',
              height: '10%',
              background: 'radial-gradient(ellipse, rgba(139, 126, 116, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            className="absolute"
            style={{
              right: '25%',
              top: '45%',
              width: '20%',
              height: '10%',
              background: 'radial-gradient(ellipse, rgba(139, 126, 116, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </>
      )}

      {/* 目尻エリアハイライト（シワ分析時） */}
      {currentStep === 'wrinkles' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute"
            style={{
              left: '15%',
              top: '38%',
              width: '15%',
              height: '15%',
              border: '2px solid rgba(139, 126, 116, 0.4)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(139, 126, 116, 0.2)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            className="absolute"
            style={{
              right: '15%',
              top: '38%',
              width: '15%',
              height: '15%',
              border: '2px solid rgba(139, 126, 116, 0.4)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(139, 126, 116, 0.2)',
            }}
          />
        </>
      )}

      {/* 目周り全体グロー（ハリ・潤い分析時） */}
      {currentStep === 'firmness' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute"
          style={{
            left: '15%',
            right: '15%',
            top: '30%',
            height: '25%',
            background: 'radial-gradient(ellipse, rgba(139, 126, 116, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* メッシュグリッドオーバーレイ */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(139, 126, 116, 0.5)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 四隅のターゲットマーカー */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#8B7E74]/40" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#8B7E74]/40" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#8B7E74]/40" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#8B7E74]/40" />
    </div>
  );
}
