'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { DiagnosisScores } from '@/types/diagnosis';

interface FaceMap3DProps {
  scores: DiagnosisScores;
  language: 'ja' | 'ko';
}

interface EyeAreaMeshProps {
  scores: DiagnosisScores;
}

// 目元エリアの3Dメッシュ
function EyeAreaMesh({ scores }: EyeAreaMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // スコアに基づいて色を計算
  const getColorForScore = (score: number): THREE.Color => {
    // スコアが低い（問題あり）= 赤、高い（良好）= 緑
    if (score <= 2) return new THREE.Color(0xE57373); // 赤
    if (score <= 3) return new THREE.Color(0xFFB74D); // オレンジ
    if (score <= 4) return new THREE.Color(0x81C784); // 緑
    return new THREE.Color(0x4FC3F7); // 青（最良）
  };

  // 各部位のカラーマップを作成
  const vertexColors = useMemo(() => {
    const colors: number[] = [];

    // 64x64グリッドの頂点ごとに色を設定
    const segments = 64;
    for (let y = 0; y <= segments; y++) {
      for (let x = 0; x <= segments; x++) {
        const u = x / segments;
        const v = y / segments;

        let color: THREE.Color;

        // 左目エリア (u: 0.15-0.4, v: 0.3-0.7)
        if (u >= 0.1 && u <= 0.4 && v >= 0.25 && v <= 0.75) {
          // 目の下エリア（クマ）
          if (v >= 0.5) {
            color = getColorForScore(scores.darkCircles);
          }
          // 目尻エリア（シワ）
          else if (u <= 0.2) {
            color = getColorForScore(scores.wrinkles);
          }
          // 目の周り（ハリ）
          else {
            color = getColorForScore(scores.firmness);
          }
        }
        // 右目エリア (u: 0.6-0.85, v: 0.3-0.7)
        else if (u >= 0.6 && u <= 0.9 && v >= 0.25 && v <= 0.75) {
          // 目の下エリア（クマ）
          if (v >= 0.5) {
            color = getColorForScore(scores.darkCircles);
          }
          // 目尻エリア（シワ）
          else if (u >= 0.8) {
            color = getColorForScore(scores.wrinkles);
          }
          // 目の周り（ハリ）
          else {
            color = getColorForScore(scores.firmness);
          }
        }
        // 顔全体（くすみ・潤い）
        else {
          const avgScore = (scores.dullness + scores.moisture) / 2;
          color = getColorForScore(avgScore);
          // 透明度を下げて背景っぽく
          color.multiplyScalar(0.6);
        }

        colors.push(color.r, color.g, color.b);
      }
    }

    return new Float32Array(colors);
  }, [scores]);

  // ゆっくり回転
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  // 目元形状のジオメトリを作成
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(3, 2, 64, 64);

    // 頂点に色を設定
    geo.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));

    // 顔のカーブを追加
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // 顔のような緩やかなカーブ
      const z = -0.15 * (x * x + y * y * 0.5);

      // 目のくぼみを追加
      const leftEyeX = -0.75;
      const rightEyeX = 0.75;
      const eyeY = 0.1;

      const distToLeftEye = Math.sqrt((x - leftEyeX) ** 2 + (y - eyeY) ** 2);
      const distToRightEye = Math.sqrt((x - rightEyeX) ** 2 + (y - eyeY) ** 2);

      const leftEyeDepth = Math.max(0, 0.15 - distToLeftEye * 0.3) * 0.8;
      const rightEyeDepth = Math.max(0, 0.15 - distToRightEye * 0.3) * 0.8;

      positions.setZ(i, z - leftEyeDepth - rightEyeDepth);
    }

    geo.computeVertexNormals();
    return geo;
  }, [vertexColors]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// 凡例コンポーネント
function Legend({ language }: { language: 'ja' | 'ko' }) {
  const items = [
    { color: '#E57373', label: language === 'ja' ? '要改善' : '개선필요' },
    { color: '#FFB74D', label: language === 'ja' ? '注意' : '주의' },
    { color: '#81C784', label: language === 'ja' ? '良好' : '양호' },
    { color: '#4FC3F7', label: language === 'ja' ? '優秀' : '우수' },
  ];

  return (
    <div className="flex justify-center gap-4 mt-3">
      {items.map((item) => (
        <div key={item.color} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-[#666]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// 部位ラベル
function AreaLabels({ scores, language }: FaceMap3DProps) {
  const getLabel = (key: keyof DiagnosisScores) => {
    const labels = {
      darkCircles: language === 'ja' ? 'クマ' : '다크서클',
      wrinkles: language === 'ja' ? 'シワ' : '주름',
      firmness: language === 'ja' ? 'ハリ' : '탄력',
      dullness: language === 'ja' ? 'くすみ' : '칙칙함',
      moisture: language === 'ja' ? '潤い' : '수분',
    };
    return labels[key];
  };

  const getColorClass = (score: number) => {
    if (score <= 2) return 'bg-red-100 text-red-700';
    if (score <= 3) return 'bg-orange-100 text-orange-700';
    if (score <= 4) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  // 最も問題のある部位を特定
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3);

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {sortedScores.map(([key, score]) => (
        <span
          key={key}
          className={`text-xs px-2 py-1 rounded-full ${getColorClass(score)}`}
        >
          {getLabel(key as keyof DiagnosisScores)}: {score}
        </span>
      ))}
    </div>
  );
}

export default function FaceMap3D({ scores, language }: FaceMap3DProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">
        {language === 'ja' ? '3Dフェイスマップ' : '3D 페이스맵'}
      </h2>

      <div className="h-48 bg-gradient-to-b from-[#FAFAFA] to-[#F0F0F0] rounded-xl overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 50 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, 5]} intensity={0.4} />
          <EyeAreaMesh scores={scores} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />
        </Canvas>
      </div>

      <AreaLabels scores={scores} language={language} />
      <Legend language={language} />

      <p className="text-xs text-[#999] text-center mt-3">
        {language === 'ja'
          ? '※ドラッグで回転できます'
          : '※드래그하여 회전할 수 있습니다'}
      </p>
    </motion.div>
  );
}
