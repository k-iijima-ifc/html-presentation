# GSAP iframeエフェクト デモ

⚠️ **実験用リポジトリ** - 技術検証・学習目的

## デモ

https://k-iijima-ifc.github.io/html-presentation/iframe-gsap-demo-modular.html

## 使い方

1. リポジトリをクローン
2. `iframe-gsap-demo-modular.html` をブラウザで開く
3. 右サイドバーからエフェクトを選択
4. 上部タブでページを切り替え

## エフェクトの追加方法

`js/effects/[カテゴリ]/` に新しいファイルを作成:

```javascript
/**
 * カスタムエフェクト
 */
function effect_myEffect(current, next, container) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    
    gsap.timeline()
        .to(current, { opacity: 0, duration: 0.5 })
        .to(next, { opacity: 1, duration: 0.5, onComplete: () => finishAnimation(current) });
}

effectRegistry.register('myEffect', effect_myEffect, { 
    name: 'マイエフェクト', 
    category: 'basic' 
});
```

HTMLにscriptタグを追加し、`main.js`のeffectGroupsに追加。

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
