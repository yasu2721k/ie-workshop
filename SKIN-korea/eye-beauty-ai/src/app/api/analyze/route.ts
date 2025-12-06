import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateEyeAge } from '@/lib/eyeAgeCalculator';
import { DiagnosisScores } from '@/types/diagnosis';

// Gemini 3 Pro Preview 初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ANALYSIS_PROMPT = `あなたは目元専門のスキンケアアドバイザーです。この顔写真を詳しく観察し、目元の状態を分析してください。

【重要】写真をよく見て、実際に見える特徴に基づいて判断してください。例をコピーせず、この人固有の特徴を分析してください。

【評価項目】各項目1-5点（5が最良、1が最も問題あり）
1. darkCircles（クマ）: 目の下の色味を確認。青み/茶色/影がないか
2. wrinkles（シワ）: 目尻・目の下の細かい線を確認
3. firmness（ハリ）: 目の下のたるみ、皮膚の張りを確認
4. dullness（くすみ）: 目周りの肌の透明感・明るさを確認
5. moisture（潤い）: 肌のキメ、乾燥による小ジワがないか確認

【クマの種類判定】実際の色味で判断
- blue: 青紫っぽい色（血行不良）
- brown: 茶色っぽい色（色素沈着）
- black: 影のような黒さ（たるみによる）
- red: 赤みがある（眼輪筋透過）
- mixed: 複数の色が混在
- none: クマが見られない

【出力形式】以下のJSON形式のみ出力（説明文不要）:
{
  "observation": {
    "darkCircleType": "種類を入力",
    "darkCircleTypeJa": "日本語で種類名",
    "mainCause": "見た目から推測される原因",
    "subCause": "副次的要因またはnull",
    "skinCondition": "肌全体の状態"
  },
  "scores": {
    "darkCircles": 1-5の整数,
    "wrinkles": 1-5の整数,
    "firmness": 1-5の整数,
    "dullness": 1-5の整数,
    "moisture": 1-5の整数
  },
  "detailedAnalysis": {
    "darkCircles": "クマについての具体的な観察結果",
    "wrinkles": "シワについての具体的な観察結果",
    "firmness": "ハリについての具体的な観察結果"
  },
  "analysis": "この人の目元の総合評価（50文字程度）",
  "primaryConcern": "最も改善が必要な項目のキー名",
  "recommendation": "この人に合ったケアのアドバイス"
}`;


export async function POST(request: NextRequest) {
  try {
    const { image, eyePositions } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Base64データの整形
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Gemini モデルを使用（フォールバック対応）
    // gemini-3-pro-preview が過負荷の場合は gemini-2.0-flash を使用
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    // 画像とプロンプトを送信
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
      { text: ANALYSIS_PROMPT },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text);

    // JSONを抽出（```json ... ``` で囲まれている場合に対応）
    let jsonString = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else {
      // ```なしのJSONを探す
      const plainJsonMatch = text.match(/\{[\s\S]*\}/);
      if (plainJsonMatch) {
        jsonString = plainJsonMatch[0];
      }
    }

    // JSONパース
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text);
      console.error('Extracted JSON string:', jsonString);
      return NextResponse.json(
        { error: 'Invalid AI response format', raw: text },
        { status: 500 }
      );
    }

    // スコアの検証と修正
    const scores: DiagnosisScores = analysisResult.scores || {};
    const validScoreKeys = ['darkCircles', 'wrinkles', 'firmness', 'dullness', 'moisture'];

    for (const key of validScoreKeys) {
      const score = scores[key as keyof DiagnosisScores];
      if (typeof score !== 'number' || score < 1 || score > 5 || !Number.isInteger(score)) {
        console.warn(`Invalid score for ${key}:`, score, '- setting to 3');
        scores[key as keyof DiagnosisScores] = 3;
      }
    }

    // 目元年齢を算出
    const eyeAge = calculateEyeAge(scores);

    // 総合スコア算出（各軸の平均 × 20）
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    const overallScore = Math.round((sum / 5) * 20);

    // primaryConcernの検証
    let primaryConcern = analysisResult.primaryConcern;
    if (!validScoreKeys.includes(primaryConcern)) {
      // 最低スコアの項目を特定
      primaryConcern = validScoreKeys.reduce((min, key) =>
        scores[key as keyof DiagnosisScores] < scores[min as keyof DiagnosisScores] ? key : min
      );
    }

    // レスポンス構築
    const diagnosisResult = {
      scores,
      eyeAge,
      overallScore,
      primaryConcern,
      recommendation: analysisResult.recommendation || '目元専用のケアをおすすめします',
      analysis: analysisResult.analysis || '',
      observation: analysisResult.observation || null,
      detailedAnalysis: analysisResult.detailedAnalysis || null,
      eyePositions: eyePositions || null,
    };

    return NextResponse.json(diagnosisResult);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
