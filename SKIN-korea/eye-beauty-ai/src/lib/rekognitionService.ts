import {
  RekognitionClient,
  DetectFacesCommand,
  Attribute,
} from '@aws-sdk/client-rekognition';

// AWS Rekognition クライアント初期化
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface RekognitionFaceData {
  // 推定年齢
  ageRange: {
    low: number;
    high: number;
    estimated: number;
  };
  // 感情分析
  emotions: {
    calm: number;      // 穏やか
    sad: number;       // 悲しみ
    angry: number;     // 怒り
    confused: number;  // 困惑
    disgusted: number; // 嫌悪
    surprised: number; // 驚き
    happy: number;     // 幸せ
    fear: number;      // 恐怖
  };
  // 目の状態
  eyesOpen: {
    value: boolean;
    confidence: number;
  };
  // 顔の品質
  quality: {
    brightness: number;  // 明るさ (0-100)
    sharpness: number;   // シャープネス (0-100)
  };
  // 顔の位置・サイズ
  boundingBox: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  // 顔のランドマーク
  landmarks: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    nose?: { x: number; y: number };
    mouthLeft?: { x: number; y: number };
    mouthRight?: { x: number; y: number };
    leftEyeBrowLeft?: { x: number; y: number };
    leftEyeBrowRight?: { x: number; y: number };
    rightEyeBrowLeft?: { x: number; y: number };
    rightEyeBrowRight?: { x: number; y: number };
    upperJawlineLeft?: { x: number; y: number };
    midJawlineLeft?: { x: number; y: number };
  };
  // 信頼度
  confidence: number;
}

export interface RekognitionAnalysisResult {
  success: boolean;
  faceData?: RekognitionFaceData;
  error?: string;
}

/**
 * AWS Rekognitionで顔を分析
 * @param base64Image Base64エンコードされた画像（data:image/jpeg;base64,を除く）
 */
export async function analyzeWithRekognition(
  base64Image: string
): Promise<RekognitionAnalysisResult> {
  try {
    // Base64をバイナリに変換
    const imageBytes = Buffer.from(base64Image, 'base64');

    // Rekognition DetectFaces API呼び出し
    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      Attributes: [Attribute.ALL], // すべての属性を取得
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return {
        success: false,
        error: '顔が検出されませんでした',
      };
    }

    // 最初の顔（最大の顔）を使用
    const face = response.FaceDetails[0];

    // 感情データを整理
    const emotionsMap: RekognitionFaceData['emotions'] = {
      calm: 0,
      sad: 0,
      angry: 0,
      confused: 0,
      disgusted: 0,
      surprised: 0,
      happy: 0,
      fear: 0,
    };

    if (face.Emotions) {
      for (const emotion of face.Emotions) {
        const type = emotion.Type?.toLowerCase() as keyof typeof emotionsMap;
        if (type && type in emotionsMap) {
          emotionsMap[type] = emotion.Confidence || 0;
        }
      }
    }

    // ランドマークを整理
    const landmarksMap: RekognitionFaceData['landmarks'] = {};
    if (face.Landmarks) {
      for (const landmark of face.Landmarks) {
        const type = landmark.Type;
        if (type && landmark.X !== undefined && landmark.Y !== undefined) {
          const key = type.charAt(0).toLowerCase() + type.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          (landmarksMap as Record<string, { x: number; y: number }>)[key] = {
            x: landmark.X,
            y: landmark.Y,
          };
        }
      }
    }

    const faceData: RekognitionFaceData = {
      ageRange: {
        low: face.AgeRange?.Low || 0,
        high: face.AgeRange?.High || 0,
        estimated: Math.round(((face.AgeRange?.Low || 0) + (face.AgeRange?.High || 0)) / 2),
      },
      emotions: emotionsMap,
      eyesOpen: {
        value: face.EyesOpen?.Value || false,
        confidence: face.EyesOpen?.Confidence || 0,
      },
      quality: {
        brightness: face.Quality?.Brightness || 0,
        sharpness: face.Quality?.Sharpness || 0,
      },
      boundingBox: {
        width: face.BoundingBox?.Width || 0,
        height: face.BoundingBox?.Height || 0,
        left: face.BoundingBox?.Left || 0,
        top: face.BoundingBox?.Top || 0,
      },
      landmarks: landmarksMap,
      confidence: face.Confidence || 0,
    };

    return {
      success: true,
      faceData,
    };
  } catch (error) {
    console.error('Rekognition analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Rekognitionデータから美容分析用の補助データを生成
 */
export function generateBeautyMetrics(faceData: RekognitionFaceData): {
  fatigueScore: number;      // 疲労感スコア (0-100, 高いほど疲れている)
  ageGap: number;            // 実年齢との差（推定用）
  skinBrightness: number;    // 肌の明るさ
  eyeOpenness: number;       // 目の開き具合
  emotionalState: string;    // 主要な感情状態
} {
  // 疲労感スコア計算（悲しみ、困惑、疲れ関連の感情から）
  const fatigueScore = Math.min(100,
    (faceData.emotions.sad * 0.4) +
    (faceData.emotions.confused * 0.3) +
    (100 - faceData.emotions.happy) * 0.2 +
    (100 - faceData.emotions.calm) * 0.1
  );

  // 主要な感情を特定
  const emotionEntries = Object.entries(faceData.emotions) as [keyof typeof faceData.emotions, number][];
  const dominantEmotion = emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b);

  const emotionLabels: Record<string, string> = {
    calm: '穏やか',
    sad: '疲れ気味',
    angry: 'ストレス',
    confused: '困惑',
    disgusted: '不快',
    surprised: '驚き',
    happy: '元気',
    fear: '緊張',
  };

  return {
    fatigueScore: Math.round(fatigueScore),
    ageGap: 0, // 実年齢がないので0
    skinBrightness: Math.round(faceData.quality.brightness),
    eyeOpenness: Math.round(faceData.eyesOpen.confidence),
    emotionalState: emotionLabels[dominantEmotion[0]] || '不明',
  };
}
