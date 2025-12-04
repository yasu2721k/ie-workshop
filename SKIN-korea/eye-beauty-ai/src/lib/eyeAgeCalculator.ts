// src/lib/eyeAgeCalculator.ts
import { DiagnosisScores, EyeAge } from '@/types/diagnosis';

// 基準年齢（平均的な20代後半の目元状態）
const BASE_AGE = 27;

// 各軸の年齢への影響度
const AGE_WEIGHTS: Record<keyof DiagnosisScores, number> = {
  darkCircles: 2.0,  // クマは年齢印象に大きく影響
  wrinkles: 2.5,     // シワは最も年齢に影響
  firmness: 1.5,     // ハリの低下
  dullness: 1.0,     // くすみ
  moisture: 1.0,     // 潤い不足
};

export const calculateEyeAge = (
  scores: DiagnosisScores,
  actualAge?: number,  // 実年齢（任意）
  language: 'ja' | 'ko' = 'ja'
): EyeAge => {
  // 各軸のスコアを年齢に換算
  // スコア5 = 基準年齢、スコア1 = 基準年齢 + 加重×4
  let ageModifier = 0;

  (Object.keys(scores) as (keyof DiagnosisScores)[]).forEach((key) => {
    const score = scores[key];
    const weight = AGE_WEIGHTS[key];
    // スコア5なら0、スコア1なら+4年（×重み）
    ageModifier += (5 - score) * weight;
  });

  // 目元年齢を算出（最低18歳、最高65歳）
  const estimatedAge = Math.min(65, Math.max(18, Math.round(BASE_AGE + ageModifier)));

  // 実年齢との差
  const difference = actualAge ? estimatedAge - actualAge : 0;

  // メッセージ生成
  let message: string;
  if (!actualAge) {
    message = language === 'ja'
      ? `あなたの目元年齢は ${estimatedAge}歳 です`
      : `당신의 눈가 나이는 ${estimatedAge}세 입니다`;
  } else if (difference <= -5) {
    message = language === 'ja'
      ? `実年齢より ${Math.abs(difference)}歳 若い目元です！`
      : `실제 나이보다 ${Math.abs(difference)}세 젊은 눈가입니다!`;
  } else if (difference < 0) {
    message = language === 'ja'
      ? `実年齢より ${Math.abs(difference)}歳 若い印象です`
      : `실제 나이보다 ${Math.abs(difference)}세 젊은 인상입니다`;
  } else if (difference === 0) {
    message = language === 'ja'
      ? `年齢相応の目元状態です`
      : `나이에 맞는 눈가 상태입니다`;
  } else if (difference <= 3) {
    message = language === 'ja'
      ? `目元ケアで ${difference}歳 若返りが期待できます`
      : `눈가 케어로 ${difference}세 젊어질 수 있습니다`;
  } else {
    message = language === 'ja'
      ? `集中ケアで ${difference}歳 の改善が見込めます`
      : `집중 케어로 ${difference}세 개선이 기대됩니다`;
  }

  return {
    estimatedAge,
    difference,
    message,
  };
};

// 総合スコアを算出（各軸の平均 × 20）
export const calculateOverallScore = (scores: DiagnosisScores): number => {
  const values = Object.values(scores);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 20);
};

// 最も改善が必要な項目を特定
export const findPrimaryConcern = (scores: DiagnosisScores): keyof DiagnosisScores => {
  let minScore = 5;
  let primaryConcern: keyof DiagnosisScores = 'darkCircles';

  (Object.keys(scores) as (keyof DiagnosisScores)[]).forEach((key) => {
    if (scores[key] < minScore) {
      minScore = scores[key];
      primaryConcern = key;
    }
  });

  return primaryConcern;
};
