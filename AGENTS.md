# AGENTS.md - AIエージェント向けガイド

このファイルはAIエージェント（GitHub Copilot、Claude等）がこのプロジェクトを理解し、適切に作業するためのガイドです。

## プロジェクト概要

iframeベースの画面遷移エフェクトデモ。GSAPを中心に、Three.js、Matter.js、PixiJS等を使用した多彩なトランジションエフェクトを実装。

## ディレクトリ構造

```
├── iframe-gsap-demo-modular.html   # メインHTML（エフェクトJS読み込み）
├── iframe-config.js                # コンテンツ設定（表示ページ一覧）
├── js/
│   ├── main.js                     # メインロジック（effectGroups定義）
│   └── effects/
│       ├── index.js                # effectRegistry（エフェクト管理）
│       ├── basic/                  # 基本エフェクト
│       ├── 3d/                     # 3Dエフェクト
│       ├── rotate/                 # 回転エフェクト
│       ├── physics/                # 物理エフェクト
│       ├── mask/                   # マスクエフェクト
│       ├── filter/                 # フィルターエフェクト
│       ├── special/                # スペシャルエフェクト
│       ├── collapse/               # 崩壊エフェクト
│       └── iforcom/                # IFORCOM専用
├── css/
│   ├── main.css                    # メインスタイル
│   └── effects/                    # エフェクト専用CSS
├── assets/                         # 画像・スプライト等
├── samples/                        # サンプルページHTML
└── tools/
    └── sprite-generator/           # スプライト生成ツール（Docker）
```

## エフェクト追加手順（重要）

### 必要な作業（3ステップ）

1. **JSファイル作成**: `js/effects/[カテゴリ]/[エフェクト名].js`
2. **HTML登録**: `iframe-gsap-demo-modular.html` にscriptタグ追加
3. **メニュー登録**: `js/main.js` の `effectGroups` に追加

### エフェクト関数テンプレート

```javascript
/**
 * エフェクト名
 * 説明
 */
async function effect_エフェクト名(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 1 });

    // ここにアニメーション処理を実装

    // 終了時は必ず以下を呼ぶ
    gsap.set(next, { opacity: 1 });
    gsap.set(current, { opacity: 0 });
    blocksContainer.innerHTML = '';
    if (typeof finishAnimation === 'function') {
        finishAnimation(current);
    }
}

// 登録（必須）
if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('エフェクトID', effect_エフェクト名, {
        name: '表示名',
        category: 'カテゴリID',
        description: '説明'
    });
}
```

### カテゴリ一覧

| カテゴリID | グループ名 | 用途 |
|-----------|-----------|------|
| `basic` | 基本 | フェード、スライド、ズーム |
| `3d` | 3D | フリップ、キューブ、ペーパーロール |
| `rotate` | 回転 | 回転、スパイラル |
| `physics` | 物理 | バウンス、弾性、スイング |
| `mask` | マスク | ワイプ、アイリス、ブラインド |
| `filter` | フィルター | ぼかし、ピクセル化、フラッシュ |
| `special` | スペシャル | グリッチ、マトリックス、炎等 |
| `sprite` | スプライト | スプライトアニメーション |
| `collapse` | 崩壊 | 物理崩壊系 |
| `iforcom` | IFORCOM | IFORCOM専用ブランドエフェクト |

### 新しいカテゴリ追加

`js/main.js` で2箇所を編集:

```javascript
// 1. effectGroups にグループ追加
const effectGroups = {
    // ...
    '新グループ名': ['effect1', 'effect2'],
};

// 2. groupKeyMap にキー追加
const groupKeyMap = {
    // ...
    '新グループ名': 'newcategory',
};
```

## スプライトアニメーション

### スプライト画像の配置

`assets/` フォルダに配置（例: `assets/boy_sprite.png`）

### スプライト生成ツール

`tools/sprite-generator/` にDockerベースのツールあり。

```bash
cd tools/sprite-generator
docker compose run --rm sprite-generator python sprite_generator.py full \
    --prompt "プロンプト" \
    --output /app/output/sprite.png \
    --frames 12
```

**注意**: OpenAI APIキーが必要（`.env`に設定）

## 重要なグローバル変数・関数

| 名前 | 場所 | 説明 |
|------|------|------|
| `effectRegistry` | `js/effects/index.js` | エフェクト登録・取得 |
| `finishAnimation(current)` | `js/main.js` | アニメーション終了通知 |
| `gsap` | 外部ライブラリ | アニメーションエンジン |
| `blocksContainer` | HTML要素 | エフェクト描画用コンテナ |

## 開発サーバー起動

詳細は [README.md](README.md#ローカル開発サーバー) を参照。

```bash
# 推奨: Docker
docker compose up

# または Python
python -m http.server 8080
```

→ http://localhost:8080 でアクセス

## 注意事項

1. **エフェクト関数は必ず`effect_`プレフィックス**をつける
2. **アニメーション終了時は`finishAnimation()`を必ず呼ぶ**
3. **`blocksContainer`は使用後に`innerHTML = ''`でクリア**
4. **scriptタグのバージョンパラメータ（`?v=YYYYMMDD`）を更新してキャッシュ対策**
5. **HTMLファイルのscriptタグの順序は依存関係を考慮**（index.js → 各エフェクト → main.js）
6. **Three.js/PixiJSを使用する場合はES Modules**（下記参照）

## ES Modulesエフェクト（Three.js/PixiJS使用時）

Three.js（r160以降）とPixiJS（8.x以降）はES Modules専用のため、以下の形式で作成：

```javascript
// ES Modulesインポート
import * as THREE from 'three';
// または
import { Application, Sprite, Texture, Filter, GlProgram, Graphics } from 'pixi.js';

async function effect_エフェクト名(current, next, container) {
    // 実装
}

// グローバルにエクスポート（effectRegistryから呼び出すため）
window.effect_エフェクト名 = effect_エフェクト名;

// エフェクト登録
if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('エフェクトID', effect_エフェクト名, { ... });
}
```

HTMLでは `type="module"` を指定：
```html
<script type="module" src="js/effects/3d/paperRoll.js?v=20260205"></script>
```

**現在ES Modulesを使用しているエフェクト:**
- `paperRoll.js` / `paperRollFront.js` (Three.js r180)
- `rainRipple.js` (PixiJS 8.13.2)
