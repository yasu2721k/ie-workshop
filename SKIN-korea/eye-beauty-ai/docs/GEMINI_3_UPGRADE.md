# Eye Beauty AI - Gemini 3 Pro Preview 移行指示書

## 概要

分析AIを **Claude Sonnet 4** から **Gemini 3 Pro Preview** に変更し、
医療レベルの診断精度を実現する。

**確認なしで最後まで実装してください。**

---

## 1. パッケージ変更

### 1.1 インストール

```bash
npm install @google/generative-ai
```

### 1.2 Anthropic SDKの削除（任意）

```bash
npm uninstall @anthropic-ai/sdk
```

---

## 2. 環境変数変更

### 2.1 .env.local

```env
# 削除または残す（他で使う場合）
# ANTHROPIC_API_KEY=xxx

# 追加（必須）
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2.2 Vercel環境変数

Vercelダッシュボードで以下を設定：
- `GEMINI_API_KEY`: Google AI StudioのAPIキー

**APIキー取得方法**: https://aistudio.google.com/app/apikey

---

## 3. API Route 完全書き換え

### 3.1 `/src/app/api/analyze/route.ts` を以下に置き換え

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateEyeAge } from '@/lib/eyeAgeCalculator';
import { DiagnosisScores } from '@/types/diagnosis';

// Gemini 3 Pro Preview 初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ANALYSIS_PROMPT = `
あなたは皮膚科専門医の資格を持ち、韓国の美容クリニックで10年以上の経験を持つ目元専門のスキンケアアドバイザーです。

提供された顔写真から、目元の状態を医学的・美容的観点から詳細に分析してください。

## 分析の手順

### Step 1: 詳細観察
まず画像を注意深く観察し、以下の点を確認してください：

**クマの観察**
- 目の下の色味（青み、茶色み、紫み、黒ずみ）
- 色の濃さと範囲
- 左右差の有無

**形状の観察**
- 目の下の膨らみ・凹み（眼窩脂肪、ティアトラフ）
- 目袋の有無と程度
- たるみの状態

**肌質の観察**
- 目尻や目の下の線・溝の深さと本数
- 肌のキメ・質感・毛穴の状態
- 光の反射具合（潤い・ツヤの指標）
- 皮膚の厚み・透明感

### Step 2: クマの種類を特定

クマには以下の種類があります。複合型の場合は主要因と副因を特定してください：

**青クマ（血行不良型）**
- 目の下が青紫色に見える
- 皮膚が薄く、血管が透けている
- 睡眠不足や疲労で悪化
- 温めると改善する傾向

**茶クマ（色素沈着型）**
- 目の下が茶色っぽい
- メラニン蓄積が原因
- 紫外線や摩擦（目をこする癖）で悪化
- シミ・そばかすと同様の性質

**黒クマ（影・たるみ型）**
- 目の下の膨らみ（目袋）による影
- 眼窩脂肪の突出、ティアトラフの凹み
- 加齢による眼輪筋の衰え、肌の弾力低下が原因
- 上を向くと薄くなるのが特徴

**赤クマ（眼輪筋透過型）**
- 目の下が赤みがかって見える
- 眼輪筋の色が透けている
- 皮膚が薄い人に多い

### Step 3: 各項目を厳密に評価

以下の5項目を1-5で評価してください（5が最も良い状態）。

**重要なルール:**
- 「とりあえず3」のような曖昧な評価は禁止
- 各項目で異なるスコアになるのが自然
- 観察した具体的な特徴に基づいて評価

#### クマ (darkCircles)
- 5: 目の下が明るく、周囲の肌と均一な色。クマなし
- 4: わずかに暗いがほぼ気にならない。コンシーラー不要
- 3: 明らかに暗い部分があり、メイクで隠したいレベル
- 2: 青クマ・茶クマ・黒クマがはっきり確認できる。複合型の兆候
- 1: 複合型の濃いクマで、顔全体が疲れて見える

#### シワ (wrinkles)
- 5: 線や溝が全く見えない、なめらかな肌
- 4: 笑った時だけ目尻に薄い線が出る程度
- 3: 無表情でも薄い線が数本見える（ちりめんジワの初期）
- 2: はっきりした線が複数あり、ファンデが溜まりやすい
- 1: 深い溝（カラスの足跡）が刻まれている

#### ハリ (firmness)
- 5: ピンと張っている、目袋なし、たるみなし
- 4: ほぼ張りがあるが、やや緩みが見られる
- 3: 目の下に軽い膨らみ、眼輪筋の衰えの初期サイン
- 2: 明らかな目袋があり、影ができている（たるみ中期）
- 1: 重力に負けて下垂、深いティアトラフ

#### くすみ (dullness)
- 5: 透明感があり、内側から光っているような明るさ
- 4: 健康的な肌色、自然なツヤ
- 3: やや暗い印象、黄ぐすみや灰色味がある
- 2: 全体的にくすんで疲れた印象
- 1: 灰色がかって不健康、血色がない

#### 潤い (moisture)
- 5: しっとりツヤがある、キメが整っている
- 4: 適度な潤い、特に乾燥は感じない
- 3: やや乾燥気味、部分的にカサつきがある
- 2: 乾燥による細かいシワ、キメの乱れ
- 1: カサカサ・粉吹き、深刻な乾燥状態

## 出力形式

以下のJSON形式で出力してください。**JSONのみを出力し、他の説明文は不要です。**

