'use client';

import { motion } from 'framer-motion';
import { SkinToneAnalysis } from '@/types/diagnosis';

interface SkinToneCardProps {
  analysis: SkinToneAnalysis;
  language: 'ja' | 'ko';
}

interface ToneItemProps {
  label: string;
  value: number;
  color: string;
  delay: number;
}

function ToneItem({ label, value, color, delay }: ToneItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#666] w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
      <span className="text-sm font-medium text-[#1A1A1A] w-10 text-right">
        {value}%
      </span>
    </div>
  );
}

export default function SkinToneCard({ analysis, language }: SkinToneCardProps) {
  const items = [
    {
      labelJa: '青み',
      labelKo: '푸른기',
      value: analysis.blueness,
      color: '#7C9EB2',
    },
    {
      labelJa: '茶み',
      labelKo: '갈색기',
      value: analysis.brownness,
      color: '#A67B5B',
    },
    {
      labelJa: '黄ぐすみ',
      labelKo: '노란기',
      value: analysis.yellowness,
      color: '#D4A574',
    },
    {
      labelJa: '赤み',
      labelKo: '붉은기',
      value: analysis.redness,
      color: '#C97B7B',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <h2 className="text-sm font-medium text-[#1A1A1A] mb-4">
        {language === 'ja' ? '肌トーン分析' : '피부톤 분석'}
      </h2>

      {/* メイン指標：透明感 & 明るさ */}
      <div className="flex gap-4 mb-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex-1 bg-gradient-to-br from-[#F8F6F4] to-[#EDE9E4] rounded-xl p-4 text-center"
        >
          <div className="text-3xl font-light text-[#1A1A1A] mb-1">
            {analysis.clarity}
          </div>
          <div className="text-xs text-[#666]">
            {language === 'ja' ? '透明感' : '투명도'}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex-1 bg-gradient-to-br from-[#FFF9F5] to-[#F5EDE6] rounded-xl p-4 text-center"
        >
          <div className="text-3xl font-light text-[#1A1A1A] mb-1">
            {analysis.brightness}
          </div>
          <div className="text-xs text-[#666]">
            {language === 'ja' ? '明るさ' : '밝기'}
          </div>
        </motion.div>
      </div>

      {/* 色成分バー */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <ToneItem
            key={item.labelJa}
            label={language === 'ja' ? item.labelJa : item.labelKo}
            value={item.value}
            color={item.color}
            delay={0.5 + index * 0.1}
          />
        ))}
      </div>

      {/* 解説 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 text-xs text-[#999] leading-relaxed"
      >
        {language === 'ja'
          ? '※画像から検出した目元周辺の色成分を分析しています'
          : '※이미지에서 감지된 눈가 주변의 색상 성분을 분석합니다'}
      </motion.p>
    </motion.div>
  );
}
