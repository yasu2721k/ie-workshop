'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DiagnosisScores, ProblemAreas, ProblemPoint } from '@/types/diagnosis';

interface AdvancedVisualizationProps {
  capturedImage: string;
  scores: DiagnosisScores;
  problemAreas?: ProblemAreas | null;
  mode: 'darkCircles' | 'wrinkles' | 'moisture' | 'dullness' | 'firmness';
}

export default function AdvancedVisualization({
  capturedImage,
  scores,
  problemAreas,
  mode,
}: AdvancedVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        drawVisualization(canvas, img);
      }
    };
    img.src = capturedImage;
  }, [capturedImage, mode, scores, problemAreas]);

  const drawVisualization = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the base image
    ctx.drawImage(img, 0, 0);

    switch (mode) {
      case 'darkCircles':
        drawDarkCirclesVisualization(ctx, canvas);
        break;
      case 'wrinkles':
        drawWrinklesVisualization(ctx, canvas);
        break;
      case 'moisture':
        drawMoistureHeatmap(ctx, canvas);
        break;
      case 'dullness':
        drawDullnessHeatmap(ctx, canvas);
        break;
      case 'firmness':
        drawFirmnessHeatmap(ctx, canvas);
        break;
    }
  };

  // クマの可視化 - なぞるような曲線
  const drawDarkCirclesVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const problems = problemAreas?.darkCircles || [];
    const score = scores.darkCircles;
    
    // デフォルトの目の位置（AIからデータがない場合）
    const defaultPositions = [
      { x: 0.35, y: 0.42 }, // 左目の下
      { x: 0.65, y: 0.42 }, // 右目の下
    ];

    const positions = problems.length > 0 
      ? problems.map(p => ({ x: p.x, y: p.y }))
      : defaultPositions;

    ctx.strokeStyle = getColorForScore(score);
    ctx.fillStyle = getColorForScore(score, 0.2);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    positions.forEach((pos) => {
      const centerX = pos.x * canvas.width;
      const centerY = pos.y * canvas.height;
      
      // 目の下の曲線をなぞる
      ctx.beginPath();
      
      // ベジェ曲線で自然な目の下のラインを描画
      const startX = centerX - canvas.width * 0.04;
      const endX = centerX + canvas.width * 0.04;
      const startY = centerY;
      const endY = centerY;
      const controlY = centerY + canvas.height * 0.02;

      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(centerX, controlY, endX, endY);
      ctx.stroke();

      // 半透明のエリアを塗りつぶし
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(centerX, controlY, endX, endY);
      ctx.quadraticCurveTo(centerX, controlY + canvas.height * 0.015, startX, startY);
      ctx.closePath();
      ctx.fill();
    });
  };

  // シワの可視化 - 細かい線
  const drawWrinklesVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const problems = problemAreas?.wrinkles || [];
    const score = scores.wrinkles;
    
    // デフォルトのシワ位置
    const defaultPositions = [
      { x: 0.28, y: 0.38, type: '目尻' }, // 左目尻
      { x: 0.72, y: 0.38, type: '目尻' }, // 右目尻
    ];

    const positions = problems.length > 0 
      ? problems
      : defaultPositions.map(p => ({ ...p, x: p.x, y: p.y, severity: 3 }));

    ctx.strokeStyle = getColorForScore(score);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    positions.forEach((pos) => {
      const centerX = pos.x * canvas.width;
      const centerY = pos.y * canvas.height;
      
      if (pos.type === '目尻' || pos.x < 0.5 && pos.x < 0.4 || pos.x > 0.5 && pos.x > 0.6) {
        // 目尻のシワ - 放射状の細い線
        for (let i = 0; i < 3 + (5 - score); i++) {
          const angle = (Math.PI / 6) * i - Math.PI / 12;
          const length = canvas.width * (0.015 + Math.random() * 0.01);
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          
          const endX = centerX + Math.cos(angle) * length * (pos.x < 0.5 ? -1 : 1);
          const endY = centerY + Math.sin(angle) * length;
          
          // 曲線でより自然に
          const controlX = centerX + Math.cos(angle) * length * 0.5 * (pos.x < 0.5 ? -1 : 1);
          const controlY = centerY + Math.sin(angle) * length * 0.7;
          
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          ctx.stroke();
        }
      } else {
        // 目の下の細かいシワ - 横線
        for (let i = 0; i < 2 + (5 - score); i++) {
          const offsetY = i * canvas.height * 0.003;
          
          ctx.beginPath();
          ctx.moveTo(centerX - canvas.width * 0.02, centerY + offsetY);
          ctx.lineTo(centerX + canvas.width * 0.02, centerY + offsetY);
          ctx.stroke();
        }
      }
    });
  };

  // 潤いのヒートマップ
  const drawMoistureHeatmap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const moistureScore = scores.moisture;
    
    // 顔の中心付近にグラデーションを作成
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.5, 
      canvas.height * 0.4,
      0,
      canvas.width * 0.5,
      canvas.height * 0.4,
      canvas.width * 0.3
    );

    if (moistureScore >= 4) {
      // 潤いが高い場合 - 緑系のグラデーション
      gradient.addColorStop(0, 'rgba(76, 175, 80, 0.4)');
      gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.3)');
      gradient.addColorStop(1, 'rgba(129, 199, 132, 0)');
    } else if (moistureScore >= 3) {
      // 普通 - 黄緑系
      gradient.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    } else {
      // 乾燥 - オレンジ〜赤系
      gradient.addColorStop(0, 'rgba(255, 87, 34, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
    }

    // 目元周辺に複数の円形グラデーションを配置
    const eyePositions = [
      { x: 0.35, y: 0.38 }, // 左目
      { x: 0.65, y: 0.38 }, // 右目
      { x: 0.5, y: 0.45 },  // 鼻の下
      { x: 0.5, y: 0.32 },  // 額
    ];

    // ブレンドモードを設定
    ctx.globalCompositeOperation = 'multiply';
    
    eyePositions.forEach((pos) => {
      const localGradient = ctx.createRadialGradient(
        pos.x * canvas.width,
        pos.y * canvas.height,
        0,
        pos.x * canvas.width,
        pos.y * canvas.height,
        canvas.width * 0.08
      );

      if (moistureScore >= 4) {
        localGradient.addColorStop(0, 'rgba(76, 175, 80, 0.5)');
        localGradient.addColorStop(0.7, 'rgba(129, 199, 132, 0.2)');
        localGradient.addColorStop(1, 'rgba(129, 199, 132, 0)');
      } else if (moistureScore >= 3) {
        localGradient.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
        localGradient.addColorStop(0.7, 'rgba(255, 193, 7, 0.15)');
        localGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
      } else {
        localGradient.addColorStop(0, 'rgba(255, 87, 34, 0.5)');
        localGradient.addColorStop(0.7, 'rgba(255, 152, 0, 0.2)');
        localGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
      }

      ctx.fillStyle = localGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // 元のブレンドモードに戻す
    ctx.globalCompositeOperation = 'source-over';

    // 潤いスポットを追加（高スコアの場合）
    if (moistureScore >= 4) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height * 0.2 + Math.random() * canvas.height * 0.4;
        const size = 2 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // スコアに基づいた色を取得
  const getColorForScore = (score: number, alpha = 1): string => {
    if (score <= 2) return `rgba(229, 115, 115, ${alpha})`;
    if (score <= 3) return `rgba(255, 183, 77, ${alpha})`;
    if (score <= 4) return `rgba(129, 199, 132, ${alpha})`;
    return `rgba(79, 195, 247, ${alpha})`;
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}