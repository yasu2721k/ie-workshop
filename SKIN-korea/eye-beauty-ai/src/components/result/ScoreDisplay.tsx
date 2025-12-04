'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScoreDisplayProps {
  score: number;
  type: 'dark_circles' | 'wrinkles';
}

export default function ScoreDisplay({ score, type }: ScoreDisplayProps) {
  const { t } = useLanguage();

  const stars = Math.round(score / 20);
  const typeName = type === 'dark_circles'
    ? t('result.darkCircles.name')
    : t('result.wrinkles.name');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      {/* Score Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <span className="text-gray-700 font-medium">{t('result.score')}</span>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className={`text-2xl ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </motion.span>
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="ml-2 text-2xl font-bold gradient-text"
        >
          {score}{t('result.points')}
        </motion.span>
      </div>

      {/* Type */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <span className="text-gray-500">{t('result.type')}:</span>
        <span className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${type === 'dark_circles'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-pink-100 text-pink-700'
          }
        `}>
          {typeName}
        </span>
      </div>
    </motion.div>
  );
}
