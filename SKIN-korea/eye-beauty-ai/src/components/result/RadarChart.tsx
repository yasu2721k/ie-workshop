'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { DiagnosisScores } from '@/types/diagnosis';

interface RadarChartProps {
  scores: DiagnosisScores;
  language: 'ja' | 'ko';
}

const LABELS = {
  ja: {
    darkCircles: 'クマ',
    wrinkles: 'シワ',
    firmness: 'ハリ',
    dullness: 'くすみ',
    moisture: '潤い',
  },
  ko: {
    darkCircles: '다크서클',
    wrinkles: '주름',
    firmness: '탄력',
    dullness: '칙칙함',
    moisture: '수분',
  },
};

export const DiagnosisRadarChart = ({ scores, language }: RadarChartProps) => {
  const labels = LABELS[language];

  const data = [
    { subject: labels.darkCircles, value: scores.darkCircles, fullMark: 5 },
    { subject: labels.wrinkles, value: scores.wrinkles, fullMark: 5 },
    { subject: labels.firmness, value: scores.firmness, fullMark: 5 },
    { subject: labels.dullness, value: scores.dullness, fullMark: 5 },
    { subject: labels.moisture, value: scores.moisture, fullMark: 5 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B7E74" />
              <stop offset="100%" stopColor="#6B5D54" />
            </linearGradient>
          </defs>
          <PolarGrid
            stroke="rgba(139, 126, 116, 0.2)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#6B6B6B', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: '#9B9B9B', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="診断結果"
            dataKey="value"
            stroke="url(#radarGradient)"
            fill="url(#radarGradient)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
