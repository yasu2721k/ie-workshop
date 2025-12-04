// src/hooks/useFaceMesh.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initFaceMesh } from '@/lib/mediapipe';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FaceMeshResult {
  landmarks: Landmark[] | null;
  isDetected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface FaceMeshInstance {
  onResults: (callback: (results: { multiFaceLandmarks?: Landmark[][] }) => void) => void;
  send: (data: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

export const useFaceMesh = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const [result, setResult] = useState<FaceMeshResult>({
    landmarks: null,
    isDetected: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const initializeFaceMesh = async () => {
      try {
        const faceMesh = await initFaceMesh();
        if (!faceMesh || !mounted) return;

        faceMeshRef.current = faceMesh as FaceMeshInstance;

        faceMesh.onResults((results: { multiFaceLandmarks?: Landmark[][] }) => {
          if (!mounted) return;

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            setResult({
              landmarks: results.multiFaceLandmarks[0],
              isDetected: true,
              isLoading: false,
              error: null,
            });
          } else {
            setResult(prev => ({
              ...prev,
              landmarks: null,
              isDetected: false,
            }));
          }
        });

        setResult(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        if (mounted) {
          console.error('MediaPipe initialization error:', error);
          setResult(prev => ({
            ...prev,
            isLoading: false,
            error: 'MediaPipe の初期化に失敗しました',
          }));
        }
      }
    };

    initializeFaceMesh();

    return () => {
      mounted = false;
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);

  const processFrame = useCallback(async () => {
    if (faceMeshRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      try {
        await faceMeshRef.current.send({ image: videoRef.current });
      } catch (error) {
        // エラーは無視（フレームドロップなど）
      }
    }
  }, [videoRef]);

  return { ...result, processFrame };
};
