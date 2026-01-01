'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DiagnosisScores, ProblemAreas, ProblemPoint, EyePositions } from '@/types/diagnosis';
import { EYE_LANDMARKS } from '@/lib/mediapipe';

interface AdvancedVisualizationProps {
  capturedImage: string;
  scores: DiagnosisScores;
  problemAreas?: ProblemAreas | null;
  mode: 'darkCircles' | 'wrinkles' | 'moisture' | 'dullness' | 'firmness';
  eyePositions?: EyePositions | null;
}

export default function AdvancedVisualization({
  capturedImage,
  scores,
  problemAreas,
  mode,
  eyePositions,
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
    const score = scores.darkCircles;
    
    // MediaPipeの目の下ランドマークを使用
    let positions: { x: number; y: number }[] = [];
    
    if (eyePositions && eyePositions.leftUnderEye && eyePositions.rightUnderEye) {
      // 左目の下の平均位置
      const leftUnderEyeAvg = {
        x: eyePositions.leftUnderEye.reduce((sum, p) => sum + p.x, 0) / eyePositions.leftUnderEye.length,
        y: eyePositions.leftUnderEye.reduce((sum, p) => sum + p.y, 0) / eyePositions.leftUnderEye.length + 0.01,
      };
      // 右目の下の平均位置
      const rightUnderEyeAvg = {
        x: eyePositions.rightUnderEye.reduce((sum, p) => sum + p.x, 0) / eyePositions.rightUnderEye.length,
        y: eyePositions.rightUnderEye.reduce((sum, p) => sum + p.y, 0) / eyePositions.rightUnderEye.length + 0.01,
      };
      positions = [leftUnderEyeAvg, rightUnderEyeAvg];
    } else if (eyePositions) {
      // 目の中心から下にオフセット
      positions = [
        { x: eyePositions.leftEye.x, y: eyePositions.leftEye.y + 0.04 },
        { x: eyePositions.rightEye.x, y: eyePositions.rightEye.y + 0.04 }
      ];
    } else {
      // フォールバック
      positions = [
        { x: 0.35, y: 0.43 },
        { x: 0.65, y: 0.43 }
      ];
    }

    ctx.strokeStyle = getColorForScore(score);
    ctx.fillStyle = getColorForScore(score, 0.2);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    positions.forEach((pos) => {
      const centerX = pos.x * canvas.width;
      const centerY = pos.y * canvas.height;
      
      // 複数の曲線でクマを表現
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        
        const offset = i * canvas.height * 0.005;
        const startX = centerX - canvas.width * 0.05;
        const endX = centerX + canvas.width * 0.05;
        const startY = centerY + offset;
        const endY = centerY + offset;
        const controlY = centerY + canvas.height * 0.025 + offset;
        
        ctx.lineWidth = 3 - i;
        ctx.strokeStyle = getColorForScore(score, 0.7 - i * 0.2);
        
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(centerX, controlY, endX, endY);
        ctx.stroke();
      }
      
      // クマのエリアをグラデーションで塗りつぶし
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY + canvas.height * 0.02, canvas.width * 0.06);
      gradient.addColorStop(0, getColorForScore(score, 0.4));
      gradient.addColorStop(0.7, getColorForScore(score, 0.2));
      gradient.addColorStop(1, getColorForScore(score, 0));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - canvas.width * 0.06, centerY, canvas.width * 0.12, canvas.height * 0.04);
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

  // 潤いのヒートマップ（完全版）
  const drawMoistureHeatmap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const moistureScore = scores.moisture;
    
    ctx.save();
    
    // 全体的なヒートマップを作成
    const gridSize = 15; // グリッドサイズ
    const dotSize = 8;
    
    // 顔の中心とサイズを計算
    const faceCenterX = canvas.width * 0.5;
    const faceCenterY = canvas.height * 0.4;
    const faceWidth = canvas.width * 0.35;
    const faceHeight = canvas.height * 0.45;
    
    // ブレンドモードを設定
    ctx.globalCompositeOperation = 'multiply';
    
    // グリッドパターンで描画
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = canvas.height * 0.15; y < canvas.height * 0.75; y += gridSize) {
        // 顔の中心からの距離を計算
        const distX = Math.abs(x - faceCenterX) / faceWidth;
        const distY = Math.abs(y - faceCenterY) / faceHeight;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        // 顔の範囲内のみ描画
        if (dist < 1.2) {
          const intensity = 1 - (dist / 1.2);
          const size = dotSize * (0.5 + intensity * 0.5);
          const opacity = intensity * 0.7;
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          
          if (moistureScore >= 4) {
            // 潤いが高い - 緑系
            gradient.addColorStop(0, `rgba(76, 175, 80, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(129, 199, 132, ${opacity * 0.7})`);
            gradient.addColorStop(1, 'rgba(129, 199, 132, 0)');
          } else if (moistureScore >= 3) {
            // 普通 - 黄緑系
            gradient.addColorStop(0, `rgba(255, 235, 59, ${opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 193, 7, ${opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
          } else {
            // 乾燥 - オレンジ〜赤系
            gradient.addColorStop(0, `rgba(255, 87, 34, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(255, 152, 0, ${opacity * 0.7})`);
            gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
          }
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    
    // 元のブレンドモードに戻す
    ctx.globalCompositeOperation = 'source-over';
    
    // 特に乾燥している部分に線を追加（乾燥スコアが低い場合）
    if (moistureScore <= 2) {
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.3)';
      ctx.lineWidth = 1;
      
      // ランダムな乾燥線
      for (let i = 0; i < 20; i++) {
        const startX = faceCenterX + (Math.random() - 0.5) * faceWidth * 2;
        const startY = faceCenterY + (Math.random() - 0.5) * faceHeight * 2;
        const length = 10 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  };

  // くすみのヒートマップ（完全版）
  const drawDullnessHeatmap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const dullnessScore = scores.dullness;
    
    ctx.save();
    
    // ベースのくすみオーバーレイ
    const baseOverlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    if (dullnessScore <= 2) {
      // くすみがひどい
      baseOverlay.addColorStop(0, 'rgba(101, 67, 33, 0.3)');
      baseOverlay.addColorStop(0.5, 'rgba(139, 69, 19, 0.35)');
      baseOverlay.addColorStop(1, 'rgba(101, 67, 33, 0.3)');
    } else if (dullnessScore <= 3) {
      // 普通
      baseOverlay.addColorStop(0, 'rgba(160, 82, 45, 0.2)');
      baseOverlay.addColorStop(0.5, 'rgba(139, 69, 19, 0.15)');
      baseOverlay.addColorStop(1, 'rgba(160, 82, 45, 0.2)');
    } else {
      // くすみが少ない
      baseOverlay.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      baseOverlay.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    }
    
    ctx.fillStyle = baseOverlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // くすみスポットの表示
    const spotCount = dullnessScore <= 2 ? 50 : dullnessScore <= 3 ? 30 : 15;
    
    for (let i = 0; i < spotCount; i++) {
      const x = canvas.width * 0.15 + Math.random() * canvas.width * 0.7;
      const y = canvas.height * 0.15 + Math.random() * canvas.height * 0.6;
      const size = 10 + Math.random() * 25;
      
      const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      
      if (dullnessScore <= 2) {
        spotGradient.addColorStop(0, 'rgba(139, 69, 19, 0.5)');
        spotGradient.addColorStop(0.5, 'rgba(101, 67, 33, 0.3)');
        spotGradient.addColorStop(1, 'rgba(101, 67, 33, 0)');
      } else if (dullnessScore <= 3) {
        spotGradient.addColorStop(0, 'rgba(160, 82, 45, 0.4)');
        spotGradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.2)');
        spotGradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
      } else {
        spotGradient.addColorStop(0, 'rgba(255, 248, 220, 0.3)');
        spotGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
      }
      
      ctx.fillStyle = spotGradient;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.2, size * 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 細かいテクスチャを追加
    if (dullnessScore <= 3) {
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(101, 67, 33, 0.5)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
    
    ctx.restore();
  };
  
  // ハリのヒートマップ（完全版）
  const drawFirmnessHeatmap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const firmnessScore = scores.firmness;
    
    ctx.save();
    
    // ハリ不足の主要エリア
    const problemAreas = [
      { x: 0.35, y: 0.42, size: 0.12, name: '左目下' },
      { x: 0.65, y: 0.42, size: 0.12, name: '右目下' },
      { x: 0.5, y: 0.58, size: 0.15, name: '口元' },
      { x: 0.3, y: 0.48, size: 0.1, name: '左頰' },
      { x: 0.7, y: 0.48, size: 0.1, name: '右頰' },
      { x: 0.5, y: 0.25, size: 0.2, name: '額' },
    ];
    
    // ブレンドモードを設定
    ctx.globalCompositeOperation = 'multiply';
    
    problemAreas.forEach(area => {
      const gradient = ctx.createRadialGradient(
        area.x * canvas.width,
        area.y * canvas.height,
        0,
        area.x * canvas.width,
        area.y * canvas.height,
        area.size * canvas.width
      );
      
      if (firmnessScore >= 4) {
        // ハリがある - 明るいピンク
        gradient.addColorStop(0, 'rgba(255, 182, 193, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 192, 203, 0)');
      } else if (firmnessScore >= 3) {
        // 普通
        gradient.addColorStop(0, 'rgba(205, 92, 92, 0.4)');
        gradient.addColorStop(0.5, 'rgba(205, 92, 92, 0.2)');
        gradient.addColorStop(1, 'rgba(205, 92, 92, 0)');
      } else {
        // ハリがない - 暗い紫
        gradient.addColorStop(0, 'rgba(147, 112, 219, 0.5)');
        gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.3)');
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    ctx.globalCompositeOperation = 'source-over';
    
    // たるみ線の表現
    if (firmnessScore <= 3) {
      ctx.strokeStyle = firmnessScore <= 2 
        ? 'rgba(147, 112, 219, 0.4)' 
        : 'rgba(205, 92, 92, 0.3)';
      ctx.lineWidth = 2;
      
      // ほうれい線
      [
        { start: { x: 0.45, y: 0.45 }, end: { x: 0.42, y: 0.58 } },
        { start: { x: 0.55, y: 0.45 }, end: { x: 0.58, y: 0.58 } },
      ].forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.start.x * canvas.width, line.start.y * canvas.height);
        ctx.quadraticCurveTo(
          (line.start.x + line.end.x) / 2 * canvas.width,
          ((line.start.y + line.end.y) / 2 + 0.02) * canvas.height,
          line.end.x * canvas.width,
          line.end.y * canvas.height
        );
        ctx.stroke();
      });
      
      // 目元のたるみ線
      const eyeLines = [
        { center: { x: 0.35, y: 0.44 }, count: 4 },
        { center: { x: 0.65, y: 0.44 }, count: 4 },
      ];
      
      eyeLines.forEach(eye => {
        for (let i = 0; i < eye.count; i++) {
          const offset = i * 0.003;
          ctx.beginPath();
          ctx.moveTo(
            (eye.center.x - 0.04) * canvas.width,
            (eye.center.y + offset) * canvas.height
          );
          ctx.quadraticCurveTo(
            eye.center.x * canvas.width,
            (eye.center.y + offset + 0.01) * canvas.height,
            (eye.center.x + 0.04) * canvas.width,
            (eye.center.y + offset) * canvas.height
          );
          ctx.stroke();
        }
      });
    }
    
    ctx.restore();
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