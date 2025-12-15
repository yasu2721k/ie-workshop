import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateEyeAge } from '@/lib/eyeAgeCalculator';
import { DiagnosisScores } from '@/types/diagnosis';
import { analyzeWithRekognition, RekognitionFaceData } from '@/lib/rekognitionService';

// Gemini 3 Pro Preview 初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 目元診断用データ（Rekognitionから抽出）
interface EyeAnalysisData {
  estimatedAge: number;
  skinBrightness: number;
  imageQuality: number;
}

// プロンプト生成関数（目元診断特化）
function generatePromptJA(eyeData?: EyeAnalysisData) {
  let objectiveData = '';

  if (eyeData) {
    objectiveData = `
【参考データ】
- 推定年齢: ${eyeData.estimatedAge}歳
- 肌の明るさ: ${eyeData.skinBrightness}/100
- 画像品質: ${eyeData.imageQuality}/100

上記を参考に、目元の状態を厳格に評価してください。
肌の明るさが低い場合はくすみの評価を厳しくしてください。
`;
  }

  return `あなたは目元の美容状態を分析するAIアドバイザーです。この顔写真から目元の見た目の特徴を詳しく観察してください。

【重要な指示】
- 写真を拡大して目元周辺を詳細に観察すること
- 厳格に評価すること（甘い評価は禁止）
- 実際に見える特徴のみを根拠に判断すること
- 「普通」や「問題なし」に偏らず、細かい特徴も検出すること
- ※これは美容目的の参考情報であり、医療診断ではありません
${objectiveData}
【評価基準 - 厳格に適用】

■ darkCircles（クマ）1-5点
1点: 濃い色素沈着/青紫色が目の下全体に広がっている。一目でクマとわかるレベル
2点: 明確なクマあり。色素沈着または青みが目立つ。化粧でもカバーしにくい
3点: 軽〜中程度のクマ。よく見ると色味の違いがわかる。疲れて見える
4点: わずかなクマ。注意して見ないとわからない程度
5点: クマなし。目の下が均一で明るい肌色

■ wrinkles（シワ）1-5点
1点: 深いシワが複数本。笑っていなくても目尻や目の下に刻まれている
2点: 明確なシワあり。細かい線が目立つ。ちりめんジワが広範囲
3点: 軽度のシワ。表情を作ると線が見える。乾燥小ジワあり
4点: ほぼ目立たない。ごくわずかな細い線のみ
5点: シワなし。滑らかでハリのある肌

■ firmness（ハリ）1-5点
1点: 明確なたるみ。目の下の皮膚がたるんで影ができている
2点: たるみあり。目袋が目立つ。皮膚に弾力がない
3点: やや張りが失われている。軽い目袋あり
4点: ほぼ張りがある。わずかな緩みのみ
5点: 完璧なハリ。皮膚がピンと張っている

■ dullness（くすみ）1-5点
1点: 全体的に暗く、黄ばみや灰色がかった印象。透明感ゼロ
2点: くすみが目立つ。肌が疲れて見える。血色が悪い
3点: 軽度のくすみ。透明感がやや不足
4点: ほぼ明るい。わずかなくすみのみ
5点: 透明感あり。明るく健康的な肌色

■ moisture（潤い）1-5点
1点: 明らかな乾燥。肌がカサカサ、粉吹き、細かいシワが多数
2点: 乾燥気味。キメが粗い。潤い不足が見える
3点: やや乾燥。部分的にキメの乱れあり
4点: ほぼ潤っている。キメが整っている
5点: 十分な潤い。みずみずしくキメ細かい

【クマの種類判定】色味を正確に判断
- blue: 青紫〜青みがかった色（血行不良・静脈透け）
- brown: 茶色〜褐色（色素沈着・メラニン）
- black: 黒っぽい影（たるみ・構造的）
- red: 赤み・ピンク（眼輪筋透け・炎症）
- mixed: 複数の色が混在
- none: クマが見られない

【出力形式】以下のJSON形式のみ出力:
{
  "observation": {
    "darkCircleType": "種類",
    "darkCircleTypeJa": "日本語名（青クマ/茶クマ/黒クマ/赤クマ/混合型/なし）",
    "mainCause": "見た目から推測される主な原因",
    "subCause": "副次的要因またはnull",
    "skinCondition": "目元の肌状態の詳細"
  },
  "scores": {
    "darkCircles": 1-5,
    "wrinkles": 1-5,
    "firmness": 1-5,
    "dullness": 1-5,
    "moisture": 1-5
  },
  "detailedAnalysis": {
    "darkCircles": "クマの色・範囲・濃さの具体的観察",
    "wrinkles": "シワの本数・深さ・位置の具体的観察",
    "firmness": "たるみ・弾力の具体的観察"
  },
  "analysis": "この人の目元の総合評価（問題点を明確に）",
  "primaryConcern": "最も改善が必要な項目のキー名",
  "recommendation": "具体的なケアアドバイス"
}`;
}

