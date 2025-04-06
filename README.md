# 🍵 ZundaMetan Navigator - Web解説コンビによる新感覚ブラウジング体験

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome](https://img.shields.io/badge/Google_Chrome-4285F4?style=for-the-badge&logo=Google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![VOICEVOX](https://img.shields.io/badge/VOICEVOX-57B560?style=for-the-badge)](https://voicevox.hiroshiba.jp/)

_Web閲覧をもっと楽しく、もっと分かりやすく_  
</div>

> [!NOTE]
> このプロジェクトはClaudeを使用して開発されました。コードの一部はアシスタントによって生成または改善されています。
> また、この README も Claude によってコードベースをもとに記述されています。

---

## 🌟 特徴

ずんだもんと四国めたんがあなたのWeb体験を革新的にアップグレード！

- 🎭 **AIパワードキャラクター解説** - Webページの内容をキャラクターが個性豊かに解説
- 🔊 **リアルタイム音声合成** - VOICEVOXによる自然な読み上げで、まるでそこにキャラクターがいるような体験
- 🎨 **インタラクティブUI** - ドラッグ可能でリサイズ自在な会話ウィンドウ
- 🤖 **最新AI技術** - Google Gemini APIによる高度な文章理解と会話生成

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
   - Gemini API キーを設定
   - VOICEVOXサーバー設定（必要に応じて）
   - キャラクター音声IDのカスタマイズ（オプション）

4. 🎉 **さあ、始めよう！**
   - Webページを開く
   - 拡張機能アイコンをクリック
   - 「お話を用意してもらう」で会話スタート！

## 🔧 技術スタック

- **フロントエンド**: TypeScript + Chrome Extension API
- **AI**: Google Gemini API (gemini-2.0-flash)
- **音声**: VOICEVOX API
- **ビルド**: pnpm + esbuild
- **セキュリティ**: Web Crypto API

## 💫 キャラクター紹介

### ずんだもん
> 🍡 東北地方の「ずんだもち」がモチーフの元気な妖精  
> 好奇心旺盛で、語尾に「〜のだ」「〜なのだ」が特徴的  
> VOICEVOX:ずんだもん

### 四国めたん
> 🌸 おっとり系お姉さんキャラクター  
> 丁寧な口調で、時々中二病っぽい言動も  
> VOICEVOX:四国めたん

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

[![GitHub stars](https://img.shields.io/github/stars/yourusername/buddy-page-with-zunda-and-metan?style=social)](https://github.com/yourusername/buddy-page-with-zunda-and-metan)

</div>