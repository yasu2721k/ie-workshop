'use client';

import { motion } from 'framer-motion';
import { useDiagnosis } from '@/contexts/DiagnosisContext';

interface DebugButtonsProps {
  onDebugCapture: (type: 'dark_circles' | 'wrinkles') => void;
}

export default function DebugButtons({ onDebugCapture }: DebugButtonsProps) {
  const { setForceType } = useDiagnosis();

  const handleDebugA = () => {
    setForceType('dark_circles');
    onDebugCapture('dark_circles');
  };

  const handleDebugB = () => {
    setForceType('wrinkles');
    onDebugCapture('wrinkles');
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleDebugA}
        className="w-10 h-10 rounded-full bg-purple-500/30 backdrop-blur-sm
                   border border-purple-400/50 text-white text-xs font-bold
                   flex items-center justify-center"
        title="Debug: クマタイプ"
      >
        A
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleDebugB}
        className="w-10 h-10 rounded-full bg-pink-500/30 backdrop-blur-sm
                   border border-pink-400/50 text-white text-xs font-bold
                   flex items-center justify-center"
        title="Debug: シワタイプ"
      >
        B
      </motion.button>
    </div>
  );
}
