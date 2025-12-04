'use client';

import { useState, useCallback } from 'react';
import { loadFaceApiModels, faceapi } from '@/lib/faceapi';
import type { FaceLandmarks68 } from 'face-api.js';

interface FaceDetectionResult {
  landmarks: FaceLandmarks68;
  imageData: ImageData;
}

interface UseFaceDetectionReturn {
  isLoading: boolean;
  error: string | null;
  detectFace: (imageElement: HTMLImageElement | HTMLCanvasElement) => Promise<FaceDetectionResult | null>;
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Load models if not already loaded
      await loadFaceApiModels();

      // Detect face with landmarks
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      console.log('Face detection result:', detection);

      if (!detection) {
        console.error('No face detected in image');
        setError('NO_FACE_DETECTED');
        setIsLoading(false);
        return null;
      }

      // Log landmark positions for debugging
      const positions = detection.landmarks.positions;
      console.log('Left eye landmarks (36-41):', positions.slice(36, 42));
      console.log('Right eye landmarks (42-47):', positions.slice(42, 48));

      // Get image data from canvas
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width || (imageElement as HTMLCanvasElement).width;
      canvas.height = imageElement.height || (imageElement as HTMLCanvasElement).height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('CANVAS_ERROR');
        setIsLoading(false);
        return null;
      }

      ctx.drawImage(imageElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setIsLoading(false);
      return {
        landmarks: detection.landmarks,
        imageData,
      };
    } catch (err) {
      console.error('Face detection error:', err);
      setError('DETECTION_FAILED');
      setIsLoading(false);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    detectFace,
  };
}
