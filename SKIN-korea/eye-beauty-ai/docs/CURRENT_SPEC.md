# Eye Beauty AI - 現在の仕様書

## 概要

目元のスキンケア診断を行うAI WebアプリケーションClaudeのVision APIを使用して、撮影した顔写真から目元の状態（クマ・くすみ、シワ）を分析し、診断結果とおすすめ商品を表示する。

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|---------|------|
| Next.js | 16.0.6 | Reactフレームワーク（App Router使用） |
| React | 19.2.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 4.x | スタイリング |
| Framer Motion | 12.23.25 | アニメーション |
| Lucide React | 0.555.0 | アイコン |

### バックエンド / AI
| 技術 | バージョン | 用途 |
|------|---------|------|
| Anthropic SDK | 0.71.0 | Claude Vision API連携 |
| Claude Sonnet 4 | - | 画像分析AI（目元診断） |
| face-api.js | 0.22.2 | 顔検出（バックアップ用） |

### インフラ
| 技術 | 用途 |
|------|------|
| Vercel | デプロイ（推奨） |
| Next.js API Routes | サーバーサイドAPI |

---

## ディレクトリ構成

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # ランディングページ (/)
│   ├── layout.tsx           # 共通レイアウト
│   ├── providers.tsx        # Context Providers
│   ├── camera/
│   │   └── page.tsx         # カメラ撮影ページ (/camera)
│   ├── analyzing/
│   │   └── page.tsx         # 解析中ページ (/analyzing)
│   ├── gate/
│   │   └── page.tsx         # LINE登録ゲートページ (/gate)
│   ├── result/
│   │   └── page.tsx         # 診断結果ページ (/result)
│   └── api/
│       └── analyze/
│           └── route.ts     # Claude Vision API エンドポイント
├── components/
│   ├── ui/                  # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── BackButton.tsx
│   ├── landing/             # ランディングページ用
│   │   ├── Hero.tsx
│   │   ├── LanguageToggle.tsx
│   │   └── Sparkles.tsx
│   ├── camera/              # カメラページ用
│   │   ├── CameraView.tsx
│   │   ├── FaceGuide.tsx
│   │   └── DebugButtons.tsx
│   ├── analyzing/           # 解析中ページ用
│   │   ├── ScanAnimation.tsx
│   │   └── ProgressText.tsx
│   └── result/              # 結果ページ用
│       ├── ScoreDisplay.tsx
│       └── ProductRecommend.tsx
├── contexts/
│   ├── DiagnosisContext.tsx # 診断状態管理
│   └── LanguageContext.tsx  # 多言語対応
├── hooks/
│   ├── useCamera.ts         # カメラ制御フック
│   └── useFaceDetection.ts  # 顔検出フック
├── lib/
│   ├── constants.ts         # 定数定義
│   ├── faceapi.ts          # face-api.js初期化
│   └── eyeAnalyzer.ts      # 目元分析ロジック（レガシー）
└── types/
    ├── diagnosis.ts         # 診断関連の型定義
    └── language.ts          # 言語関連の型定義
```

---

## 画面フロー

```
[ランディングページ] → [カメラ撮影] → [解析中] → [LINE登録ゲート] → [診断結果]
      (/)              (/camera)     (/analyzing)     (/gate)        (/result)
