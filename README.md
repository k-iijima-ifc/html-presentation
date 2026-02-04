#  画面遷移エフェクト デモ

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen?logo=github)](https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-modular.html)
[![GSAP](https://img.shields.io/badge/GSAP-3.12.5-88CE02?logo=greensock)](https://greensock.com/gsap/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?logo=three.js)](https://threejs.org/)
[![Matter.js](https://img.shields.io/badge/Matter.js-0.19.0-4B5562)](https://brm.io/matter-js/)

⚠️ **実験用リポジトリ** - 技術検証・学習目的

## デモ

https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-modular.html

## 使い方

1. リポジトリをクローン
2. `iframe-gsap-demo-modular.html` をブラウザで開く
3. 右サイドバーからエフェクトを選択
4. 上部タブでページを切り替え

## エフェクトの追加方法

### 1. エフェクトファイルを作成

`js/effects/[カテゴリ]/` に新しいJSファイルを作成:

```javascript
/**
 * カスタムエフェクト
 * @param {HTMLElement} current - 現在表示中のページ
 * @param {HTMLElement} next - 次に表示するページ  
 * @param {HTMLElement} container - iframeコンテナ
 */
async function effect_myEffect(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 1 });
    
    // アニメーション処理
    gsap.timeline()
        .to(current, { opacity: 0, duration: 0.5 })
        .to(next, { opacity: 1, duration: 0.5, onComplete: () => {
            blocksContainer.innerHTML = '';
            if (typeof finishAnimation === 'function') {
                finishAnimation(current);
            }
        }});
}

// エフェクト登録（必須）
if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('myEffect', effect_myEffect, { 
        name: 'マイエフェクト',      // メニュー表示名
        category: 'special',         // カテゴリ（下記参照）
        description: 'エフェクトの説明'
    });
}
```

### 2. HTMLにscriptタグを追加

`iframe-gsap-demo-modular.html` の該当カテゴリセクションに追加:

```html
<script src="js/effects/special/myEffect.js?v=20260204"></script>
```

### 3. メニューグループに登録

`js/main.js` の `effectGroups` にエフェクトIDを追加:

```javascript
const effectGroups = {
    // ...
    'スペシャル': ['glitch', 'matrix', ..., 'myEffect'],  // ← 追加
    // ...
};
```

### カテゴリ一覧

| カテゴリID | グループ名 | フォルダ | 説明 |
|-----------|-----------|----------|------|
| `basic` | 基本 | `js/effects/basic/` | フェード、スライド等 |
| `3d` | 3D | `js/effects/3d/` | フリップ、キューブ等 |
| `rotate` | 回転 | `js/effects/rotate/` | 回転、スパイラル等 |
| `physics` | 物理 | `js/effects/physics/` | バウンス、弾性等 |
| `mask` | マスク | `js/effects/mask/` | ワイプ、アイリス等 |
| `filter` | フィルター | `js/effects/filter/` | ぼかし、ピクセル化等 |
| `special` | スペシャル | `js/effects/special/` | グリッチ、炎等 |
| `sprite` | スプライト | `js/effects/special/` | スプライトアニメーション |
| `collapse` | 崩壊 | `js/effects/collapse/` | 物理崩壊系 |
| `iforcom` | IFORCOM | `js/effects/iforcom/` | IFORCOM専用 |

### 新しいカテゴリを追加する場合

`js/main.js` で以下を追加:

```javascript
const effectGroups = {
    // ...
    '新カテゴリ': ['effect1', 'effect2'],  // グループ追加
};

const groupKeyMap = {
    // ...
    '新カテゴリ': 'newcategory',  // キーマップ追加
};
```

## 構成

```
├── iframe-gsap-demo-modular.html   # メインHTML
├── iframe-config.js                # コンテンツ設定
├── css/
│   ├── main.css
│   └── effects/
├── js/
│   ├── main.js
│   └── effects/
│       ├── index.js                # エフェクトレジストリ
│       ├── basic/                  # 基本（fade, slide, zoom等）
│       ├── 3d/                     # 3D（flip, cube, paperRoll等）
│       ├── rotate/                 # 回転（rotate, spiral, windmill）
│       ├── physics/                # 物理（bounce, elastic, swing）
│       ├── mask/                   # マスク（curtain, iris, wipe等）
│       ├── filter/                 # フィルター（blur, pixelate, flash）
│       ├── special/                # 特殊（glitch, matrix, shatter等）
│       ├── iforcom/                # IFORCOM専用
│       └── collapse/               # 崩壊系
└── samples/                        # サンプルページ
```

## 使用ライブラリ

- GSAP 3.12.5
- html2canvas 1.4.1
- Matter.js 0.19.0
- Three.js r128
