'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosisScores, EyePositions } from '@/types/diagnosis';

interface DetailedFaceAnalysisProps {
  capturedImage: string;
  scores: DiagnosisScores;
  eyePositions?: EyePositions | null;
  language: 'ja' | 'ko';
}

type AnalysisMode = 'overview' | 'darkCircles' | 'wrinkles' | 'firmness' | 'dullness' | 'moisture';

// スコアに基づく色
const getScoreColor = (score: number) => {
  if (score <= 2) return { main: '#E57373', light: 'rgba(229, 115, 115, 0.3)' };
  if (score <= 3) return { main: '#FFB74D', light: 'rgba(255, 183, 77, 0.3)' };
  if (score <= 4) return { main: '#81C784', light: 'rgba(129, 199, 132, 0.3)' };
  return { main: '#4FC3F7', light: 'rgba(79, 195, 247, 0.3)' };
};

export default function DetailedFaceAnalysis({
  capturedImage,
  scores,
  eyePositions,
  language,
}: DetailedFaceAnalysisProps) {
  const [activeMode, setActiveMode] = useState<AnalysisMode>('overview');

  // X座標を反転（ミラー画像対応）
  const mirrorX = (x: number): number => 1 - x;

  // 目の位置を取得
  const getEyeCenter = (isLeft: boolean) => {
    if (!eyePositions) {
      return isLeft ? { x: 0.35, y: 0.42 } : { x: 0.65, y: 0.42 };
    }
    const eye = isLeft ? eyePositions.leftEye : eyePositions.rightEye;
    return { x: mirrorX(eye.x), y: eye.y };
  };

  // 問題箇所のポイントを生成（スコアに基づいてドット数を調整）
  const generateProblemPoints = (
    mode: AnalysisMode,
    score: number
  ): { x: number; y: number; size: number; intensity: number }[] => {
    const points: { x: number; y: number; size: number; intensity: number }[] = [];

    // スコアが高いほどドットは少ない
    const baseCount = Math.max(3, (5 - score) * 8);
    const intensity = Math.max(0.3, (5 - score) / 5);

    const leftEye = getEyeCenter(true);
    const rightEye = getEyeCenter(false);

    switch (mode) {
      case 'darkCircles':
        // 目の下にドットを配置
        for (let i = 0; i < baseCount; i++) {
          // 左目の下
          points.push({
            x: leftEye.x + (Math.random() - 0.5) * 0.12,
            y: leftEye.y + 0.06 + Math.random() * 0.06,
            size: 2 + Math.random() * 3,
            intensity: intensity * (0.7 + Math.random() * 0.3),
          });
          // 右目の下
          points.push({
            x: rightEye.x + (Math.random() - 0.5) * 0.12,
            y: rightEye.y + 0.06 + Math.random() * 0.06,
            size: 2 + Math.random() * 3,
            intensity: intensity * (0.7 + Math.random() * 0.3),
          });
        }
        break;

      case 'wrinkles':
        // 目尻にラインとドットを配置
        for (let i = 0; i < baseCount / 2; i++) {
          // 左目尻
          points.push({
            x: leftEye.x + 0.08 + Math.random() * 0.04,
            y: leftEye.y + (Math.random() - 0.5) * 0.08,
            size: 1 + Math.random() * 2,
            intensity: intensity * (0.6 + Math.random() * 0.4),
          });
          // 右目尻
          points.push({
            x: rightEye.x - 0.08 - Math.random() * 0.04,
            y: rightEye.y + (Math.random() - 0.5) * 0.08,
            size: 1 + Math.random() * 2,
            intensity: intensity * (0.6 + Math.random() * 0.4),
          });
        }
        // 目の下のシワ
        for (let i = 0; i < baseCount / 3; i++) {
          points.push({
            x: leftEye.x + (Math.random() - 0.5) * 0.1,
            y: leftEye.y + 0.04 + Math.random() * 0.03,
            size: 1 + Math.random() * 1.5,
            intensity: intensity * 0.5,
          });
          points.push({
            x: rightEye.x + (Math.random() - 0.5) * 0.1,
            y: rightEye.y + 0.04 + Math.random() * 0.03,
            size: 1 + Math.random() * 1.5,
            intensity: intensity * 0.5,
          });
        }
        break;

      case 'firmness':
        // 目の下全体にエリアを表示
        for (let i = 0; i < baseCount; i++) {
          points.push({
            x: leftEye.x + (Math.random() - 0.5) * 0.15,
            y: leftEye.y + 0.05 + Math.random() * 0.08,
            size: 3 + Math.random() * 4,
            intensity: intensity * (0.5 + Math.random() * 0.3),
          });
          points.push({
            x: rightEye.x + (Math.random() - 0.5) * 0.15,
            y: rightEye.y + 0.05 + Math.random() * 0.08,
            size: 3 + Math.random() * 4,
            intensity: intensity * (0.5 + Math.random() * 0.3),
          });
        }
        break;

      case 'dullness':
        // 目の周り全体にくすみを表示
        for (let i = 0; i < baseCount * 1.5; i++) {
          points.push({
            x: leftEye.x + (Math.random() - 0.5) * 0.18,
            y: leftEye.y + (Math.random() - 0.3) * 0.15,
            size: 4 + Math.random() * 5,
            intensity: intensity * (0.3 + Math.random() * 0.4),
          });
          points.push({
            x: rightEye.x + (Math.random() - 0.5) * 0.18,
            y: rightEye.y + (Math.random() - 0.3) * 0.15,
            size: 4 + Math.random() * 5,
            intensity: intensity * (0.3 + Math.random() * 0.4),
          });
        }
        break;

      case 'moisture':
        // 乾燥エリアを表示
        for (let i = 0; i < baseCount; i++) {
          points.push({
            x: leftEye.x + (Math.random() - 0.5) * 0.14,
            y: leftEye.y + 0.02 + Math.random() * 0.1,
            size: 2 + Math.random() * 3,
            intensity: intensity * (0.4 + Math.random() * 0.4),
          });
          points.push({
            x: rightEye.x + (Math.random() - 0.5) * 0.14,
            y: rightEye.y + 0.02 + Math.random() * 0.1,
            size: 2 + Math.random() * 3,
            intensity: intensity * (0.4 + Math.random() * 0.4),
          });
        }
        break;
    }

    return points;
  };

  // 輪郭線を描画（目元エリア）
  const getEyeAreaOutline = (isLeft: boolean) => {
    const eye = getEyeCenter(isLeft);
    const cx = eye.x * 100;
    const cy = eye.y * 100;

    // 目の周りの楕円形輪郭
    return `M ${cx - 8} ${cy}
            C ${cx - 8} ${cy - 5}, ${cx - 4} ${cy - 7}, ${cx} ${cy - 7}
            C ${cx + 4} ${cy - 7}, ${cx + 8} ${cy - 5}, ${cx + 8} ${cy}
            C ${cx + 8} ${cy + 8}, ${cx + 4} ${cy + 12}, ${cx} ${cy + 12}
            C ${cx - 4} ${cy + 12}, ${cx - 8} ${cy + 8}, ${cx - 8} ${cy} Z`;
  };

  // 現在のモードのスコアと色を取得
  const getCurrentModeData = () => {
    if (activeMode === 'overview') return null;
    const score = scores[activeMode as keyof DiagnosisScores];
    return {
      score,
      color: getScoreColor(score),
      points: generateProblemPoints(activeMode, score),
    };
  };

  const modeData = getCurrentModeData();

  // モードの表示名
  const getModeLabel = (mode: AnalysisMode) => {
    const labels = {
      overview: language === 'ja' ? '全体' : '전체',
      darkCircles: language === 'ja' ? 'クマ' : '다크서클',
      wrinkles: language === 'ja' ? 'シワ' : '주름',
      firmness: language === 'ja' ? 'ハリ' : '탄력',
      dullness: language === 'ja' ? 'くすみ' : '칙칙함',
      moisture: language === 'ja' ? '潤い' : '수분',
    };
    return labels[mode];
  };

  const modes: AnalysisMode[] = ['overview', 'darkCircles', 'wrinkles', 'firmness', 'dullness', 'moisture'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium text-[#1A1A1A]">
          {language === 'ja' ? '詳細分析マップ' : '상세 분석 맵'}
        </h2>
        <p className="text-xs text-[#999] mt-1">
          {language === 'ja' ? 'タップして詳細を表示できます' : '탭하여 상세를 표시합니다'}
        </p>
      </div>

      {/* 画像とオーバーレイ */}
      <div className="relative w-full aspect-[3/4] bg-[#1a1a1a]">
        <img
          src={capturedImage}
          alt="分析画像"
          className="w-full h-full object-cover"
        />

        {/* SVGオーバーレイ */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 133.33"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* 目元エリアの輪郭線（overview時） */}
          {activeMode === 'overview' && (
            <>
              <motion.path
                d={getEyeAreaOutline(true)}
                fill="none"
                stroke="#4FC3F7"
                strokeWidth="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.path
                d={getEyeAreaOutline(false)}
                fill="none"
                stroke="#4FC3F7"
                strokeWidth="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </>
          )}

          {/* 問題箇所のドット */}
          <AnimatePresence mode="wait">
            {modeData && (
              <motion.g
                key={activeMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {modeData.points.map((point, index) => (
                  <motion.circle
                    key={index}
                    cx={point.x * 100}
                    cy={point.y * 133.33}
                    r={point.size * 0.3}
                    fill={modeData.color.main}
                    opacity={point.intensity}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: point.intensity }}
                    transition={{ delay: index * 0.01, duration: 0.3 }}
                  />
                ))}

                {/* エリアの輪郭線 */}
                <motion.path
                  d={getEyeAreaOutline(true)}
                  fill={modeData.color.light}
                  stroke={modeData.color.main}
                  strokeWidth="0.4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.path
                  d={getEyeAreaOutline(false)}
                  fill={modeData.color.light}
                  stroke={modeData.color.main}
                  strokeWidth="0.4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* スコア表示（モード選択時） */}
        <AnimatePresence>
          {modeData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  {getModeLabel(activeMode)}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: modeData.color.main }}
                >
                  {modeData.score}/5
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* モード切り替えボタン */}
      <div className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {modes.map((mode) => {
            const isActive = activeMode === mode;
            const modeScore = mode === 'overview' ? null : scores[mode as keyof DiagnosisScores];
            const color = modeScore ? getScoreColor(modeScore) : { main: '#4FC3F7' };

            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={isActive ? { backgroundColor: color.main } : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span>{getModeLabel(mode)}</span>
                  {modeScore && (
                    <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {modeScore}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="px-4 pb-4">
        <div className="flex justify-center gap-4 text-xs text-[#666]">
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
    </motion.div>
  );
}