\`\`\`json
{
  "observation": {
    "darkCircleType": "<クマの種類: blue/brown/black/red/mixed/none>",
    "darkCircleTypeJa": "<クマの種類（日本語）: 青クマ/茶クマ/黒クマ/赤クマ/複合型/なし>",
    "mainCause": "<主要因の具体的な説明（50文字以内）>",
    "subCause": "<副因があれば説明（30文字以内）、なければnull>",
    "skinCondition": "<肌全体の状態の具体的な説明（50文字以内）>"
  },
  "scores": {
    "darkCircles": <1-5の整数>,
    "wrinkles": <1-5の整数>,
    "firmness": <1-5の整数>,
    "dullness": <1-5の整数>,
    "moisture": <1-5の整数>
  },
  "detailedAnalysis": {
    "darkCircles": "<クマについての詳細分析（80文字以内）>",
    "wrinkles": "<シワについての詳細分析（80文字以内）>",
    "firmness": "<ハリについての詳細分析（80文字以内）>"
  },
  "analysis": "<観察結果に基づいた総評（100文字以内）>",
  "primaryConcern": "<最も改善が必要な項目のキー: darkCircles/wrinkles/firmness/dullness/moisture>",
  "recommendation": "<具体的なケア提案（80文字以内）>"
}
\`\`\`
`;

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

    // Gemini 3 Pro Preview モデルを使用
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 0.2,  // 低めに設定して一貫性を高める
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
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
```

---

## 4. 型定義の更新

### 4.1 `/src/types/diagnosis.ts` に追加

```typescript
// 既存の型に追加

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

// DiagnosisResultを更新
export interface DiagnosisResult {
  scores: DiagnosisScores;
  eyeAge: EyeAge;
  overallScore: number;
  primaryConcern: keyof DiagnosisScores;
  recommendation: string;
  analysis?: string;
  observation?: DarkCircleObservation | null;
  detailedAnalysis?: DetailedAnalysis | null;
  eyePositions?: EyePositions | null;
}
```

---

## 5. 結果画面の強化（任意だが推奨）

### 5.1 クマの種類表示を追加

結果画面にクマの種類と詳細分析を表示：

```tsx
// src/app/result/page.tsx に追加

{diagnosisResult.observation && (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC] mb-6">
    <h3 className="font-medium text-[#2C2C2C] mb-3">
      クマの診断結果
    </h3>
    <div className="space-y-2">
      <p className="text-[#6B6B6B]">
        <span className="font-medium text-[#2C2C2C]">種類: </span>
        {diagnosisResult.observation.darkCircleTypeJa}
      </p>
      <p className="text-[#6B6B6B]">
        <span className="font-medium text-[#2C2C2C]">主な原因: </span>
        {diagnosisResult.observation.mainCause}
      </p>
      {diagnosisResult.observation.subCause && (
        <p className="text-[#6B6B6B]">
          <span className="font-medium text-[#2C2C2C]">副次的要因: </span>
          {diagnosisResult.observation.subCause}
        </p>
      )}
    </div>
  </div>
)}

{diagnosisResult.detailedAnalysis && (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC] mb-6">
    <h3 className="font-medium text-[#2C2C2C] mb-3">
      詳細分析
    </h3>
    <div className="space-y-3 text-sm text-[#6B6B6B]">
      <p>{diagnosisResult.detailedAnalysis.darkCircles}</p>
      <p>{diagnosisResult.detailedAnalysis.wrinkles}</p>
      <p>{diagnosisResult.detailedAnalysis.firmness}</p>
    </div>
  </div>
)}
```

---

## 6. エラーハンドリング強化

### 6.1 フロントエンドのエラー表示

解析ページでAPIエラー時のリトライUIを追加：

```tsx
// src/app/analyzing/page.tsx

const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

const analyze = async () => {
  try {
    setError(null);
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: capturedImage }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }
    
    const result = await response.json();
    setDiagnosisResult(result);
  } catch (err) {
    console.error('Analysis failed:', err);
    setError(err instanceof Error ? err.message : '分析に失敗しました');
  }
};

// エラー時のUI
{error && (
  <div className="text-center mt-4">
    <p className="text-red-500 mb-4">{error}</p>
    <button
      onClick={() => {
        setRetryCount(prev => prev + 1);
        analyze();
      }}
      className="bg-[#2C2C2C] text-white px-6 py-2 rounded-full"
    >
      再試行 ({retryCount + 1}/3)
    </button>
  </div>
)}
```

---

## 7. テスト確認

### 7.1 ローカルテスト

```bash
# 環境変数を設定
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# 開発サーバー起動
npm run dev
```

### 7.2 確認項目

- [ ] カメラで撮影できる
- [ ] 解析が完了する（10秒以内）
- [ ] 結果画面にクマの種類が表示される
- [ ] 5軸スコアが妥当な値（全部3ではない）
- [ ] 目元年齢が表示される
- [ ] コンソールにエラーがない

---

## 8. 本番デプロイ

### 8.1 Vercel環境変数設定

1. Vercelダッシュボードを開く
2. プロジェクト設定 → Environment Variables
3. `GEMINI_API_KEY` を追加
4. Production, Preview, Development すべてにチェック
5. 再デプロイ

---

## 完了条件

- [ ] Claude Sonnet 4 → Gemini 3 Pro Preview への切り替え完了
- [ ] 診断結果にクマの種類（青クマ/茶クマ/黒クマ/複合型）が表示される
- [ ] 詳細分析が表示される
- [ ] npm run build がエラーなく通る
- [ ] 診断精度が向上している（スコアが全部同じにならない）

---

## Claude Code への指示

```
このGEMINI_3_UPGRADE.md を読み、すべての変更を完了させてください。

ルール:
- 確認や質問をせず、自律的に判断して進めること
- すべての変更を実装すること
- エラーが発生したら自分で解決して続行すること
- 最後に npm run build で動作確認すること

開始してください。
```
