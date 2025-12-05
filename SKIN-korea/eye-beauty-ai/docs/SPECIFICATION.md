# Eye Beauty AI - 詳細仕様書

## 1. プロジェクト概要

### 1.1 サービス名
**Eye Beauty AI** - AI目元診断アプリ

### 1.2 コンセプト
韓国コスメブランドの上品さを意識した、AI搭載の目元診断Webアプリケーション。
ユーザーの顔写真を撮影し、Claude Vision APIを活用して目元の状態を5軸で診断。
診断結果に基づいたおすすめ商品を提案し、LINE公式アカウントへの誘導を行う。

### 1.3 ターゲットユーザー
- 20〜40代女性
- 目元のエイジングケアに関心のあるユーザー
- 韓国コスメに興味のあるユーザー

### 1.4 対応言語
- 日本語 (ja)
- 韓国語 (ko)

---

## 2. 技術スタック

### 2.1 フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.0.6 | フレームワーク |
| React | 19.2.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 4.x | スタイリング |
| Framer Motion | 12.23.25 | アニメーション |
| Lucide React | 0.555.0 | アイコン |
| Recharts | 3.5.1 | レーダーチャート |

### 2.2 AI/画像処理
| 技術 | 用途 |
|------|------|
| Claude Vision API (Sonnet 4) | 目元状態の分析 |
| MediaPipe Face Mesh | リアルタイム顔検出・ランドマーク取得 |
| face-api.js | 顔検出（予備） |

### 2.3 インフラ
- Vercel（デプロイ）
- 環境変数: `ANTHROPIC_API_KEY`

---

## 3. ディレクトリ構成

```
eye-beauty-ai/
├── docs/                     # ドキュメント
│   ├── SPECIFICATION.md      # 本仕様書
│   ├── CURRENT_SPEC.md       # 現状仕様
│   └── FIX_INSTRUCTIONS.md   # 修正指示書
├── public/
│   └── models/               # face-api.js用モデル
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx          # トップページ
│   │   ├── camera/           # カメラページ
│   │   ├── analyzing/        # 解析ページ
│   │   ├── gate/             # LINE登録ゲート
│   │   ├── result/           # 結果ページ
│   │   ├── api/analyze/      # 分析API
│   │   ├── globals.css       # グローバルスタイル
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── providers.tsx     # コンテキストプロバイダー
│   ├── components/           # UIコンポーネント
│   │   ├── landing/          # ランディング関連
│   │   ├── camera/           # カメラ関連
│   │   ├── analyzing/        # 解析関連
│   │   ├── result/           # 結果表示関連
│   │   └── ui/               # 共通UI
│   ├── contexts/             # React Context
│   │   ├── DiagnosisContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/                # カスタムフック
│   │   ├── useCamera.ts
│   │   ├── useFaceMesh.ts
│   │   └── useFaceDetection.ts
│   ├── lib/                  # ユーティリティ
│   │   ├── constants.ts
│   │   ├── eyeAgeCalculator.ts
│   │   ├── eyeAnalyzer.ts
│   │   ├── mediapipe.ts
│   │   └── faceapi.ts
│   ├── locales/              # 多言語対応
│   │   ├── ja.json
│   │   └── ko.json
│   └── types/                # 型定義
│       ├── diagnosis.ts
│       └── language.ts
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 4. 画面フロー

```
[Landing Page] → [Camera Page] → [Analyzing Page] → [Gate Page] → [Result Page]
      /            /camera          /analyzing          /gate         /result
```

### 4.1 Landing Page (`/`)
**目的**: サービス紹介、診断開始への誘導

**主要コンポーネント**:
- `Hero.tsx`: メインビジュアル、CTA
- `LanguageToggle.tsx`: 言語切替

**機能**:
- 言語切替（日本語/韓国語）
- 「診断をスタート」ボタン → カメラページへ

### 4.2 Camera Page (`/camera`)
**目的**: 顔写真の撮影

**主要コンポーネント**:
- `CameraView.tsx`: カメラプレビュー・撮影
- `FaceMeshOverlay.tsx`: 顔メッシュ描画
- `FaceGuide.tsx`: 顔位置ガイド
- `DebugButtons.tsx`: デバッグ用ボタン

**機能**:
- フロントカメラ起動（ミラーリング）
- MediaPipe Face Meshによるリアルタイム顔検出
- 顔メッシュオーバーレイ表示
- 撮影ボタン（顔検出時のみ有効）
- 撮影処理中のローディング表示

**技術詳細**:
```typescript
// カメラ設定
{
  facingMode: 'user',
  width: { ideal: 640 },
  height: { ideal: 480 },
}

