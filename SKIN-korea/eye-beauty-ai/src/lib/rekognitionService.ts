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

// 目元診断に必要なデータのみ
export interface RekognitionFaceData {
  // 推定年齢
  ageRange: {
    low: number;
    high: number;
    estimated: number;
  };
  // 顔の品質（目元診断の精度向上に使用）
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
  // 顔のランドマーク（目の位置特定用）
  landmarks: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    leftEyeBrowLeft?: { x: number; y: number };
    leftEyeBrowRight?: { x: number; y: number };
    rightEyeBrowLeft?: { x: number; y: number };
    rightEyeBrowRight?: { x: number; y: number };
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
 * AWS Rekognitionで顔を分析（目元診断用）
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
      Attributes: [Attribute.ALL],
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

    // 目元関連のランドマークのみ抽出
    const landmarksMap: RekognitionFaceData['landmarks'] = {};
    if (face.Landmarks) {
      for (const landmark of face.Landmarks) {
        const type = landmark.Type;
        if (type && landmark.X !== undefined && landmark.Y !== undefined) {
          // 目と眉のランドマークのみ抽出
          const eyeRelatedTypes = [
            'eyeLeft', 'eyeRight',
            'leftEyeBrowLeft', 'leftEyeBrowRight',
            'rightEyeBrowLeft', 'rightEyeBrowRight'
          ];
          const key = type.charAt(0).toLowerCase() + type.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          if (eyeRelatedTypes.includes(key) || type.toLowerCase().includes('eye')) {
            (landmarksMap as Record<string, { x: number; y: number }>)[key] = {
              x: landmark.X,
              y: landmark.Y,
            };
          }
        }
      }
    }

    const faceData: RekognitionFaceData = {
      ageRange: {
        low: face.AgeRange?.Low || 0,
        high: face.AgeRange?.High || 0,
        estimated: Math.round(((face.AgeRange?.Low || 0) + (face.AgeRange?.High || 0)) / 2),
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
