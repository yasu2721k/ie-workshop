'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES } from '@/lib/constants';
import Image from 'next/image';

export default function Hero() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const features = language === 'ko'
    ? ['AI 분석', '30초 진단', '무료']
    : ['AI分析', '30秒診断', '無料'];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden px-6 py-12">
      {/* Content Container */}
      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center">

        {/* Hero Image - Subtle circular crop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-48 h-48 mb-10 rounded-full overflow-hidden shadow-lg"
        >
          <Image
            src="/images/model.png"
            alt="Eye beauty"
            fill
            className="object-cover object-[center_25%] scale-90"
            priority
          />

          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
        </motion.div>
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center space-y-1"
        >
          <h1 className="text-4xl font-extralight tracking-[0.2em] text-[#1A1A1A]">
            {t('landing.title1')}
          </h1>
          <h1 className="text-4xl font-extralight tracking-[0.2em] text-[#1A1A1A]">
            {t('landing.title2')}
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-4 text-sm tracking-widest text-[#888] uppercase"
        >
          {t('landing.subtitle')}
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 flex items-center gap-6 text-xs tracking-wider text-[#666]"
        >
          {features.map((feature, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#1A1A1A] rounded-full" />
              {feature}
            </span>
          ))}
        </motion.div>

        {/* CTA Button - Minimal style */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          onClick={() => router.push(ROUTES.GUIDE)}
          className="mt-10 group flex items-center gap-3 px-10 py-4 bg-[#1A1A1A] text-white text-sm tracking-widest uppercase hover:bg-[#333] transition-colors"
        >
          {t('landing.cta')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Bottom spacing */}
        <div className="flex-1 min-h-8" />
      </div>
    </section>
  );
}