```

---

## 各画面の仕様

### 1. ランディングページ (/)

**機能:**
- アプリの紹介とスタートボタン
- 言語切り替え（日本語/韓国語）
- キラキラアニメーション背景

**コンポーネント:**
- `Hero.tsx`: メインビジュアルとCTAボタン
- `LanguageToggle.tsx`: 言語切り替えボタン
- `Sparkles.tsx`: 背景のパーティクルアニメーション

### 2. カメラ撮影ページ (/camera)

**機能:**
- フロントカメラでリアルタイムプレビュー
- 顔ガイドオーバーレイ表示
- 撮影ボタンで写真をキャプチャ
- デバッグボタン（A: クマタイプ強制、B: シワタイプ強制）

**カメラ設定:**
```typescript
{
  facingMode: 'user',      // フロントカメラ
  width: { ideal: 640 },
  height: { ideal: 480 }
}
```

**撮影時の処理:**
- 水平反転（ミラーリング）して保存
- JPEG形式、品質90%でBase64変換
- 画像サイズ（width, height）も保存

### 3. 解析中ページ (/analyzing)

**機能:**
- スキャンアニメーション表示
- プログレステキスト表示
- Claude Vision APIで画像分析
- 分析完了後、自動遷移

**分析ステップ:**
1. 0秒: 「分析を開始します...」(0%)
2. 1.5秒: 「目元をスキャン中...」(30%)
3. 3秒: 「肌状態を分析中...」(60%)
4. 4.5秒: 「結果を生成中...」(90%)
5. 完了: ゲートページへ遷移

**Claude Vision API:**
- エンドポイント: `/api/analyze`
- モデル: `claude-sonnet-4-20250514`
- 入力: 撮影画像（Base64）、画像サイズ
- 出力: 診断タイプ、スコア、目の位置（パーセンテージ）

### 4. LINE登録ゲートページ (/gate)

**機能:**
- 診断結果を見るためのLINE友達追加促進
- LINEボタンクリックで結果ページへ遷移

**注意:** 現在はLINE連携のダミー実装（クリックで即遷移）

### 5. 診断結果ページ (/result)

**機能:**
- 撮影画像の表示（4:3アスペクト比）
- 目の位置マーカー表示（AIが検出した座標）
- 診断スコア表示（60-95点）
- 診断タイプに応じたメッセージ
- おすすめ商品表示
- 再診断・シェアボタン

**スコア表示:**
- 星5つで視覚化
- スコアに応じた色分け（ピンク〜パープル）

---

## API仕様

### POST /api/analyze

**リクエスト:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "imageWidth": 640,
  "imageHeight": 480
}
```

**レスポンス（成功時）:**
```json
{
  "type": "dark_circles",
  "score": 75,
  "brightness": 120,
  "contrast": 30,
  "leftEye": { "x": 268.8, "y": 182.4 },
  "rightEye": { "x": 371.2, "y": 182.4 },
  "leftEyePercent": { "x": 42, "y": 38 },
  "rightEyePercent": { "x": 58, "y": 38 },
  "imageWidth": 640,
  "imageHeight": 480,
  "analysis": "軽度のクマが見られますが、全体的に健康的な目元です。"
}
```

**診断タイプ:**
| タイプ | 説明 |
|--------|------|
| `dark_circles` | クマ・くすみタイプ |
| `wrinkles` | シワタイプ |

**スコア:**
- 範囲: 60-95点
- 高いほど良い状態

---

## 状態管理

### DiagnosisContext

```typescript
interface DiagnosisState {
  capturedImage: string | null;        // 撮影画像（Base64）
  imageDimensions: ImageDimensions | null; // 画像サイズ
  diagnosisType: 'dark_circles' | 'wrinkles' | null;
  score: number;                       // 0-100
  analysisData: AnalysisData | null;   // 詳細分析データ
  forceType: DiagnosisType;           // デバッグ用強制タイプ
  isAnalyzing: boolean;
  error: string | null;
}
```

### LanguageContext

```typescript
type Language = 'ja' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}
```

---

## 多言語対応

現在対応言語:
- 日本語 (ja) - デフォルト
- 韓国語 (ko)

翻訳キー例:
```typescript
{
  'landing.title': '目元映えチェック',
  'landing.subtitle': 'AIがあなたの目元を診断',
  'camera.instruction': '顔全体が映るようにしてください',
  'result.title': '診断結果',
  // ...
}
```

---

## 環境変数

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

---

## デバッグ機能

カメラページに2つのデバッグボタンを実装:

- **ボタンA**: クマタイプ（dark_circles）を強制判定
- **ボタンB**: シワタイプ（wrinkles）を強制判定

デバッグモード時はClaude APIをスキップし、固定値を返す。

---

## 今後の課題・改善点

1. **目のマーカー位置精度**
   - Claude Visionが返すパーセンテージ座標と画像表示のズレ
   - 画像クロップ（object-cover）時の座標補正が必要

2. **LINE連携**
   - 現在はダミー実装
   - 実際のLINE Official Account連携が必要

3. **商品レコメンド**
   - 現在は固定の商品表示
   - 実際の商品データベース連携が必要

4. **パフォーマンス**
   - Claude API呼び出しに3-5秒かかる
   - 画像圧縮や最適化で改善可能

5. **エラーハンドリング**
   - 顔検出失敗時のリトライ機能
   - ネットワークエラー時の再試行

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-03 | Claude Vision API統合、目のマーカー機能追加 |
| 2025-12-02 | 初期実装完了（全画面フロー） |
