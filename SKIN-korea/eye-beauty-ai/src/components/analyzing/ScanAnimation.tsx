'use client';

import { motion } from 'framer-motion';

interface ScanAnimationProps {
  imageUrl?: string;
  currentStep: string;
  isComplete: boolean;
}

export default function ScanAnimation({ imageUrl, currentStep, isComplete }: ScanAnimationProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 複数のスキャンライン */}
      {!isComplete && (
        <>
          {/* メインスキャンライン */}
          <motion.div
            className="absolute left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.8), transparent)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
            }}
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* サブスキャンライン */}
          <motion.div
            className="absolute left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(184, 168, 144, 0.6), transparent)',
              boxShadow: '0 0 20px rgba(184, 168, 144, 0.3)',
            }}
            initial={{ top: '100%' }}
            animate={{ top: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* AIデータポイント風アニメーション */}
      {!isComplete && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#D4AF37]"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 目の下エリアハイライト（クマ分析時） */}
      {currentStep === 'darkCircles' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute"
            style={{
              left: '22%',
              top: '42%',
              width: '22%',
              height: '12%',
              background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            className="absolute"
            style={{
              right: '22%',
              top: '42%',
              width: '22%',
              height: '12%',
              background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          {/* スキャンリング */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute left-1/2 top-[45%] -translate-x-1/2"
            style={{
              width: '60%',
              height: '15%',
              border: '2px solid rgba(212, 175, 55, 0.5)',
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
              opacity: [0.4, 0.7, 0.4],
              scale: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute"
            style={{
              left: '12%',
              top: '35%',
              width: '18%',
              height: '18%',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            className="absolute"
            style={{
              right: '12%',
              top: '35%',
              width: '18%',
              height: '18%',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          />
          {/* 分析線 */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-[#D4AF37]/40"
              style={{
                left: '15%',
                right: '15%',
                top: `${32 + i * 3}%`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </>
      )}

      {/* 目周り全体グロー（ハリ分析時） */}
      {currentStep === 'firmness' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute"
            style={{
              left: '10%',
              right: '10%',
              top: '28%',
              height: '30%',
              background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          {/* パルスリング */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[42%] -translate-x-1/2"
              style={{
                width: '50%',
                height: '20%',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '50%',
              }}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
              }}
            />
          ))}
        </>
      )}

      {/* 年齢算出時のエフェクト */}
      {currentStep === 'age' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-32 h-32 rounded-full border-4 border-[#D4AF37]/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-[#D4AF37]/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-[#D4AF37]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* メッシュグリッドオーバーレイ */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(212, 175, 55, 0.5)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 四隅のターゲットマーカー（アニメーション付き） */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-[#D4AF37]/60"
      />
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-[#D4AF37]/60"
      />
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-[#D4AF37]/60"
      />
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-[#D4AF37]/60"
      />

      {/* データストリームエフェクト（サイド） */}
      {!isComplete && (
        <>
          <div className="absolute left-2 top-1/4 bottom-1/4 w-1 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="w-full h-2 bg-[#D4AF37]/30 mb-2"
                initial={{ y: -20 }}
                animate={{ y: 200 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
          <div className="absolute right-2 top-1/4 bottom-1/4 w-1 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="w-full h-2 bg-[#D4AF37]/30 mb-2"
                initial={{ y: 200 }}
                animate={{ y: -20 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
