"""
OpenAI動画生成モジュール
Sora APIを使用してキャラクターアニメーション動画を生成

API仕様（2025年版）:
- POST /videos で生成ジョブを作成
- GET /videos/{id} でステータス確認
- GET /videos/{id}/content でダウンロード
"""

import os
import time
import requests
from pathlib import Path
from openai import OpenAI

class VideoGenerator:
    # 有効なサイズ一覧
    VALID_SIZES = ["720x1280", "1280x720", "1024x1792", "1792x1024"]
    # 有効な長さ一覧
    VALID_SECONDS = ["4", "8", "12"]
    
    def __init__(self, api_key: str = None):
        """
        初期化
        api_key: OpenAI APIキー（Noneの場合は環境変数から取得）
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            print("警告: OPENAI_API_KEY が設定されていません")
            print("環境変数に設定するか、--api-key オプションで指定してください")
        
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
    
    def generate(self, prompt: str, output_path: str, duration: int = 8) -> str:
        """
        動画を生成
        
        prompt: 動画生成プロンプト
        output_path: 出力ファイルパス
        duration: 動画の長さ（秒）: 4, 8, 12 のいずれか
        
        returns: 生成された動画のパス
        """
        if not self.client:
            print("APIキーが設定されていないため、デモモードで実行します")
            return self._demo_generate(prompt, output_path)
        
        # durationを有効な値に変換
        seconds = str(min([int(s) for s in self.VALID_SECONDS if int(s) >= duration], default=8))
        
        print(f"プロンプト: {prompt}")
        print(f"長さ: {seconds}秒")
        print("動画生成中...")
        
        try:
            # Sora API呼び出し（2025年版API仕様）
            # videos.create() でジョブを作成
            enhanced_prompt = self._enhance_prompt(prompt)
            print(f"最適化プロンプト: {enhanced_prompt}")
            
            response = self.client.videos.create(
                model="sora-2",  # sora-2 または sora-2-pro
                prompt=enhanced_prompt,
                seconds=seconds,  # "4", "8", "12"
                size="1280x720",  # 横向き推奨（スプライト用）
            )
            
            # 生成完了を待機
            video_id = response.id
            print(f"生成ID: {video_id}")
            print(f"初期状態: {response.status}")
            
            # ポーリングでステータス確認
            video = response
            poll_interval = 10  # 10秒間隔
            
            while video.status in ["queued", "in_progress"]:
                progress = getattr(video, 'progress', 0) or 0
                print(f"  状態: {video.status} ({progress}%)")
                time.sleep(poll_interval)
                video = self.client.videos.retrieve(video_id)
            
            if video.status == "failed":
                error_msg = getattr(video, 'error', {})
                raise Exception(f"動画生成失敗: {error_msg}")
            
            if video.status != "completed":
                raise Exception(f"予期しないステータス: {video.status}")
            
            print("生成完了！ダウンロード中...")
            
            # 動画をダウンロード（SDK経由）
            content_response = self.client.videos.download_content(video_id)
            self._save_video_content(content_response, output_path)
            
            print(f"動画保存完了: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"エラー: {e}")
            print("デモモードにフォールバック...")
            return self._demo_generate(prompt, output_path)
    
    def _enhance_prompt(self, prompt: str) -> str:
        """
        スプライトアニメーション用にプロンプトを最適化
        """
        enhancements = [
            "side view",  # 横向き
            "clear silhouette",  # 明確なシルエット
            "consistent character design",  # 一貫したデザイン
            "simple white background",  # シンプルな白背景
            "smooth animation",  # スムーズなアニメーション
            "loopable motion",  # ループ可能な動き
            "2D animation style",  # 2Dアニメーションスタイル
        ]
        
        enhanced = f"{prompt}, {', '.join(enhancements)}"
        return enhanced
    
    def _save_video_content(self, content_response, output_path: str):
        """動画コンテンツを保存"""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # SDK応答からバイナリデータを取得
        # arrayBufferまたはblobとして取得される可能性
        try:
            if hasattr(content_response, 'read'):
                # ストリームレスポンスの場合
                with open(output_path, 'wb') as f:
                    for chunk in content_response.iter_bytes(chunk_size=8192):
                        f.write(chunk)
            elif hasattr(content_response, 'content'):
                # バイナリコンテンツの場合
                with open(output_path, 'wb') as f:
                    f.write(content_response.content)
            else:
                # その他の場合（blobなど）
                import asyncio
                blob = asyncio.run(content_response.blob()) if asyncio.iscoroutinefunction(content_response.blob) else content_response.blob()
                with open(output_path, 'wb') as f:
                    f.write(blob)
        except Exception as e:
            print(f"保存方法を自動検出中... {e}")
            # フォールバック：直接バイト書き込み
            with open(output_path, 'wb') as f:
                f.write(bytes(content_response))

    def _download_video(self, url: str, output_path: str):
        """動画をURLからダウンロード（フォールバック用）"""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    
    def _demo_generate(self, prompt: str, output_path: str) -> str:
        """
        デモモード: サンプル動画のパスを返す
        実際のAPI呼び出しなしでテスト可能
        """
        print("[デモモード] 実際の動画生成はスキップされました")
        print(f"  プロンプト: {prompt}")
        print(f"  出力先: {output_path}")
        print("")
        print("実際に使用するには:")
        print("  1. OpenAI APIキーを取得")
        print("  2. 環境変数 OPENAI_API_KEY を設定")
        print("  3. または既存の動画ファイルを用意して extract コマンドを使用")
        
        # デモ用の空ファイル作成
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_path).touch()
        
        return output_path


# スプライトアニメーション用のプロンプトテンプレート
PROMPT_TEMPLATES = {
    "walk": "A cute character walking cycle animation, {style}, side view, 4 frames",
    "run": "A character running animation, {style}, side view, dynamic movement",
    "jump": "A character jumping animation, {style}, side view, anticipation and landing",
    "idle": "A character idle breathing animation, {style}, subtle movement",
    "attack": "A character attack animation, {style}, side view, powerful motion",
    "snowman": "A cute character rolling a snowball and building a snowman, {style}, side view",
}

def get_template(action: str, style: str = "pixel art style") -> str:
    """プロンプトテンプレートを取得"""
    template = PROMPT_TEMPLATES.get(action, PROMPT_TEMPLATES["walk"])
    return template.format(style=style)
