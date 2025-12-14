export type DiagnosisType = 'dark_circles' | 'wrinkles' | null;

export interface EyePosition {
  x: number;  // 0-1 (パーセンテージ)
  y: number;  // 0-1 (パーセンテージ)
}

export interface EyePositions {
  leftEye: EyePosition;
  rightEye: EyePosition;
  leftUnderEye?: EyePosition[];
  rightUnderEye?: EyePosition[];
}

export interface DiagnosisScores {
  darkCircles: number;   // クマ: 1-5
  wrinkles: number;      // シワ: 1-5
  firmness: number;      // ハリ: 1-5
  dullness: number;      // くすみ: 1-5
  moisture: number;      // 潤い: 1-5
}

export interface EyeAge {
  estimatedAge: number;      // 推定目元年齢
  difference: number;        // 実年齢との差（+なら老け、-なら若い）
  message: string;           // 表示メッセージ
}

export interface DarkCircleObservation {
  darkCircleType: 'blue' | 'brown' | 'black' | 'red' | 'mixed' | 'none';
  darkCircleTypeJa: string;
  mainCause: string;
  subCause: string | null;
  skinCondition: string;
}

export interface DetailedAnalysis {
  darkCircles: string;
  wrinkles: string;
  firmness: string;
}

export interface SkinToneAnalysis {
  blueness: number;    // 青み成分（青クマ度）0-100
  brownness: number;   // 茶み成分（茶クマ度）0-100
  yellowness: number;  // 黄ぐすみ度 0-100
  redness: number;     // 赤み度 0-100
  clarity: number;     // 透明感スコア 0-100
  brightness: number;  // 肌の明るさ 0-100
}

export interface DiagnosisResult {
  scores: DiagnosisScores;
  eyeAge: EyeAge;
  overallScore: number;      // 総合スコア: 0-100
  primaryConcern: keyof DiagnosisScores;  // 最も気になる項目
  recommendation: string;    // おすすめケアの方向性
  analysis?: string;         // 総評
  observation?: DarkCircleObservation | null;
  detailedAnalysis?: DetailedAnalysis | null;
  eyePositions?: EyePositions;
  skinToneAnalysis?: SkinToneAnalysis | null;  // 肌トーン分析
}

export interface AnalysisData {
  // 画像から取得した生データ
  underEyeBrightness?: number;    // 目の下の明るさ (0-255)
  eyeCornerContrast?: number;     // 目尻のコントラスト
  skinTextureScore?: number;      // 肌のキメスコア
  // 目の位置（MediaPipeから）
  eyePositions?: EyePositions;
  // 旧互換用
  brightness?: number;
  contrast?: number;
  landmarks?: unknown;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DiagnosisState {
  // 撮影画像
  capturedImage: string | null;
  imageDimensions: ImageDimensions | null;
  capturedEyePositions: EyePositions | null;

  // 解析結果（新）
  diagnosisResult: DiagnosisResult | null;

  // 解析結果（旧・互換用）
  diagnosisType: DiagnosisType;
  score: number; // 0-100

  // 解析データ（詳細）
  analysisData: AnalysisData | null;

  // 強制判定フラグ（デバッグ用）
  forceType: DiagnosisType;

  // ステータス
  isAnalyzing: boolean;
  error: string | null;
}

export interface DiagnosisContextType extends DiagnosisState {
  setCapturedImage: (image: string, dimensions?: ImageDimensions, eyePositions?: EyePositions) => void;
  setDiagnosisResult: (result: DiagnosisResult) => void;
  setAnalysisData: (data: AnalysisData) => void;
  setForceType: (type: DiagnosisType) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
