import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { DiagnosisScores, DiagnosisResult, EyePositions } from '@/types/diagnosis';
import { calculateEyeAge, calculateOverallScore, findPrimaryConcern } from '@/lib/eyeAgeCalculator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalysisResponse {
  scores: DiagnosisScores;
  primaryConcern: keyof DiagnosisScores;
  analysis: string;
  recommendation: string;
}

const ANALYSIS_PROMPT = `
あなたは韓国コスメに精通したスキンケアの専門家です。
提供された顔写真から、目元の状態を詳細に分析してください。

## 分析項目（各1-5で評価、5が最も良い状態）

1. **クマ (darkCircles)**: 目の下の色素沈着や暗さ
   - 5: クマなし、明るい目元
   - 4: ごく軽いクマ
   - 3: 軽度のクマあり
   - 2: 明らかなクマ
   - 1: 顕著なクマ、青クマ・茶クマが目立つ

2. **シワ (wrinkles)**: 目尻や目の下の細かい線
   - 5: シワなし、なめらか
   - 4: ごく軽い線がある程度
   - 3: 笑うと軽く線が出る程度
   - 2: 静止時でも線が見える
   - 1: 常にシワが目立つ

3. **ハリ (firmness)**: 目周りの肌のハリ・たるみ
   - 5: ピンとハリがある
   - 4: ややハリがある
   - 3: やや緩みが見られる
   - 2: 緩みが目立つ
   - 1: 明らかなたるみ

4. **くすみ (dullness)**: 目周りの透明感
   - 5: 透明感あり、明るい
   - 4: やや明るい
   - 3: やや暗い印象
   - 2: くすみが気になる
   - 1: 全体的にくすんでいる

5. **潤い (moisture)**: 乾燥状態
   - 5: しっとり潤っている
   - 4: やや潤いあり
   - 3: やや乾燥気味
   - 2: 乾燥が目立つ
   - 1: 乾燥による小ジワ・粉吹き

## 出力形式（JSON）

以下の形式で厳密に出力してください。説明文は不要です。

{
  "scores": {
    "darkCircles": <1-5>,
    "wrinkles": <1-5>,
    "firmness": <1-5>,
    "dullness": <1-5>,
    "moisture": <1-5>
  },
  "primaryConcern": "<最も改善が必要な項目のキー>",
  "analysis": "<50文字以内の総評>",
  "recommendation": "<おすすめケアの方向性を30文字以内で>"
}

重要:
- 顔が検出できない場合は {"error": "NO_FACE_DETECTED"} を返してください
- 必ず有効なJSONのみを返してください（\`\`\`で囲まないでください）
- スコアは必ず1-5の整数で返してください
`;

export async function POST(request: NextRequest) {
  try {
    const { image, imageWidth, imageHeight, eyePositions } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response - remove markdown code blocks if present
    let jsonText = textContent.text.trim();

    // Remove ```json ... ``` wrapper if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let analysisResult: AnalysisResponse;

    try {
      analysisResult = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', jsonText);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Check for error response
    if ('error' in analysisResult) {
      return NextResponse.json(
        { error: (analysisResult as { error: string }).error },
        { status: 400 }
      );
    }

    // 目元年齢を算出
    const eyeAge = calculateEyeAge(analysisResult.scores);

    // 総合スコア算出（各軸の平均 × 20）
    const overallScore = calculateOverallScore(analysisResult.scores);

    // 最も改善が必要な項目を特定（APIからの返却値を使うか、計算で求める）
    const primaryConcern = analysisResult.primaryConcern || findPrimaryConcern(analysisResult.scores);

    // 結果を構築
    const result: DiagnosisResult = {
      scores: analysisResult.scores,
      eyeAge,
      overallScore,
      primaryConcern,
      recommendation: analysisResult.recommendation,
      analysis: analysisResult.analysis,
      eyePositions: eyePositions as EyePositions | undefined,
    };

    console.log('Claude Vision result (5-axis):', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
