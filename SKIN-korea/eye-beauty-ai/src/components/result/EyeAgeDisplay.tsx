'use client';

import { motion } from 'framer-motion';
import { EyeAge } from '@/types/diagnosis';

interface EyeAgeDisplayProps {
  eyeAge: EyeAge;
  language: 'ja' | 'ko';
}

export const EyeAgeDisplay = ({ eyeAge, language }: EyeAgeDisplayProps) => {
  const isYounger = eyeAge.difference < 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="text-center py-6"
    >
      <p className="text-sm text-[#6B6B6B] mb-2">
        {language === 'ja' ? 'あなたの目元年齢は...' : '당신의 눈가 나이는...'}
      </p>

      <div className="relative inline-block">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-5xl font-light text-[#2C2C2C]"
        >
          {eyeAge.estimatedAge}
        </motion.span>
        <span className="text-2xl text-[#6B6B6B] ml-1">
          {language === 'ja' ? '歳' : '세'}
        </span>
      </div>

      {/* 年齢差メッセージ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          isYounger
            ? 'bg-[#7A8B6E]/20 text-[#5A6B4E]'
            : 'bg-[#B87A5E]/20 text-[#8A5A3E]'
        }`}
      >
        <span className="font-medium">{eyeAge.message}</span>
      </motion.div>
    </motion.div>
  );
};
