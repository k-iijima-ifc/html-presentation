# 🎬 GSAP iframeエフェクト デモ

> ⚠️ **実験用リポジトリ** - このプロジェクトは技術検証・学習目的で作成されています。本番環境での使用は想定していません。

[![Deploy to GitHub Pages](https://github.com/k-iijima-ifc/html-presentation/actions/workflows/deploy.yml/badge.svg)](https://github.com/k-iijima-ifc/html-presentation/actions/workflows/deploy.yml)

## 🌐 デモページ

**👉 [デモを見る](https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-modular.html)**

| バージョン | リンク |
|-----------|--------|
| グループ版 | [iframe-gsap-demo-modular.html](https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-modular.html) |
| 個別ファイル版 | [iframe-gsap-demo-individual.html](https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-individual.html) |

---

iframeコンテンツの切り替え時に様々なアニメーションエフェクトを適用できるデモアプリケーションです。

## ✨ 特徴

- **30種類以上のエフェクト** - フェード、スライド、3D回転、物理演算など豊富なトランジション
- **モジュラー設計** - エフェクトごとにファイル分割された保守性の高い構成
- **設定ファイル対応** - `iframe-config.js` でコンテンツを簡単に管理
- **レスポンシブ対応** - 様々な画面サイズに対応

## 🚀 ローカルでの実行

1. リポジトリをクローン
2. `iframe-gsap-demo-modular.html` をブラウザで開く
3. 右サイドバーからエフェクトを選択
4. 上部のタブでページを切り替えてエフェクトを確認

## 📁 プロジェクト構成

```
├── iframe-gsap-demo-modular.html    # メインHTML（グループ版）
├── iframe-gsap-demo-individual.html # メインHTML（個別版）
├── iframe-config.js                 # コンテンツ設定
├── css/
│   ├── main.css                     # メインスタイル
│   └── effects/                     # エフェクト専用CSS
│       ├── collapse.css
│       ├── glitch.css
│       └── iforcom.css
├── js/
│   ├── main.js                      # メインロジック（グループ版）
│   ├── main-individual.js           # メインロジック（個別版）
│   └── effects/
│       ├── 3d.js                    # 3D系（グループ版）
│       ├── basic.js                 # 基本系（グループ版）
│       ├── collapse.js              # 崩壊系（グループ版）
│       ├── filter.js                # フィルター系（グループ版）
│       ├── iforcom.js               # IFORCOM専用（グループ版）
│       ├── mask.js                  # マスク系（グループ版）
│       ├── physics.js               # 物理系（グループ版）
│       ├── rotate.js                # 回転系（グループ版）
│       ├── special.js               # 特殊系（グループ版）
│       └── individual/              # 📂 個別エフェクトファイル
│           ├── index.js             # エフェクトレジストリ
│           ├── fade.js              # フェード
│           ├── slide.js             # スライド
│           ├── blur.js              # ブラー
│           ├── glitch.js            # グリッチ
│           └── ...                  # その他35個以上
└── samples/                         # サンプルページ
    ├── page1-news.html
    ├── page2-dashboard.html
    ├── page3-shop.html
    └── page4-sns.html
```

## 🎨 エフェクト一覧（全50種類以上）

### 基本エフェクト
- フェード / クロスフェード
- スライド（上下左右）
- ズーム（イン/アウト）

### 3Dエフェクト
- フリップ（水平/垂直）
- キューブ回転
- 3Dカード
- ページめくり

### 特殊エフェクト
- グリッチ
- ピクセル化
- 物理演算（落下・爆発）
- パーティクル
- 波紋
- モーフィング

## 🛠️ 使用技術

- [GSAP](https://greensock.com/gsap/) - アニメーションライブラリ
- [html2canvas](https://html2canvas.hertzen.com/) - スクリーンキャプチャ
- [Matter.js](https://brm.io/matter-js/) - 2D物理エンジン
- [Three.js](https://threejs.org/) - 3Dグラフィックス

## ⚙️ カスタマイズ

### コンテンツの追加

`iframe-config.js` を編集してコンテンツを追加できます：

```javascript
const iframeContents = [
    {
        name: 'ページ名',
        url: 'path/to/page.html',
        icon: '🎯'
    },
    // ...
];
```

## 📄 ライセンス

MIT License

## 👤 作成者

IFORCOM
