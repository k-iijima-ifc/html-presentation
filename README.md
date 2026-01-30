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
├── iframe-gsap-demo-modular.html  # メインHTML
├── iframe-config.js               # コンテンツ設定
├── css/
│   ├── main.css                   # メインスタイル
│   └── effects/                   # エフェクト専用CSS
│       ├── collapse.css
│       ├── glitch.css
│       └── iforcom.css
├── js/
│   ├── main.js                    # メインロジック
│   └── effects/                   # エフェクトモジュール
│       ├── 3d.js                  # 3D系エフェクト
│       ├── basic.js               # 基本エフェクト（フェード、スライド等）
│       ├── collapse.js            # 崩壊系エフェクト
│       ├── filter.js              # フィルター系エフェクト
│       ├── iforcom.js             # IFORCOM専用エフェクト
│       ├── mask.js                # マスク系エフェクト
│       ├── physics.js             # 物理演算エフェクト
│       ├── rotate.js              # 回転系エフェクト
│       └── special.js             # 特殊エフェクト
└── samples/                       # サンプルページ
    ├── page1-news.html
    ├── page2-dashboard.html
    ├── page3-shop.html
    └── page4-sns.html
```

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
