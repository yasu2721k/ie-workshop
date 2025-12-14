'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  DiagnosisType,
  DiagnosisState,
  DiagnosisContextType,
  DiagnosisResult,
  AnalysisData,
  ImageDimensions,
  EyePositions,
} from '@/types/diagnosis';

const initialState: DiagnosisState = {
  capturedImage: null,
  imageDimensions: null,
  capturedEyePositions: null,
  diagnosisResult: null,
  diagnosisType: null,
  score: 0,
  analysisData: null,
  forceType: null,
  isAnalyzing: false,
  error: null,
};

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagnosisState>(initialState);

  const setCapturedImage = useCallback((image: string, dimensions?: ImageDimensions, eyePositions?: EyePositions) => {
    setState((prev) => ({
      ...prev,
      capturedImage: image,
      imageDimensions: dimensions || null,
      capturedEyePositions: eyePositions || null,
    }));
  }, []);

  const setDiagnosisResult = useCallback((result: DiagnosisResult) => {
    setState((prev) => ({
      ...prev,
      diagnosisResult: result,
      diagnosisType: result.primaryConcern === 'darkCircles' ? 'dark_circles' : 'wrinkles',
      score: result.overallScore,
      isAnalyzing: false,
    }));
  }, []);

  const setAnalysisData = useCallback((data: AnalysisData) => {
    setState((prev) => ({ ...prev, analysisData: data }));
  }, []);

  const setForceType = useCallback((type: DiagnosisType) => {
    setState((prev) => ({ ...prev, forceType: type }));
  }, []);

  const setIsAnalyzing = useCallback((isAnalyzing: boolean) => {
    setState((prev) => ({ ...prev, isAnalyzing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isAnalyzing: false }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <DiagnosisContext.Provider
      value={{
        ...state,
        setCapturedImage,
        setDiagnosisResult,
        setAnalysisData,
        setForceType,
        setIsAnalyzing,
        setError,
        reset,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis(): DiagnosisContextType {
  const context = useContext(DiagnosisContext);
  if (context === undefined) {
    throw new Error('useDiagnosis must be used within a DiagnosisProvider');
  }
  return context;
}