function generatePromptKO(eyeData?: EyeAnalysisData) {
  let objectiveData = '';

  if (eyeData) {
    objectiveData = `
【참고 데이터】
- 추정 나이: ${eyeData.estimatedAge}세
- 피부 밝기: ${eyeData.skinBrightness}/100
- 이미지 품질: ${eyeData.imageQuality}/100

위 데이터를 참고하여 눈가 상태를 엄격하게 평가해주세요.
피부 밝기가 낮은 경우 칙칙함 평가를 엄격하게 해주세요.
`;
  }

  return `당신은 눈가의 미용 상태를 분석하는 AI 어드바이저입니다. 이 얼굴 사진에서 눈가의 외관 특징을 자세히 관찰해주세요.

【중요한 지시】
- 사진을 확대하여 눈가 주변을 상세히 관찰할 것
- 엄격하게 평가할 것 (관대한 평가 금지)
- 실제로 보이는 특징만을 근거로 판단할 것
- "보통"이나 "문제없음"에 치우치지 말고 세세한 특징도 감지할 것
- ※이것은 미용 목적의 참고 정보이며 의료 진단이 아닙니다
${objectiveData}
【평가 기준 - 엄격히 적용】

■ darkCircles(다크서클) 1-5점
1점: 진한 색소침착/청보라색이 눈 아래 전체에 퍼져있음. 한눈에 다크서클로 보이는 수준
2점: 명확한 다크서클 있음. 색소침착 또는 푸른빛이 눈에 띔. 화장으로도 커버 어려움
3점: 경~중도의 다크서클. 자세히 보면 색감 차이가 보임. 피곤해 보임
4점: 미세한 다크서클. 주의해서 봐야 알 수 있는 정도
5점: 다크서클 없음. 눈 아래가 균일하고 밝은 피부색

■ wrinkles(주름) 1-5점
1점: 깊은 주름이 여러 개. 웃지 않아도 눈꼬리나 눈 아래에 새겨져 있음
2점: 명확한 주름 있음. 잔주름이 눈에 띔. 잔주름이 광범위
3점: 경도의 주름. 표정을 지으면 선이 보임. 건조 잔주름 있음
4점: 거의 눈에 띄지 않음. 아주 미세한 선만 있음
5점: 주름 없음. 매끄럽고 탄력 있는 피부

■ firmness(탄력) 1-5점
1점: 명확한 처짐. 눈 아래 피부가 처져서 그림자가 생김
2점: 처짐 있음. 눈밑 지방이 눈에 띔. 피부에 탄력이 없음
3점: 다소 탄력이 떨어짐. 가벼운 눈밑 지방 있음
4점: 거의 탄력 있음. 약간의 느슨함만 있음
5점: 완벽한 탄력. 피부가 팽팽하게 당겨져 있음

■ dullness(칙칙함) 1-5점
1점: 전체적으로 어둡고 누렇거나 잿빛 인상. 투명감 제로
2점: 칙칙함이 눈에 띔. 피부가 피곤해 보임. 혈색이 나쁨
3점: 경도의 칙칙함. 투명감이 다소 부족
4점: 거의 밝음. 미세한 칙칙함만 있음
5점: 투명감 있음. 밝고 건강한 피부색

■ moisture(수분) 1-5점
1점: 명확한 건조. 피부가 푸석푸석, 각질 일어남, 잔주름 다수
2점: 건조한 편. 결이 거침. 수분 부족이 보임
3점: 다소 건조. 부분적으로 결 흐트러짐 있음
4점: 거의 촉촉함. 결이 정돈되어 있음
5점: 충분한 수분. 촉촉하고 결이 고움

【다크서클 종류 판정】색감을 정확히 판단
- blue: 청보라~푸르스름한 색 (혈행불량・정맥 비침)
- brown: 갈색~황갈색 (색소침착・멜라닌)
- black: 검은 그림자 (처짐・구조적)
- red: 붉은기・핑크빛 (안륜근 비침・염증)
- mixed: 여러 색이 혼재
- none: 다크서클 없음

【출력 형식】아래 JSON 형식만 출력:
{
  "observation": {
    "darkCircleType": "종류",
    "darkCircleTypeJa": "한국어명(청색 다크서클/갈색 다크서클/흑색 다크서클/적색 다크서클/혼합형/없음)",
    "mainCause": "외관에서 추측되는 주요 원인",
    "subCause": "부차적 요인 또는 null",
    "skinCondition": "눈가 피부 상태 상세"
  },
  "scores": {
    "darkCircles": 1-5,
    "wrinkles": 1-5,
    "firmness": 1-5,
    "dullness": 1-5,
    "moisture": 1-5
  },
  "detailedAnalysis": {
    "darkCircles": "다크서클의 색・범위・진하기 구체적 관찰",
    "wrinkles": "주름의 개수・깊이・위치 구체적 관찰",
    "firmness": "처짐・탄력 구체적 관찰"
  },
  "analysis": "이 사람의 눈가 종합 평가(문제점을 명확히)",
  "primaryConcern": "가장 개선이 필요한 항목의 키 이름",
  "recommendation": "구체적인 케어 조언"
}`;
}


