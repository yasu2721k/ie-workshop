'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DiagnosisScores } from '@/types/diagnosis';

interface ProductRecommendProps {
  primaryConcern: keyof DiagnosisScores;
  language?: 'ja' | 'ko';
}

const PRODUCT_DATA = {
  ja: {
    darkCircles: {
      name: 'トーンアップ・アイクリーム',
      description: '韓国アイドルのような水光肌へ導く',
      tags: ['K-Beauty', 'ベストセラー'],
    },
    wrinkles: {
      name: 'アンチエイジング美容液',
      description: '寝ている間に集中補修',
      tags: ['K-Beauty', '人気'],
    },
    firmness: {
      name: 'リフトアップアイセラム',
      description: '目元のハリを取り戻す',
      tags: ['K-Beauty', '新商品'],
    },
    dullness: {
      name: 'ブライトニングアイパック',
      description: '透明感のある輝く目元へ',
      tags: ['K-Beauty', '話題'],
    },
    moisture: {
      name: 'ハイドレーションアイジェル',
      description: '深いうるおいで乾燥をケア',
      tags: ['K-Beauty', '人気'],
    },
  },
  ko: {
    darkCircles: {
      name: '톤업 아이크림',
      description: '한국 아이돌 같은 물광 피부로',
      tags: ['K-Beauty', '베스트셀러'],
    },
    wrinkles: {
      name: '안티에이징 세럼',
      description: '자는 동안 집중 보수',
      tags: ['K-Beauty', '인기'],
    },
    firmness: {
      name: '리프팅 아이세럼',
      description: '눈가 탄력을 되찾아주는',
      tags: ['K-Beauty', '신상품'],
    },
    dullness: {
      name: '브라이트닝 아이팩',
      description: '투명한 빛나는 눈가로',
      tags: ['K-Beauty', '화제'],
    },
    moisture: {
      name: '하이드레이션 아이젤',
      description: '깊은 수분으로 건조 케어',
      tags: ['K-Beauty', '인기'],
    },
  },
};

export default function ProductRecommend({ primaryConcern, language = 'ja' }: ProductRecommendProps) {
  const { t } = useLanguage();
  const product = PRODUCT_DATA[language][primaryConcern];

  const gradientColors = {
    darkCircles: 'from-[#E8E4DC] to-[#D4CFC4]',
    wrinkles: 'from-[#E8E4DC] to-[#D4CFC4]',
    firmness: 'from-[#E8E4DC] to-[#D4CFC4]',
    dullness: 'from-[#E8E4DC] to-[#D4CFC4]',
    moisture: 'from-[#E8E4DC] to-[#D4CFC4]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#8B7E74]"><Eye className="w-5 h-5" /></span>
        <span className="text-[#2C2C2C] font-medium">{t('result.recommend')}</span>
      </div>

      {/* Product Card */}
      <div className="flex gap-4">
        {/* Product Image Placeholder */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
        >
          <div className={`
            absolute inset-0 bg-gradient-to-br ${gradientColors[primaryConcern]}
          `} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShoppingBag className="w-10 h-10 text-[#8B7E74]" />
            </motion.div>
          </div>
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>

        {/* Product Info */}
        <div className="flex-1">
          <h3 className="font-medium text-[#2C2C2C] mb-1">{product.name}</h3>
          <p className="text-sm text-[#6B6B6B] mb-3 font-light">{product.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 text-xs rounded-full ${
                  index === 0
                    ? 'bg-[#E8E4DC] text-[#6B5D54]'
                    : 'bg-[#F5F3EF] text-[#8B7E74]'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-3 bg-[#2C2C2C] text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-[#3D3D3D] transition-colors"
      >
        <Eye className="w-4 h-4" />
        {language === 'ja' ? '詳しく見る' : '자세히 보기'}
      </motion.button>
    </motion.div>
  );
}
