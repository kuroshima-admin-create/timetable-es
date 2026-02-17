# 小学校 時間割マネージャー（複式学級対応版）

複式学級を採用する小規模小学校向けの時間割作成・管理WEBアプリです。

## 特徴

- **複式学級対応**: 1つの学級に複数学年を編成（例: 1・2年、3・4年、5・6年）
- **わたり・ずらし指導**: 1コマ内で学年別に異なる教科を設定可能
- **学年別授業時数**: 文科省標準に基づき学年ごとに個別カウント
- **ひらめき（モジュール25分）**: 曜日ごとのON/OFF管理
- **Firebase連携**: 複数端末でリアルタイムデータ同期
- **Googleカレンダー連携**: iCal / GAS方式で行事自動取込

## デプロイ手順（Vercel・無料）

### 1. GitHubにリポジトリ作成

```bash
cd timetable-es
git init
git add .
git commit -m "初回コミット: 小学校版 時間割マネージャー"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/timetable-es.git
git push -u origin main
```

### 2. Vercelでデプロイ

1. [vercel.com](https://vercel.com) にGitHubアカウントでログイン
2. 「Add New → Project」
3. 上記リポジトリを選択 → Import
4. Framework Preset: **Vite** を選択
5. 「Deploy」をクリック

デプロイ完了後、`https://timetable-es-xxxxx.vercel.app` のURLが発行されます。

### 3. ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:5173` でアクセスできます。

## ファイル構成

```
timetable-es/
├── index.html          ← エントリーHTML
├── package.json        ← 依存関係
├── vite.config.js      ← Vite設定
├── vercel.json         ← Vercel SPA設定
├── .gitignore
├── README.md
└── src/
    ├── main.jsx        ← Reactエントリー
    └── App.jsx         ← アプリ本体（全コンポーネント）
```

## 中学校版との違い

| 項目 | 中学校版 | 小学校版（本アプリ） |
|------|----------|---------------------|
| URL | 別リポジトリ / 別Vercelプロジェクト | `timetable-es` |
| 学級編制 | 1学年＝1学級 | 複式学級（複数学年＝1学級） |
| 1単位時間 | 50分 | 45分（1-5校時は実質40分） |
| 教科 | 中学校9教科 | 小学校14教科（学年別） |
| Firebase学校ID | `school01` | `school_es01`（デフォルト） |

## 技術スタック

- React 18 + Vite
- インラインスタイル（CSS-in-JS）
- Firebase Realtime Database（REST API）
- Googleカレンダー（iCal / GAS）
- Noto Sans JP + Zen Kaku Gothic New
