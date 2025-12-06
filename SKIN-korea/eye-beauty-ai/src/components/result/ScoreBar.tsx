'use client';

import { motion } from 'framer-motion';

interface ScoreBarProps {
  score: number; // 1-5
  label: string;
  color: string;
  delay?: number;
}

export default function ScoreBar({
  score,
  label,
  color,
  delay = 0,
}: ScoreBarProps) {
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[#333]">{label}</span>
        <span className="text-[#666] font-medium">{score}/5</span>
      </div>
      <div className="h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
