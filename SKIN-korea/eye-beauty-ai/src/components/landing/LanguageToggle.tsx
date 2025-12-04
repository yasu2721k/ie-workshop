'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/types/language';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; flag: string; label: string }[] = [
    { code: 'ja', flag: '🇯🇵', label: '日本語' },
    { code: 'ko', flag: '🇰🇷', label: '한국어' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${language === lang.code
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {language === lang.code && (
              <motion.div
                layoutId="language-indicator"
                className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 text-base">{lang.flag}</span>
            <span className="relative z-10 hidden sm:inline">{lang.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
