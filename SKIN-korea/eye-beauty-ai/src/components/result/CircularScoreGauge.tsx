'use client';

import { motion } from 'framer-motion';

interface CircularScoreGaugeProps {
  score: number; // 1-5
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

export default function CircularScoreGauge({
  score,
  label,
  isActive,
  onClick,
  color,
}: CircularScoreGaugeProps) {
  // スコア1-5を0-100%に変換
  const percentage = (score / 5) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        isActive ? 'scale-110' : ''
      }`}
    >
      <div className="relative w-16 h-16">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
            strokeWidth="4"
          />
          {/* Progress circle */}
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
            {Math.round(percentage)}
          </span>
        </div>
      </div>
      {/* Label */}
      <span className={`text-xs ${isActive ? 'text-white font-medium' : 'text-white/70'}`}>
        {label}
      </span>
    </motion.button>
  );
}
