'use client';

import { motion } from 'framer-motion';
import { DiagnosisScores, EyePositions } from '@/types/diagnosis';

interface FaceAnalysisOverlayProps {
  capturedImage: string;
  scores: DiagnosisScores;
  eyePositions?: EyePositions | null;
  language: 'ja' | 'ko';
}

interface ProblemArea {
  key: keyof DiagnosisScores;
  labelJa: string;
  labelKo: string;
  score: number;
  color: string;
  position: { top: string; left: string; width: string; height: string };
}

export default function FaceAnalysisOverlay({
  capturedImage,
  scores,
  eyePositions,
  language,
}: FaceAnalysisOverlayProps) {
  // スコアに基づいて色を決定
  const getColorForScore = (score: number): string => {
    if (score <= 2) return 'rgba(229, 115, 115, 0.6)'; // 赤
    if (score <= 3) return 'rgba(255, 183, 77, 0.5)'; // オレンジ
    if (score <= 4) return 'rgba(129, 199, 132, 0.4)'; // 緑
    return 'rgba(79, 195, 247, 0.3)'; // 青
  };

  const getBorderColor = (score: number): string => {
    if (score <= 2) return '#E57373';
    if (score <= 3) return '#FFB74D';
    if (score <= 4) return '#81C784';
    return '#4FC3F7';
  };

  // 目の下エリアを計算（MediaPipe座標から）
  const getUnderEyeArea = (isLeft: boolean): { top: string; left: string; width: string; height: string } => {
    if (!eyePositions) {
      // フォールバック：固定位置
      return isLeft
        ? { top: '52%', left: '20%', width: '25%', height: '12%' }
        : { top: '52%', left: '55%', width: '25%', height: '12%' };
    }

    const eye = isLeft ? eyePositions.leftEye : eyePositions.rightEye;
    const underEyePoints = isLeft ? eyePositions.leftUnderEye : eyePositions.rightUnderEye;

    if (underEyePoints && underEyePoints.length > 0) {
      // 目の下ポイントの範囲を計算
      const xValues = underEyePoints.map(p => p.x);
      const yValues = underEyePoints.map(p => p.y);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      // 範囲を少し広げる
      const padding = 0.02;
      return {
        top: `${(minY - padding) * 100}%`,
        left: `${(minX - padding) * 100}%`,
        width: `${(maxX - minX + padding * 2) * 100}%`,
        height: `${(maxY - minY + padding * 2) * 100}%`,
      };
    }

    // 目の位置から推測
    const offsetY = 0.08; // 目から下にオフセット
    const width = 0.15;
    const height = 0.08;

    return {
      top: `${(eye.y + offsetY) * 100}%`,
      left: `${(eye.x - width / 2) * 100}%`,
      width: `${width * 100}%`,
      height: `${height * 100}%`,
    };
  };

  // 目尻のシワエリアを計算
  const getEyeCornerArea = (isLeft: boolean): { top: string; left: string; width: string; height: string } => {
    if (!eyePositions) {
      // フォールバック：固定位置
      return isLeft
        ? { top: '45%', left: '8%', width: '12%', height: '15%' }
        : { top: '45%', left: '80%', width: '12%', height: '15%' };
    }

    const eye = isLeft ? eyePositions.leftEye : eyePositions.rightEye;

    // 目尻の位置を計算（左目は左側、右目は右側）
    const offsetX = isLeft ? -0.12 : 0.08;
    const width = 0.08;
    const height = 0.10;

    return {
      top: `${(eye.y - height / 2) * 100}%`,
      left: `${(eye.x + offsetX) * 100}%`,
      width: `${width * 100}%`,
      height: `${height * 100}%`,
    };
  };

  // 問題箇所の定義（実際の座標を使用）
  const problemAreas: ProblemArea[] = [
    {
      key: 'darkCircles',
      labelJa: 'クマ',
      labelKo: '다크서클',
      score: scores.darkCircles,
      color: getColorForScore(scores.darkCircles),
      position: getUnderEyeArea(true), // 左目の下
    },
    {
      key: 'darkCircles',
      labelJa: 'クマ',
      labelKo: '다크서클',
      score: scores.darkCircles,
      color: getColorForScore(scores.darkCircles),
      position: getUnderEyeArea(false), // 右目の下
    },
    {
      key: 'wrinkles',
      labelJa: 'シワ',
      labelKo: '주름',
      score: scores.wrinkles,
      color: getColorForScore(scores.wrinkles),
      position: getEyeCornerArea(true), // 左目尻
    },
    {
      key: 'wrinkles',
      labelJa: 'シワ',
      labelKo: '주름',
      score: scores.wrinkles,
      color: getColorForScore(scores.wrinkles),
      position: getEyeCornerArea(false), // 右目尻
    },
  ];

  // スコアが低い順にソート
  const sortedScores = Object.entries(scores)
    .map(([key, value]) => ({
      key: key as keyof DiagnosisScores,
      value,
      label: getLabel(key as keyof DiagnosisScores),
    }))
    .sort((a, b) => a.value - b.value);

  function getLabel(key: keyof DiagnosisScores): string {
    const labels = {
      darkCircles: language === 'ja' ? 'クマ' : '다크서클',
      wrinkles: language === 'ja' ? 'シワ' : '주름',
      firmness: language === 'ja' ? 'ハリ' : '탄력',
      dullness: language === 'ja' ? 'くすみ' : '칙칙함',
      moisture: language === 'ja' ? '潤い' : '수분',
    };
    return labels[key];
  }

  function getScoreLabel(score: number): string {
    if (score <= 2) return language === 'ja' ? '要改善' : '개선필요';
    if (score <= 3) return language === 'ja' ? '注意' : '주의';
    if (score <= 4) return language === 'ja' ? '良好' : '양호';
    return language === 'ja' ? '優秀' : '우수';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">
        {language === 'ja' ? '問題箇所の分析' : '문제 부위 분석'}
      </h2>

      {/* 画像とオーバーレイ */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F5F5]">
        <img
          src={capturedImage}
          alt="分析画像"
          className="w-full h-full object-cover"
        />

        {/* 検出状態の表示 */}
        {eyePositions && (
          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
            {language === 'ja' ? '顔検出済み' : '얼굴 감지됨'}
          </div>
        )}

        {/* 問題箇所のハイライト */}
        {problemAreas.map((area, index) => (
          <motion.div
            key={`${area.key}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="absolute rounded-lg"
            style={{
              top: area.position.top,
              left: area.position.left,
              width: area.position.width,
              height: area.position.height,
              backgroundColor: area.color,
              border: `2px solid ${getBorderColor(area.score)}`,
              boxShadow: `0 0 10px ${area.color}`,
            }}
          />
        ))}

        {/* 凡例オーバーレイ */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="flex justify-center gap-3 text-xs text-white">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E57373]" />
              {language === 'ja' ? '要改善' : '개선필요'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FFB74D]" />
              {language === 'ja' ? '注意' : '주의'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#81C784]" />
              {language === 'ja' ? '良好' : '양호'}
            </span>
          </div>
        </div>
      </div>

      {/* スコア一覧 */}
      <div className="mt-4 space-y-2">
        <h3 className="text-xs text-[#999] uppercase tracking-wider">
          {language === 'ja' ? '改善優先度' : '개선 우선순위'}
        </h3>
        {sortedScores.slice(0, 3).map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: getBorderColor(item.value) }}
              >
                {index + 1}
              </span>
              <span className="text-sm text-[#333]">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#1A1A1A]">
                {item.value}/5
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${getBorderColor(item.value)}20`,
                  color: getBorderColor(item.value),
                }}
              >
                {getScoreLabel(item.value)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