// 顔メッシュの座標変換（ミラーリング対応）
const getX = (point) => (1 - point.x) * width;
const getY = (point) => point.y * height;
```

### 4.3 Analyzing Page (`/analyzing`)
**目的**: 画像解析の進行状況表示

**主要コンポーネント**:
- `ScanAnimation.tsx`: スキャンアニメーション

**機能**:
- 撮影画像表示
- スキャンラインアニメーション
- 進捗バー表示（6ステップ）
- Claude Vision API呼び出し
- エラー時のリトライ導線

**解析ステップ**:
1. 顔認識中
2. クマレベル分析中
3. シワ検出中
4. ハリ・潤いチェック中
5. 目元年齢算出中
6. 診断完了

### 4.4 Gate Page (`/gate`)
**目的**: LINE公式アカウントへの誘導

**機能**:
- 診断完了メッセージ
- ぼかした結果プレビュー
- LINE友だち追加ボタン
- スキップオプション（デモ用）

### 4.5 Result Page (`/result`)
**目的**: 診断結果の表示

**主要コンポーネント**:
- `EyeAgeDisplay.tsx`: 目元年齢表示
- `RadarChart.tsx`: 5軸レーダーチャート
- `ProductRecommend.tsx`: おすすめ商品

**表示内容**:
- 撮影画像
- 目元年齢（推定）
- 総合スコア（0-100点）
- 5軸レーダーチャート
- 改善ポイント
- おすすめ商品
- 再診断ボタン
- シェアボタン

---

## 5. API仕様

### 5.1 分析API

**エンドポイント**: `POST /api/analyze`

**リクエスト**:
```typescript
{
  image: string;        // Base64エンコード画像
  imageWidth?: number;  // 画像幅
  imageHeight?: number; // 画像高さ
  eyePositions?: EyePositions; // 目の位置情報
}
```

**レスポンス**:
```typescript
{
  scores: {
    darkCircles: number;  // クマ: 1-5
    wrinkles: number;     // シワ: 1-5
    firmness: number;     // ハリ: 1-5
    dullness: number;     // くすみ: 1-5
    moisture: number;     // 潤い: 1-5
  };
  eyeAge: {
    estimatedAge: number;   // 推定目元年齢
    difference: number;     // 実年齢との差
    message: string;        // 表示メッセージ
  };
  overallScore: number;     // 総合スコア: 0-100
  primaryConcern: string;   // 最も改善が必要な項目
  recommendation: string;   // おすすめケアの方向性
  analysis: string;         // 総評
}
```

**エラーレスポンス**:
```typescript
{ error: 'NO_FACE_DETECTED' | 'Invalid AI response format' | 'Analysis failed' }
```

### 5.2 Claude Vision プロンプト

```
あなたは韓国コスメに精通したスキンケアの専門家です。
提供された顔写真から、目元の状態を詳細に分析してください。

## 分析項目（各1-5で評価、5が最も良い状態）

1. クマ (darkCircles): 目の下の色素沈着や暗さ
2. シワ (wrinkles): 目尻や目の下の細かい線
3. ハリ (firmness): 目周りの肌のハリ・たるみ
4. くすみ (dullness): 目周りの透明感
5. 潤い (moisture): 乾燥状態

## 出力形式（JSON）
{
  "scores": { ... },
  "primaryConcern": "<最も改善が必要な項目>",
  "analysis": "<50文字以内の総評>",
  "recommendation": "<おすすめケア30文字以内>"
}
```

---

## 6. データモデル

### 6.1 DiagnosisScores
```typescript
interface DiagnosisScores {
  darkCircles: number;  // クマ: 1-5
  wrinkles: number;     // シワ: 1-5
  firmness: number;     // ハリ: 1-5
  dullness: number;     // くすみ: 1-5
  moisture: number;     // 潤い: 1-5
}
```

### 6.2 EyeAge
```typescript
interface EyeAge {
  estimatedAge: number;   // 推定目元年齢（18-65歳）
  difference: number;     // 実年齢との差
  message: string;        // 表示メッセージ
}
```

### 6.3 DiagnosisResult
```typescript
interface DiagnosisResult {
  scores: DiagnosisScores;
  eyeAge: EyeAge;
  overallScore: number;              // 0-100
  primaryConcern: keyof DiagnosisScores;
  recommendation: string;
  analysis?: string;
  eyePositions?: EyePositions;
}
```

### 6.4 EyePositions
```typescript
interface EyePosition {
  x: number;  // 0-1 (パーセンテージ)
  y: number;  // 0-1 (パーセンテージ)
}

interface EyePositions {
  leftEye: EyePosition;
  rightEye: EyePosition;
  leftUnderEye?: EyePosition[];
  rightUnderEye?: EyePosition[];
}
```

---

## 7. 目元年齢算出ロジック

### 7.1 計算式
```typescript
const BASE_AGE = 27;  // 基準年齢

