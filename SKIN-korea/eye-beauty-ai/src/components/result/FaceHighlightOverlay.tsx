'use client';

import { motion, AnimatePresence } from 'framer-motion';

type HighlightArea = 'darkCircles' | 'wrinkles' | 'firmness' | 'dullness' | 'moisture' | null;

interface FaceHighlightOverlayProps {
  activeArea: HighlightArea;
}

export default function FaceHighlightOverlay({ activeArea }: FaceHighlightOverlayProps) {
  if (!activeArea) return null;

  const getOverlayContent = () => {
    switch (activeArea) {
      case 'darkCircles':
        return (
          <>
            {/* 目の下のクマエリア - 左目 */}
            <motion.ellipse
              cx="32%"
              cy="52%"
              rx="12%"
              ry="5%"
              fill="rgba(100, 150, 255, 0.4)"
              stroke="rgba(100, 150, 255, 0.8)"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.4, 0.7, 0.4], scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* 目の下のクマエリア - 右目 */}
            <motion.ellipse
              cx="68%"
              cy="52%"
              rx="12%"
              ry="5%"
              fill="rgba(100, 150, 255, 0.4)"
              stroke="rgba(100, 150, 255, 0.8)"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.4, 0.7, 0.4], scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        );
      case 'wrinkles':
        return (
          <>
            {/* 目尻のシワエリア - 左 */}
            <motion.path
              d="M 15% 45% Q 20% 43%, 22% 48%"
              fill="none"
              stroke="rgba(255, 180, 100, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
            <motion.path
              d="M 14% 48% Q 19% 46%, 21% 51%"
              fill="none"
              stroke="rgba(255, 180, 100, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            {/* 目尻のシワエリア - 右 */}
            <motion.path
              d="M 85% 45% Q 80% 43%, 78% 48%"
              fill="none"
              stroke="rgba(255, 180, 100, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
            <motion.path
              d="M 86% 48% Q 81% 46%, 79% 51%"
              fill="none"
              stroke="rgba(255, 180, 100, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </>
        );
      case 'firmness':
        return (
          <>
            {/* 目の下のたるみエリア */}
            <motion.path
              d="M 22% 55% Q 32% 60%, 42% 55%"
              fill="none"
              stroke="rgba(150, 255, 150, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M 58% 55% Q 68% 60%, 78% 55%"
              fill="none"
              stroke="rgba(150, 255, 150, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        );
      case 'dullness':
        return (
          <>
            {/* 目周りのくすみエリア */}
            <motion.ellipse
              cx="50%"
              cy="48%"
              rx="35%"
              ry="15%"
              fill="rgba(180, 180, 180, 0.3)"
              stroke="rgba(200, 200, 200, 0.6)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        );
      case 'moisture':
        return (
          <>
            {/* 潤いチェックエリア */}
            {[30, 50, 70].map((x, i) => (
              <motion.circle
                key={i}
                cx={`${x}%`}
                cy="50%"
                r="8%"
                fill="rgba(100, 200, 255, 0.2)"
                stroke="rgba(100, 200, 255, 0.6)"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {getOverlayContent()}
      </svg>
    </AnimatePresence>
  );
}
