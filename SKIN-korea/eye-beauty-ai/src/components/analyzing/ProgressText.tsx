'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Step {
  key: string;
  progress: number;
  duration: number;
}

const STEPS: Step[] = [
  { key: 'analyzing.step1', progress: 30, duration: 1500 },
  { key: 'analyzing.step2', progress: 60, duration: 1500 },
  { key: 'analyzing.step3', progress: 90, duration: 1500 },
  { key: 'analyzing.complete', progress: 100, duration: 500 },
];

interface ProgressTextProps {
  onComplete: () => void;
}

export default function ProgressText({ onComplete }: ProgressTextProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let totalTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    STEPS.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
        setProgress(step.progress);

        if (index === STEPS.length - 1) {
          // Complete after showing final message
          setTimeout(onComplete, 500);
        }
      }, totalTime);

      timeouts.push(timeout);
      totalTime += step.duration;
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="text-center space-y-6">
      {/* Progress Text */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-center gap-3"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-2xl"
        >
          {currentStep === STEPS.length - 1 ? '✨' : '🔍'}
        </motion.span>
        <span className="text-white text-lg font-medium">
          {t(STEPS[currentStep].key)}
        </span>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-64 mx-auto">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-500"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>{progress}%</span>
          <span>解析中</span>
        </div>
      </div>

      {/* Floating particles */}
      <div className="relative h-8">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-pink-400 rounded-full"
            style={{ left: `${20 + i * 15}%` }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
