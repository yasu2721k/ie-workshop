'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES } from '@/lib/constants';

const GUIDE_ITEMS = [
  {
    image: '/images/1.png',
    textJa: 'メガネを外してください',
    textKo: '안경을 벗어주세요',
  },
  {
    image: '/images/2.png',
    textJa: '髪が目元にかからないように',
    textKo: '머리카락이 눈가에 닿지 않도록',
  },
  {
    image: '/images/3.png',
    textJa: '明るい場所で撮影してください',
    textKo: '밝은 곳에서 촬영해주세요',
  },
];

export default function GuidePage() {
  const router = useRouter();
  const { language } = useLanguage();

  const handleStart = () => {
    router.push(ROUTES.CAMERA);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#FAFAFA] px-5 py-6">
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-lg font-medium text-[#1A1A1A]">
          {language === 'ja' ? '撮影のポイント' : '촬영 포인트'}
        </h1>
      </header>

      {/* Content */}
      <div className="max-w-sm w-full mx-auto space-y-3">
        {GUIDE_ITEMS.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 bg-white rounded-2xl px-3 py-1 shadow-sm"
          >
            {/* Image */}
            <div className="relative w-[120px] h-[120px] flex-shrink-0">
              <Image
                src={item.image}
                alt={language === 'ja' ? item.textJa : item.textKo}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Text */}
            <p className="text-[#1A1A1A] text-sm leading-relaxed flex-1">
              {language === 'ja' ? item.textJa : item.textKo}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Privacy Notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-xs text-[#999] text-center"
      >
        {language === 'ja'
          ? '※診断用画像は保存されませんのでご安心ください'
          : '※진단용 이미지는 저장되지 않으니 안심하세요'}
      </motion.p>

      {/* CTA Button */}
      <div className="mt-6 max-w-sm w-full mx-auto">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleStart}
          className="w-full py-4 bg-[#1A1A1A] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
        >
          {language === 'ja' ? '撮影を開始' : '촬영 시작'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </main>
  );
}
