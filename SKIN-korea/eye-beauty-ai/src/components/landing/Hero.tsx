'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';

export default function Hero() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const trustIndicators = language === 'ko'
    ? [
        { label: 'AI 진단', color: 'bg-[#8B7E74]' },
        { label: '무료', color: 'bg-[#7A8B6E]' },
        { label: '30초', color: 'bg-[#B87A5E]' },
      ]
    : [
        { label: 'AI診断', color: 'bg-[#8B7E74]' },
        { label: '無料', color: 'bg-[#7A8B6E]' },
        { label: '30秒', color: 'bg-[#B87A5E]' },
      ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden safe-area-top safe-area-bottom bg-[#F5F3EF]">
      {/* Content */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-8">

        {/* Main Visual - Elegant Eye Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-72 h-96 rounded-3xl overflow-hidden shadow-xl border border-[#E8E4DC]"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8E4DC] via-[#F5F3EF] to-[#D4CFC4]" />

          {/* Decorative circles */}
          <div className="absolute top-8 left-8 w-16 h-16 bg-[#8B7E74]/10 rounded-full blur-xl" />
          <div className="absolute bottom-12 right-6 w-24 h-24 bg-[#B87A5E]/10 rounded-full blur-2xl" />

          {/* Face silhouette area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Eye representation */}
              <motion.div
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="relative"
              >
                {/* Outer eye shape */}
                <div className="w-40 h-24 bg-white/60 backdrop-blur-md rounded-[50%] flex items-center justify-center shadow-lg border border-[#D4CFC4]">
                  {/* Iris */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="w-28 h-16 bg-gradient-to-br from-[#8B7E74] via-[#A89B91] to-[#6B5D54] rounded-[50%] flex items-center justify-center shadow-inner"
                  >
                    {/* Pupil */}
                    <div className="relative w-14 h-14 bg-gradient-to-br from-[#2C2C2C] via-[#1A1A1A] to-black rounded-full shadow-xl">
                      {/* Light reflection */}
                      <div className="absolute top-2 left-3 w-4 h-4 bg-white rounded-full opacity-90" />
                      <div className="absolute top-5 left-6 w-2 h-2 bg-white/60 rounded-full" />
                    </div>
                  </motion.div>
                </div>

                {/* Eyelashes top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-[#2C2C2C] rounded-full origin-bottom"
                      style={{
                        height: `${8 + Math.sin(i * 0.8) * 4}px`,
                        transform: `rotate(${(i - 3) * 8}deg)`,
                      }}
                      animate={{ scaleY: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Subtle decorations */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-8 w-3 h-3 bg-[#8B7E74] rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-10 w-2 h-2 bg-[#B87A5E] rounded-full"
              />
            </div>
          </div>

          {/* Subtle Shine Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          />

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#E8E4DC]/60 to-transparent" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-4xl font-light text-[#2C2C2C] tracking-wide"
          >
            {t('landing.title1')}
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl sm:text-4xl font-light text-[#2C2C2C] tracking-wide"
          >
            {t('landing.title2')}
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-lg text-[#6B6B6B] font-light"
        >
          {t('landing.subtitle')}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="w-full max-w-xs"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(ROUTES.CAMERA)}
            icon={<Eye className="w-5 h-5" />}
            className="w-full"
          >
            {t('landing.cta')}
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-4 sm:gap-6 text-sm text-[#6B6B6B]"
        >
          {trustIndicators.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${item.color} rounded-full`} />
              {item.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
