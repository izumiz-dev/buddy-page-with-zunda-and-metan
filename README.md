# 🍵 ZundaMetan Navigator - Web解説コンビによる新感覚ブラウジング体験

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome](https://img.shields.io/badge/Google_Chrome-4285F4?style=for-the-badge&logo=Google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![VOICEVOX](https://img.shields.io/badge/VOICEVOX-57B560?style=for-the-badge)](https://voicevox.hiroshiba.jp/)

_Web閲覧をもっと楽しく、もっと分かりやすく_  
</div>

---

## 🌟 特徴

ずんだもんと四国めたんがあなたのWeb体験を革新的にアップグレード！

- 🎭 **AIパワードキャラクター解説** - Webページの内容をキャラクターが個性豊かに解説
- 🔊 **リアルタイム音声合成** - VOICEVOXによる自然な読み上げで、まるでそこにキャラクターがいるような体験
- 🎨 **高度なインタラクティブUI**
  - ドラッグ可能でリサイズ自在な会話ウィンドウ
  - スムーズなアニメーションと直感的な操作感
  - レスポンシブなレイアウトとモダンなデザイン
  - **音声読み上げのON/OFF切り替え** - 設定画面から簡単に音声の有効/無効を切り替え可能
  - 美しいグラデーションとアニメーション効果
- 🤖 **最新AI技術** - Google Gemini APIによる高度な文章理解と会話生成
- 🎓 **プロフェッショナルモード** - より専門的で深い解説が必要な時に活用できる高度な会話モード
  - Gemini 2.5 Pro APIによるより高度な内容理解と解説
  - 専門的な用語や概念をより詳細に説明
  - カジュアルモードとプロフェッショナルモードを簡単に切り替え

## 📱 デモ
[デモ動画をBlueskyで見る](https://bsky.app/profile/did:plc:an3xifvom3u6bg6iug3drdjr/post/3lm5g55aq5k2p)  
ずんだもんと四国めたんが、Webページの内容をリアルタイムに解説！

## 🎮 使ってみよう！

1. 🔧 **インストール＆セットアップ**
   ```bash
   git clone https://github.com/yourusername/buddy-page-with-zunda-and-metan.git
   cd buddy-page-with-zunda-and-metan
   pnpm install
   pnpm build
   ```

2. 🚀 **Chrome拡張機能として追加**
   - Chrome拡張機能管理ページ（chrome://extensions）を開く
   - デベロッパーモードをON
   - 「パッケージ化されていない拡張機能を読み込む」から`dist`フォルダを選択

3. ⚙️ **初期設定**
   - Gemini API キーを設定（必須）
   - VOICEVOXサーバー設定（音声機能を使用する場合）
   - キャラクター音声IDのカスタマイズ（オプション）
   - デフォルト会話モードの選択（カジュアル/プロフェッショナル）
   - 必要に応じて音声読み上げをOFFに設定可能

 4. 🎉 **さあ、始めよう！**
   - Webページを開く
   - 拡張機能アイコンをクリック
   - 「お話を用意してもらう」で会話スタート！
   - または「プロフェッショナル解説モード」で専門的な解説を聞く

## 🔧 技術スタック

- **フロントエンド**
  - TypeScript
  - Preact + Hooks
  - Chrome Extension API
  - CSS-in-JS（インラインスタイル）
- **AI & 音声**
  - Google Gemini API
    - カジュアルモード: gemini-2.0-flash
    - プロフェッショナルモード: gemini-2.5-pro-preview
  - VOICEVOX API
- **ビルド & 開発**
  - pnpm
  - esbuild
  - TypeScript
- **セキュリティ**
  - Web Crypto API（APIキーの暗号化）
  - Chrome Storage API（設定の安全な保存）
- **デザイン**
  - Rounded M+ フォント
  - モダンなグラデーションUI
  - モード別カラーテーマ（カジュアル: 緑✕ピンク、プロフェッショナル: 青✕紫）
  - レスポンシブデザイン

## 💫 キャラクター紹介

### ずんだもん
> 🍡 東北地方の「ずんだもち」がモチーフの元気な妖精  
> 好奇心旺盛で、語尾に「〜のだ」「〜なのだ」が特徴的  
> VOICEVOX:ずんだもん
>
> **プロフェッショナルモード**: 質問のレベルが高度になり、より分析的な視点を持つ

### 四国めたん
> 🌸 おっとり系お姉さんキャラクター  
> 丁寧な口調で、時々中二病っぽい言動も  
> VOICEVOX:四国めたん
>
> **プロフェッショナルモード**: 専門家としての知識と解析力を発揮、複雑な概念も明確に説明

## 📄 ライセンス

MIT

## 🙏 謝辞

- [Google Gemini API](https://ai.google.dev/)（会話生成AI）
- [VOICEVOX](https://voicevox.hiroshiba.jp/)（音声合成エンジン）
- キャラクター音声：
  - ずんだもん by VOICEVOX
  - 四国めたん by VOICEVOX

---

<div align="center">

**ZundaMetan Navigator**で、新しいWeb体験を始めましょう！

[![GitHub stars](https://img.shields.io/github/stars/izumiz-dev/buddy-page-with-zunda-and-metan?style=social)](https://github.com/izumiz-dev/buddy-page-with-zunda-and-metan)

</div>
