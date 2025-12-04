'use client';

import { motion } from 'framer-motion';

interface FaceGuideProps {
  isActive: boolean;
}

export default function FaceGuide({ isActive }: FaceGuideProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Darkened corners */}
      <div className="absolute inset-0">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="faceMask">
              <rect width="100" height="100" fill="white" />
              <ellipse cx="50" cy="45" rx="28" ry="35" fill="black" />
            </mask>
          </defs>
          <rect
            width="100"
            height="100"
            fill="rgba(0,0,0,0.5)"
            mask="url(#faceMask)"
          />
        </svg>
      </div>

      {/* Face Outline */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-5%' }}>
        <motion.div
          animate={isActive ? {
            scale: [1, 1.02, 1],
            opacity: [0.6, 1, 0.6],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
          style={{ width: '56%', aspectRatio: '0.8' }}
        >
          {/* Main oval guide */}
          <div
            className={`
              absolute inset-0 rounded-full border-2
              ${isActive ? 'border-pink-400' : 'border-white/50'}
              transition-colors duration-300
            `}
            style={{ borderRadius: '50%' }}
          />

          {/* Corner markers */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 125">
            {/* Top left */}
            <path
              d="M 20 10 L 10 10 L 10 25"
              fill="none"
              stroke={isActive ? '#f472b6' : 'rgba(255,255,255,0.5)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Top right */}
            <path
              d="M 80 10 L 90 10 L 90 25"
              fill="none"
              stroke={isActive ? '#f472b6' : 'rgba(255,255,255,0.5)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bottom left */}
            <path
              d="M 10 100 L 10 115 L 20 115"
              fill="none"
              stroke={isActive ? '#f472b6' : 'rgba(255,255,255,0.5)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bottom right */}
            <path
              d="M 90 100 L 90 115 L 80 115"
              fill="none"
              stroke={isActive ? '#f472b6' : 'rgba(255,255,255,0.5)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Eye area indicators */}
          <div className="absolute left-[15%] right-[15%] top-[35%] flex justify-between px-2">
            <motion.div
              animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-3 border border-pink-300/60 rounded-full"
            />
            <motion.div
              animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-8 h-3 border border-pink-300/60 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Scanning line effect when active */}
      {isActive && (
        <motion.div
          className="absolute left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"
          style={{ top: '30%' }}
          animate={{
            top: ['30%', '55%', '30%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
