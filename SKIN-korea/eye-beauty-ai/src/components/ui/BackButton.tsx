'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackButtonProps {
  href?: string;
  className?: string;
}

export default function BackButton({ href, className = '' }: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 text-gray-700
        hover:text-gray-900 transition-colors duration-200
        py-2 px-1
        ${className}
      `}
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium">{t('common.back')}</span>
    </motion.button>
  );
}
