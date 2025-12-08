'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { FacePositionStatus } from '@/lib/facePositionChecker';
import { useLanguage } from '@/contexts/LanguageContext';

interface FaceGuideProps {
  isActive: boolean;
  faceStatus?: FacePositionStatus | null;
  isDetected?: boolean;
  countdown?: number | null;
}

export default function FaceGuide({ isActive, faceStatus, isDetected, countdown }: FaceGuideProps) {
  const { language } = useLanguage();
  // 全ての条件がOKか
  const isAllOK = faceStatus &&
    faceStatus.isPositionOK &&
    faceStatus.isSizeOK &&
    faceStatus.isFrontFacing;

  // ガイドの色を決定
  const getGuideColor = () => {
    if (!isDetected) return 'rgba(255, 255, 255, 0.5)';
    if (isAllOK) return '#4ADE80'; // 緑
    return '#FFFFFF'; // 白
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Darkened area outside oval */}
      <div className="absolute inset-0">
        <svg className="w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
          <defs>
            <mask id="faceOvalMask">
              <rect width="100" height="133" fill="white" />
              <ellipse cx="50" cy="58" rx="38" ry="48" fill="black" />
            </mask>
          </defs>
          <rect
            width="100"
            height="133"
            fill="rgba(0,0,0,0.6)"
            mask="url(#faceOvalMask)"
          />
        </svg>
      </div>

      {/* Oval Guide */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-8%' }}>
        <motion.div
          animate={isActive && !isAllOK ? {
            opacity: [0.7, 1, 0.7],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
          style={{ width: '76%', aspectRatio: '0.79' }}
        >
          {/* Main oval guide */}
          <svg className="w-full h-full" viewBox="0 0 100 126">
            <ellipse
              cx="50"
              cy="63"
              rx="48"
              ry="60"
              fill="none"
              stroke={getGuideColor()}
              strokeWidth="2.5"
              strokeDasharray={isAllOK ? 'none' : '8,4'}
            />
          </svg>
        </motion.div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-4 left-0 right-0 px-3">
        <div className="flex justify-center gap-2">
          {/* ポジション（一番左） */}
          <StatusBadge
            label={language === 'ja' ? 'ポジション' : '위치'}
            isOK={faceStatus?.isPositionOK && faceStatus?.isSizeOK}
          />

          {/* 向き */}
          <StatusBadge
            label={language === 'ja' ? '向き' : '방향'}
            isOK={faceStatus?.isFrontFacing ?? false}
          />

          {/* 明るさ - 常にOK表示（簡易版） */}
          <StatusBadge
            label={language === 'ja' ? '明るさ' : '밝기'}
            isOK={true}
          />
        </div>
      </div>

      {/* Countdown Display */}
      {countdown !== null && countdown !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-8%' }}>
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="text-8xl font-bold text-white drop-shadow-lg"
          >
            {countdown}
          </motion.div>
        </div>
      )}

      {/* Guide Message */}
      {!countdown && faceStatus?.messageKey && faceStatus.messageKey !== 'ok' && (
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white text-base font-medium"
          >
            {faceStatus.messageKey === 'closer' && (language === 'ja' ? '顔を近づけてください' : '얼굴을 가까이 해주세요')}
            {faceStatus.messageKey === 'farther' && (language === 'ja' ? '少し離れてください' : '조금 떨어져 주세요')}
            {faceStatus.messageKey === 'center' && (language === 'ja' ? '顔を中心に合わせてください' : '얼굴을 중앙에 맞춰주세요')}
            {faceStatus.messageKey === 'turn' && (language === 'ja' ? '正面を向いてください' : '정면을 바라봐 주세요')}
          </motion.p>
        </div>
      )}

      {/* 顔未検出時のメッセージ */}
      {!countdown && !isDetected && (
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <p className="text-center text-white text-base font-medium">
            {language === 'ja' ? '顔を中心に合わせてください' : '얼굴을 중앙에 맞춰주세요'}
          </p>
        </div>
      )}
    </div>
  );
}

// ステータスバッジコンポーネント（○×表示）
interface StatusBadgeProps {
  label: string;
  isOK?: boolean;
}

function StatusBadge({ label, isOK }: StatusBadgeProps) {
  return (
    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
      isOK ? 'bg-white' : 'bg-[#1A1A1A] border border-white/50'
    }`}>
      <span className={`text-xs font-medium ${isOK ? 'text-[#1A1A1A]' : 'text-white'}`}>
        {label}
      </span>
      {isOK ? (
        <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
      ) : (
        <X className="w-4 h-4 text-red-400" strokeWidth={3} />
      )}
    </div>
  );
}
