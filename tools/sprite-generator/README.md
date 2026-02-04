# スプライトアニメーション生成ツール

OpenAIの動画生成モデルを使用してキャラクターアニメーションを生成し、
スプライトシートに変換するツールです。

## 機能

1. **動画生成** - OpenAI Sora APIでキャラクターアニメーション動画を生成
2. **フレーム抽出** - 動画から特徴的なフレームを自動抽出
3. **スプライト合成** - 抽出したフレームをスプライトシートに合成

## セットアップ

```bash
# 依存パッケージのインストール
pip install -r requirements.txt

# OpenAI APIキーの設定
set OPENAI_API_KEY=your-api-key-here
```

## 使い方

### GUIモード

```bash
python sprite_generator.py gui
```

### コマンドラインモード

#### 1. 動画生成
```bash
python sprite_generator.py generate --prompt "A cute character walking cycle animation, pixel art style" --output output/video.mp4
```

#### 2. フレーム抽出
```bash
python sprite_generator.py extract --input output/video.mp4 --output output/frames --mode keyframes --count 12
```

#### 3. スプライト合成
```bash
python sprite_generator.py compose --input output/frames --output output/sprite.png --background
```

#### 一括実行
```bash
python sprite_generator.py full --prompt "A character building a snowman" --output output/sprite.png --frames 13
```

## 抽出モード

- `keyframes` - 動きの変化点を自動検出して重要なフレームを抽出（推奨）
- `interval` - 一定間隔でフレームを抽出
- `all` - 全フレームを抽出

## プロンプトテンプレート

よく使うアニメーションパターンのテンプレートが用意されています：

- `walk` - 歩行サイクル
- `run` - 走行アニメーション
- `jump` - ジャンプ
- `idle` - 待機モーション
- `attack` - 攻撃モーション
- `snowman` - 雪だるま作成

## スプライトシート形式

出力されるスプライトシートは以下の形式です：

- フォーマット: PNG（透過対応）
- レイアウト: 自動計算（または列数指定）
- 背景: 透過（オプションで背景除去）

### カスタム行構成

`compose_rows`メソッドを使用すると、行ごとに異なるフレーム数のスプライトシートを作成できます：

```python
composer = SpriteComposer()
composer.compose_rows(
    "output/frames",
    "output/sprite.png",
    row_definitions=[
        [0, 1, 2, 3],      # 1行目: 歩行フレーム
        [4, 5, 6, 7, 8, 9], # 2行目: 転がしフレーム
        [10, 11, 12]       # 3行目: 構築フレーム
    ],
    remove_bg=True
)
```

## Tips

### スプライト用プロンプトの書き方

良いスプライトアニメーションを生成するためのポイント：

1. **横向き (side view)** を指定 - 2Dゲーム向け
2. **シンプルな背景** を指定 - 背景除去がしやすい
3. **一貫したキャラクターデザイン** を指定
4. **ループ可能な動き** を指定 - 歩行/走行サイクル向け

例：
```
A cute chibi character walking cycle animation, 
side view, simple solid color background, 
consistent character design, smooth looping motion,
pixel art style, 4 frames
```

### 背景除去の注意点

- 単色背景の動画は背景除去がうまくいきます
- 複雑な背景の場合は手動での調整が必要な場合があります
- 緑/青のクロマキー背景を指定すると除去精度が上がります

## トラブルシューティング

### OpenAI APIエラー
- APIキーが正しく設定されているか確認
- Sora APIへのアクセス権限があるか確認

### 動画が開けない
- OpenCVが対応しているコーデックか確認
- `opencv-python-headless`の代わりに`opencv-python`を使用

### 背景除去がうまくいかない
- `--bg-color`オプションで背景色を手動指定
- 動画生成時に単色背景を指定