const AGE_WEIGHTS = {
  darkCircles: 2.0,   // クマは年齢印象に大きく影響
  wrinkles: 2.5,      // シワは最も年齢に影響
  firmness: 1.5,      // ハリの低下
  dullness: 1.0,      // くすみ
  moisture: 1.0,      // 潤い不足
};

// 各軸のスコアを年齢に換算
// スコア5 = 基準年齢、スコア1 = 基準年齢 + 加重×4
let ageModifier = 0;
Object.keys(scores).forEach((key) => {
  const score = scores[key];
  const weight = AGE_WEIGHTS[key];
  ageModifier += (5 - score) * weight;
});

// 目元年齢（最低18歳、最高65歳）
estimatedAge = Math.min(65, Math.max(18, Math.round(BASE_AGE + ageModifier)));
```

### 7.2 総合スコア算出
```typescript
// 各軸の平均 × 20
const overallScore = Math.round((sum / 5) * 20);
// 例: 全て5点 → 100点、全て3点 → 60点
```

---

## 8. デザインシステム

### 8.1 カラーパレット

| 変数名 | 色コード | 用途 |
|--------|----------|------|
| `--color-cream` | `#F5F3EF` | 背景色（オフホワイト） |
| `--color-beige` | `#E8E4DC` | セカンダリ背景 |
| `--color-sand` | `#D4CFC4` | ボーダー・区切り線 |
| `--color-charcoal` | `#2C2C2C` | メインテキスト |
| `--color-stone` | `#6B6B6B` | サブテキスト |
| `--color-muted` | `#9B9B9B` | 薄いテキスト |
| `--color-taupe` | `#8B7E74` | アクセントカラー |
| `--color-olive` | `#7A8B6E` | 成功・ポジティブ |
| `--color-terracotta` | `#B87A5E` | 警告・注意 |
| `--line-green` | `#06C755` | LINEボタン |

### 8.2 タイポグラフィ
```css
body {
  font-family: 'Noto Sans JP', 'Pretendard', sans-serif;
  font-weight: 300;
  letter-spacing: 0.02em;
  -webkit-font-smoothing: antialiased;
}

/* 韓国語 */
html[lang="ko"] body {
  font-family: 'Pretendard', 'Noto Sans JP', sans-serif;
}
```

### 8.3 ボタンスタイル
```css
.btn-primary {
  background: #2C2C2C;
  color: white;
  border-radius: 9999px;  /* 完全な丸み */
  font-weight: 500;
}

.btn-line {
  background: #06C755;
  color: white;
  border-radius: 9999px;
}
```

---

## 9. MediaPipe Face Mesh

### 9.1 設定
```typescript
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,  // 目・唇の詳細ランドマーク
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
```

### 9.2 ランドマークインデックス
```typescript
// 顔の輪郭
faceOval: [10, 338, 297, ... , 10]  // 37点

// 左目
leftEye: [362, 382, 381, ... , 362]  // 17点

// 右目
rightEye: [33, 7, 163, ... , 33]  // 17点

// 唇
lips: [61, 146, 91, ... , 61]  // 22点
```

---

## 10. 状態管理

### 10.1 DiagnosisContext
診断フロー全体の状態を管理

```typescript
interface DiagnosisState {
  capturedImage: string | null;
  imageDimensions: ImageDimensions | null;
  diagnosisResult: DiagnosisResult | null;
  diagnosisType: DiagnosisType;
  score: number;
  analysisData: AnalysisData | null;
  forceType: DiagnosisType;  // デバッグ用
  isAnalyzing: boolean;
  error: string | null;
}
```

### 10.2 LanguageContext
多言語対応の状態管理

```typescript
interface LanguageContextType {
  language: 'ja' | 'ko';
  setLanguage: (lang: 'ja' | 'ko') => void;
  t: (key: string) => string;
}
```

---

## 11. ルーティング

| パス | ページ | 説明 |
|------|--------|------|
| `/` | Landing | トップページ |
| `/camera` | Camera | カメラ撮影 |
| `/analyzing` | Analyzing | 解析中 |
| `/gate` | Gate | LINE誘導 |
| `/result` | Result | 結果表示 |
| `/api/analyze` | API | 分析エンドポイント |

---

## 12. 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API キー | 必須 |

---

## 13. デプロイ

### 13.1 ビルドコマンド
```bash
npm run build
```

### 13.2 開発サーバー
```bash
npm run dev
```

### 13.3 本番サーバー
```bash
npm run start
```

---

## 14. 今後の拡張予定

### 14.1 機能追加
- [ ] ユーザー登録・ログイン機能
- [ ] 診断履歴の保存
- [ ] 実年齢入力による比較機能
- [ ] おすすめ商品の詳細ページ
- [ ] LINE連携（実装）

### 14.2 技術改善
- [ ] PWA対応
- [ ] オフライン分析機能
- [ ] 画像の前処理最適化
- [ ] A/Bテスト機能

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2024-12-05 | 1.0.0 | 初版作成 |
