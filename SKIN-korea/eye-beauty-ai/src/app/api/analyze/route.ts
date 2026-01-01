import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateEyeAge } from '@/lib/eyeAgeCalculator';
import { DiagnosisScores, ProblemAreas } from '@/types/diagnosis';
import { analyzeWithRekognition, RekognitionFaceData } from '@/lib/rekognitionService';
import { cropEyeRegions, createExpressionComparison } from '@/lib/imageProcessing';

// Gemini 3 Pro Preview 初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 目元診断用データ（Rekognitionから抽出）
interface EyeAnalysisData {
  estimatedAge: number;
  skinBrightness: number;
  imageQuality: number;
}

// 目の位置データ
interface EyePositionData {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
}

// プロンプト生成関数（目元診断特化）
function generatePromptJA(eyeData?: EyeAnalysisData, eyePositions?: EyePositionData, questionnaireData?: any, isExpressionAnalysis?: boolean) {
  let objectiveData = '';

  if (eyeData) {
    objectiveData = `
【参考データ】
- 肌の明るさ: ${eyeData.skinBrightness}/100
- 画像品質: ${eyeData.imageQuality}/100

肌の明るさが低い場合はくすみの評価を厳しくしてください。
`;
  }

  // 目の位置情報（MediaPipeから取得した実際の座標）
  let eyePositionInfo = '';
  if (eyePositions) {
    // 座標はすでに正しい向きなので、そのまま使用
    const leftX = eyePositions.leftEye.x.toFixed(2);
    const leftY = eyePositions.leftEye.y.toFixed(2);
    const rightX = eyePositions.rightEye.x.toFixed(2);
    const rightY = eyePositions.rightEye.y.toFixed(2);

    eyePositionInfo = `
【重要: 検出済みの目の位置】
画像内で検出された目の正確な位置:
- 左目の中心: x=${leftX}, y=${leftY}
- 右目の中心: x=${rightX}, y=${rightY}

この座標を基準にして、問題箇所の座標を指定してください:
- クマは目の中心から下方向（y座標を+0.03〜+0.08程度）
- 目尻のシワは目の外側（左目ならx座標を+0.05〜+0.10、右目ならx座標を-0.05〜-0.10）
- 目の下のたるみは目の下方（y座標を+0.02〜+0.06程度）
`;
  }

  let systemPrompt = `あなたは目元の美容状態を分析するAIアドバイザーです。`;
  
  if (isExpressionAnalysis) {
    systemPrompt += `左側の真顔画像と右側の笑顔画像を比較して、表情変化によって現れる潜在的なシワやたるみを特定してください。`;
  } else {
    systemPrompt += `この高解像度の目元画像から、肌のキメ、微細なシワ、色調の変化を詳しく観察してください。`;
  }

  let questionnaireInfo = '';
  if (questionnaireData) {
    questionnaireInfo = `
【問診データによる追加分析指示】
- 睡眠時間: ${questionnaireData.sleepHours}時間
  ${questionnaireData.sleepHours < 6 ? '→ 睡眠不足による血行不良、クマの評価を厳しく' : ''}
- 目の疲労度: ${questionnaireData.eyeFatigue}
  ${questionnaireData.eyeFatigue === 'high' ? '→ 眼精疲労によるクマ、たるみの評価を重視' : ''}
- 冷え性: ${questionnaireData.coldSensitivity ? 'あり' : 'なし'}
  ${questionnaireData.coldSensitivity ? '→ 血行不良による青クマの可能性を考慮' : ''}
- ストレスレベル: ${questionnaireData.stressLevel}
  ${questionnaireData.stressLevel === 'high' ? '→ ストレスによる肌の不調、くすみを重視' : ''}

問診データと画像の特徴を掛け合わせて、クマやシワの根本原因を論理的に推論してください。
`;
  }

  return systemPrompt + `

【重要な指示】
- 写真を拡大して目元周辺を詳細に観察すること
- 厳格に評価すること（甘い評価は禁止）
- 実際に見える特徴のみを根拠に判断すること
- 「普通」や「問題なし」に偏らず、細かい特徴も検出すること
- 分析結果に年齢への言及を含めないこと
- ※これは美容目的の参考情報であり、医療診断ではありません
${objectiveData}${eyePositionInfo}${questionnaireInfo}
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

【問題箇所の座標指定 - 非常に重要】
画像上の問題箇所を正確な座標で指定してください。
- x: 0.0（左端）〜 1.0（右端）
- y: 0.0（上端）〜 1.0（下端）
- 画像の顔の位置を基準に、問題のある具体的な箇所を特定
- 目の下のクマなら y は大体 0.35〜0.50 の範囲
- 目尻のシワなら x は目の外側（左目なら0.2-0.35、右目なら0.65-0.8付近）
- severity: 1（軽度）〜 5（重度）
- type: 問題の種類（例: "色素沈着", "血管透け", "細いシワ", "深いシワ", "たるみ", "乾燥"）

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
  "problemAreas": {
    "darkCircles": [
      {"x": 0.30, "y": 0.42, "severity": 3, "type": "血管透け"},
      {"x": 0.70, "y": 0.43, "severity": 3, "type": "血管透け"}
    ],
    "wrinkles": [
      {"x": 0.22, "y": 0.38, "severity": 2, "type": "目尻の小ジワ"}
    ],
    "firmness": [],
    "dullness": [],
    "moisture": []
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

function generatePromptKO(eyeData?: EyeAnalysisData, eyePositions?: EyePositionData, questionnaireData?: any, isExpressionAnalysis?: boolean) {
  let objectiveData = '';

  if (eyeData) {
    objectiveData = `
【참고 데이터】
- 피부 밝기: ${eyeData.skinBrightness}/100
- 이미지 품질: ${eyeData.imageQuality}/100

피부 밝기가 낮은 경우 칙칙함 평가를 엄격하게 해주세요.
`;
  }

  // 목의 위치 정보（MediaPipe에서 취득한 실제 좌표）
  let eyePositionInfo = '';
  if (eyePositions) {
    // 카메라 이미지는 좌우 반전되어 있으므로 좌표를 반전
    const leftX = (1 - eyePositions.leftEye.x).toFixed(2);
    const leftY = eyePositions.leftEye.y.toFixed(2);
    const rightX = (1 - eyePositions.rightEye.x).toFixed(2);
    const rightY = eyePositions.rightEye.y.toFixed(2);

    eyePositionInfo = `
【중요: 감지된 눈의 위치】
이미지에서 감지된 눈의 정확한 위치:
- 왼쪽 눈 중심: x=${leftX}, y=${leftY}
- 오른쪽 눈 중심: x=${rightX}, y=${rightY}

이 좌표를 기준으로 문제 부위의 좌표를 지정해주세요:
- 다크서클은 눈 중심에서 아래쪽 방향(y좌표를 +0.03~+0.08 정도)
- 눈꼬리 주름은 눈 바깥쪽(왼눈은 x좌표를 +0.05~+0.10, 오른눈은 x좌표를 -0.05~-0.10)
- 눈 아래 처짐은 눈 아래쪽(y좌표를 +0.02~+0.06 정도)
`;
  }

  let systemPrompt = `당신은 눈가의 미용 상태를 분석하는 AI 어드바이저입니다.`;
  
  if (isExpressionAnalysis) {
    systemPrompt += `왼쪽의 무표정 이미지와 오른쪽의 웃는 이미지를 비교하여 표정 변화로 나타나는 잠재적인 주름과 처짐을 특정해주세요.`;
  } else {
    systemPrompt += `이 고해상도 눈가 이미지에서 피부 결, 미세한 주름, 색조 변화를 자세히 관찰해주세요.`;
  }

  let questionnaireInfo = '';
  if (questionnaireData) {
    questionnaireInfo = `
【문진 데이터에 의한 추가 분석 지시】
- 수면 시간: ${questionnaireData.sleepHours}시간
  ${questionnaireData.sleepHours < 6 ? '→ 수면 부족에 의한 혈행불량, 다크서클 평가를 엄격히' : ''}
- 눈의 피로도: ${questionnaireData.eyeFatigue}
  ${questionnaireData.eyeFatigue === 'high' ? '→ 안정피로에 의한 다크서클, 처짐 평가를 중시' : ''}
- 냉증: ${questionnaireData.coldSensitivity ? '있음' : '없음'}
  ${questionnaireData.coldSensitivity ? '→ 혈행불량에 의한 청색 다크서클 가능성을 고려' : ''}
- 스트레스 레벨: ${questionnaireData.stressLevel}
  ${questionnaireData.stressLevel === 'high' ? '→ 스트레스에 의한 피부 불균형, 칙칙함을 중시' : ''}

문진 데이터와 이미지 특징을 결합하여 다크서클과 주름의 근본 원인을 논리적으로 추론해주세요.
`;
  }

  return systemPrompt + `

【중요한 지시】
- 사진을 확대하여 눈가 주변을 상세히 관찰할 것
- 엄격하게 평가할 것 (관대한 평가 금지)
- 실제로 보이는 특징만을 근거로 판단할 것
- "보통"이나 "문제없음"에 치우치지 말고 세세한 특징도 감지할 것
- 분석 결과에 나이에 대한 언급을 포함하지 말 것
- ※이것은 미용 목적의 참고 정보이며 의료 진단이 아닙니다
${objectiveData}${eyePositionInfo}${questionnaireInfo}
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

【문제 부위 좌표 지정 - 매우 중요】
이미지에서 문제 부위를 정확한 좌표로 지정해 주세요.
- x: 0.0(왼쪽 끝) ~ 1.0(오른쪽 끝)
- y: 0.0(위쪽 끝) ~ 1.0(아래쪽 끝)
- 이미지의 얼굴 위치를 기준으로 문제가 있는 구체적인 위치를 특정
- 눈 아래 다크서클이라면 y는 대략 0.35~0.50 범위
- 눈꼬리 주름이라면 x는 눈 바깥쪽(왼눈이라면 0.2-0.35, 오른눈이라면 0.65-0.8 부근)
- severity: 1(경미) ~ 5(심각)
- type: 문제 유형(예: "색소침착", "혈관 비침", "잔주름", "깊은 주름", "처짐", "건조")

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
  "problemAreas": {
    "darkCircles": [
      {"x": 0.30, "y": 0.42, "severity": 3, "type": "혈관 비침"},
      {"x": 0.70, "y": 0.43, "severity": 3, "type": "혈관 비침"}
    ],
    "wrinkles": [
      {"x": 0.22, "y": 0.38, "severity": 2, "type": "눈꼬리 잔주름"}
    ],
    "firmness": [],
    "dullness": [],
    "moisture": []
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
    const { image, eyePositions, language = 'ja', questionnaireData, smileImage, useROICrop = true } = await request.json();
    
    // デバッグ用ログ
    console.log('=== Analysis Request Debug ===');
    console.log('Has eyePositions:', !!eyePositions);
    console.log('Has questionnaireData:', !!questionnaireData);
    console.log('Has smileImage:', !!smileImage);
    console.log('useROICrop:', useROICrop);
    if (questionnaireData) {
      console.log('Questionnaire data:', questionnaireData);
    }

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

    // ========== STEP 1: ROI Crop if enabled and eye positions available ==========
    let processedImage = image;
    let isExpressionAnalysis = false;
    
    if (useROICrop && eyePositions) {
      try {
        console.log('Starting ROI crop with eyePositions:', eyePositions);
        // 目元をクロップ
        const { leftEyeImage, rightEyeImage } = await cropEyeRegions(image, eyePositions);
        
        // 表情分析モードの場合
        if (smileImage) {
          const { leftEyeImage: leftSmile, rightEyeImage: rightSmile } = await cropEyeRegions(smileImage, eyePositions);
          
          // 左右の目の比較画像を作成
          const leftComparison = await createExpressionComparison(leftEyeImage, leftSmile);
          const rightComparison = await createExpressionComparison(rightEyeImage, rightSmile);
          
          // 両目の比較を1つの画像に結合（仮想的に処理）
          processedImage = leftComparison; // 簡略化のため左目のみを使用
          isExpressionAnalysis = true;
        } else {
          // 単一撮影モードでは左右の目を結合（ここでは左目のみを使用）
          processedImage = leftEyeImage;
        }
      } catch (error) {
        console.warn('ROI cropping failed, using full image:', error);
      }
    }

    // ========== STEP 2: AWS Rekognition で目元診断用データ取得 ==========
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

    // ========== STEP 2: プロンプト生成（目元診断データと目の位置を含む） ==========
    // eyePositionsをEyePositionData形式に変換
    let eyePositionData: EyePositionData | undefined;
    if (eyePositions && eyePositions.leftEye && eyePositions.rightEye) {
      eyePositionData = {
        leftEye: eyePositions.leftEye,
        rightEye: eyePositions.rightEye,
      };
    }

    const ANALYSIS_PROMPT = language === 'ko'
      ? generatePromptKO(eyeAnalysisData, eyePositionData, questionnaireData, isExpressionAnalysis)
      : generatePromptJA(eyeAnalysisData, eyePositionData, questionnaireData, isExpressionAnalysis);
    
    console.log('=== Gemini Prompt Debug ===');
    console.log('Is expression analysis:', isExpressionAnalysis);
    console.log('Has questionnaire data in prompt:', !!questionnaireData);
    if (questionnaireData) {
      console.log('Prompt includes questionnaire analysis');
    }

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

    // 画像とプロンプトを送信（処理済み画像を使用）
    const processedBase64 = processedImage.replace(/^data:image\/\w+;base64,/, '');
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: processedBase64,
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

    // problemAreasの検証とデフォルト値設定
    const defaultProblemAreas: ProblemAreas = {
      darkCircles: [],
      wrinkles: [],
      firmness: [],
      dullness: [],
      moisture: [],
    };

    let problemAreas: ProblemAreas = defaultProblemAreas;
    if (analysisResult.problemAreas) {
      // AIからの座標データを検証
      problemAreas = {
        darkCircles: Array.isArray(analysisResult.problemAreas.darkCircles)
          ? analysisResult.problemAreas.darkCircles.filter((p: { x: number; y: number }) =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
          : [],
        wrinkles: Array.isArray(analysisResult.problemAreas.wrinkles)
          ? analysisResult.problemAreas.wrinkles.filter((p: { x: number; y: number }) =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
          : [],
        firmness: Array.isArray(analysisResult.problemAreas.firmness)
          ? analysisResult.problemAreas.firmness.filter((p: { x: number; y: number }) =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
          : [],
        dullness: Array.isArray(analysisResult.problemAreas.dullness)
          ? analysisResult.problemAreas.dullness.filter((p: { x: number; y: number }) =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
          : [],
        moisture: Array.isArray(analysisResult.problemAreas.moisture)
          ? analysisResult.problemAreas.moisture.filter((p: { x: number; y: number }) =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
          : [],
      };
    }

    console.log('Problem areas detected:', JSON.stringify(problemAreas, null, 2));

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
      problemAreas,
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