export async function POST(request: NextRequest) {
  try {
    const { image, eyePositions, language = 'ja' } = await request.json();

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

    // ========== STEP 1: AWS Rekognition で目元診断用データ取得 ==========
    let eyeAnalysisData: EyeAnalysisData | undefined;
    let rekognitionFaceData: RekognitionFaceData | undefined;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('Analyzing with AWS Rekognition...');
      const rekognitionResult = await analyzeWithRekognition(base64Data);

      if (rekognitionResult.success && rekognitionResult.faceData) {
        rekognitionFaceData = rekognitionResult.faceData;
        // 目元診断に必要なデータのみ抽出
        eyeAnalysisData = {
          estimatedAge: rekognitionResult.faceData.ageRange.estimated,
          skinBrightness: Math.round(rekognitionResult.faceData.quality.brightness),
          imageQuality: Math.round(rekognitionResult.faceData.quality.sharpness),
        };
        console.log('Eye analysis data:', eyeAnalysisData);
      } else {
        console.warn('Rekognition analysis failed:', rekognitionResult.error);
      }
    } else {
      console.log('AWS credentials not configured, skipping Rekognition');
    }

    // ========== STEP 2: プロンプト生成（目元診断データを含む） ==========
    const ANALYSIS_PROMPT = language === 'ko'
      ? generatePromptKO(eyeAnalysisData)
      : generatePromptJA(eyeAnalysisData);

    // ========== STEP 3: Gemini 3 Pro で分析 ==========
    const modelName = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,  // より決定論的に
        topP: 0.85,
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

    // ========== STEP 4: 肌の明るさでくすみスコア調整 ==========
    if (eyeAnalysisData) {
      // 肌の明るさが低い場合、くすみのスコアを厳しく
      if (eyeAnalysisData.skinBrightness < 40 && scores.dullness > 3) {
        scores.dullness = Math.max(2, scores.dullness - 1);
        console.log('Adjusted dullness score based on brightness:', scores.dullness);
      }
    }

    // 目元年齢を算出（Rekognitionの推定年齢も考慮）
    const eyeAge = calculateEyeAge(scores, eyeAnalysisData?.estimatedAge);

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
