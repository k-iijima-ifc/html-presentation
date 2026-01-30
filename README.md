# 🎬 GSAP iframeエフェクト デモ

iframeコンテンツの切り替え時に様々なアニメーションエフェクトを適用できるデモアプリケーションです。

## ✨ 特徴

- **30種類以上のエフェクト** - フェード、スライド、3D回転、物理演算など豊富なトランジション
- **モジュラー設計** - エフェクトごとにファイル分割された保守性の高い構成
- **設定ファイル対応** - `iframe-config.js` でコンテンツを簡単に管理
- **レスポンシブ対応** - 様々な画面サイズに対応

## 🚀 デモ

1. `iframe-gsap-demo-modular.html` をブラウザで開く
2. 右サイドバーからエフェクトを選択
3. 上部のタブでページを切り替えてエフェクトを確認

## 📁 プロジェクト構成

```
├── iframe-gsap-demo-modular.html     # メインHTML（グループ別ファイル版）
├── iframe-gsap-demo-individual.html  # メインHTML（個別ファイル版）⭐ NEW
├── iframe-config.js                  # コンテンツ設定
├── css/
│   ├── main.css                      # メインスタイル
│   └── effects/                      # エフェクト専用CSS
│       ├── collapse.css
│       ├── glitch.css
│       └── iforcom.css
├── js/
│   ├── main.js                       # メインロジック（グループ版）
│   ├── main-individual.js            # メインロジック（個別版）
│   └── effects/
│       ├── 3d.js                     # 3D系エフェクト（グループ版）
│       ├── basic.js                  # 基本エフェクト（グループ版）
│       ├── ...                       # その他グループ版ファイル
│       └── individual/               # ⭐ 個別エフェクトファイル
│           ├── index.js              # エフェクト統合
│           ├── fade.js               # フェード
│           ├── slide.js              # スライド
│           ├── flip.js               # フリップ
│           ├── glitch.js             # グリッチ
│           └── ...                   # 各エフェクト1ファイル
└── samples/                          # サンプルページ
    ├── page1-news.html
    ├── page2-dashboard.html
    ├── page3-shop.html
    └── page4-sns.html
```

## 📂 ファイル構成の選択

### グループ別ファイル版（従来）
- `iframe-gsap-demo-modular.html` を使用
- エフェクトがカテゴリごとにまとまっている
- ファイル数が少なくシンプル

### 個別ファイル版（新規）⭐
- `iframe-gsap-demo-individual.html` を使用
- 1エフェクト = 1ファイル
- エフェクトの追加・削除・編集が容易
- 他プロジェクトへのコピーが簡単

## 🎨 エフェクト一覧

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
