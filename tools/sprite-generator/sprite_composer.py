"""
スプライト合成モジュール
抽出したフレームをスプライトシートに合成
"""

import os
import math
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
from typing import List, Tuple, Optional

class SpriteComposer:
    def __init__(self):
        self.frames: List[Image.Image] = []
    
    def compose(self, input_dir: str, output_path: str,
                cols: int = 0,
                frame_size: Optional[Tuple[int, int]] = None,
                padding: int = 0,
                remove_bg: bool = False,
                bg_color: Tuple[int, int, int] = None) -> str:
        """
        フレーム画像をスプライトシートに合成
        
        input_dir: フレーム画像フォルダ
        output_path: 出力スプライトシート
        cols: 列数（0=自動計算）
        frame_size: フレームサイズ (width, height)、None=自動
        padding: フレーム間のパディング
        remove_bg: 背景除去
        bg_color: 除去する背景色 (R, G, B)、None=自動検出
        
        returns: 出力ファイルパス
        """
        # フレーム画像を読み込み
        frame_files = sorted([
            f for f in os.listdir(input_dir) 
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
        ])
        
        if not frame_files:
            print(f"エラー: フレーム画像が見つかりません: {input_dir}")
            return ""
        
        print(f"フレーム数: {len(frame_files)}")
        
        self.frames = []
        for f in frame_files:
            img = Image.open(os.path.join(input_dir, f)).convert('RGBA')
            self.frames.append(img)
        
        # 背景除去
        if remove_bg:
            print("背景除去中...")
            self.frames = [self._remove_background(f, bg_color) for f in self.frames]
        
        # フレームサイズを決定
        if frame_size is None:
            max_w = max(f.width for f in self.frames)
            max_h = max(f.height for f in self.frames)
            frame_size = (max_w, max_h)
        
        # フレームをリサイズ・センタリング
        self.frames = [self._normalize_frame(f, frame_size) for f in self.frames]
        
        # 列数を決定
        if cols <= 0:
            cols = self._calculate_optimal_cols(len(self.frames))
        
        rows = math.ceil(len(self.frames) / cols)
        
        # スプライトシート作成
        sprite_w = cols * (frame_size[0] + padding) - padding
        sprite_h = rows * (frame_size[1] + padding) - padding
        
        sprite_sheet = Image.new('RGBA', (sprite_w, sprite_h), (0, 0, 0, 0))
        
        for i, frame in enumerate(self.frames):
            row = i // cols
            col = i % cols
            x = col * (frame_size[0] + padding)
            y = row * (frame_size[1] + padding)
            sprite_sheet.paste(frame, (x, y), frame)
        
        # 保存
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"スプライトシート作成完了:")
        print(f"  サイズ: {sprite_w} x {sprite_h}")
        print(f"  レイアウト: {cols}列 x {rows}行")
        print(f"  フレームサイズ: {frame_size[0]} x {frame_size[1]}")
        print(f"  出力: {output_path}")
        
        return output_path
    
    def _remove_background(self, img: Image.Image, 
                           bg_color: Optional[Tuple[int, int, int]] = None) -> Image.Image:
        """
        背景を除去して透過にする
        """
        img_array = np.array(img)
        
        if bg_color is None:
            # 四隅のピクセルから背景色を推定
            corners = [
                img_array[0, 0, :3],
                img_array[0, -1, :3],
                img_array[-1, 0, :3],
                img_array[-1, -1, :3]
            ]
            bg_color = tuple(np.median(corners, axis=0).astype(int))
        
        # 背景色に近いピクセルを透過に
        tolerance = 30
        bg_array = np.array(bg_color)
        
        diff = np.abs(img_array[:, :, :3].astype(int) - bg_array)
        mask = np.all(diff < tolerance, axis=2)
        
        # アルファチャンネルを更新
        if img_array.shape[2] == 4:
            img_array[:, :, 3] = np.where(mask, 0, img_array[:, :, 3])
        else:
            alpha = np.where(mask, 0, 255).astype(np.uint8)
            img_array = np.dstack([img_array, alpha])
        
        return Image.fromarray(img_array)
    
    def _normalize_frame(self, img: Image.Image, 
                         target_size: Tuple[int, int]) -> Image.Image:
        """
        フレームを指定サイズに正規化（中央配置）
        """
        # トリミング（透過部分を除去）
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        # アスペクト比を維持してリサイズ
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # 中央配置
        result = Image.new('RGBA', target_size, (0, 0, 0, 0))
        offset_x = (target_size[0] - img.width) // 2
        offset_y = target_size[1] - img.height  # 下揃え
        result.paste(img, (offset_x, offset_y), img)
        
        return result
    
    def _calculate_optimal_cols(self, frame_count: int) -> int:
        """
        フレーム数から最適な列数を計算
        """
        if frame_count <= 4:
            return frame_count
        elif frame_count <= 8:
            return 4
        elif frame_count <= 12:
            return 4  # 3行4列
        else:
            # 正方形に近い形を目指す
            return math.ceil(math.sqrt(frame_count))
    
    def compose_rows(self, input_dir: str, output_path: str,
                     row_definitions: List[List[int]],
                     frame_size: Optional[Tuple[int, int]] = None,
                     remove_bg: bool = False) -> str:
        """
        複数行のスプライトシートを作成（行ごとにフレーム指定）
        
        row_definitions: 各行に含めるフレームのインデックスリスト
                        例: [[0,1,2,3], [4,5,6,7,8,9], [10,11,12]]
        """
        # フレーム画像を読み込み
        frame_files = sorted([
            f for f in os.listdir(input_dir) 
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
        ])
        
        all_frames = []
        for f in frame_files:
            img = Image.open(os.path.join(input_dir, f)).convert('RGBA')
            all_frames.append(img)
        
        if remove_bg:
            all_frames = [self._remove_background(f) for f in all_frames]
        
        # フレームサイズを決定
        if frame_size is None:
            max_w = max(f.width for f in all_frames)
            max_h = max(f.height for f in all_frames)
            frame_size = (max_w, max_h)
        
        all_frames = [self._normalize_frame(f, frame_size) for f in all_frames]
        
        # 各行の最大列数
        max_cols = max(len(row) for row in row_definitions)
        
        # スプライトシート作成
        sprite_w = max_cols * frame_size[0]
        sprite_h = len(row_definitions) * frame_size[1]
        
        sprite_sheet = Image.new('RGBA', (sprite_w, sprite_h), (0, 0, 0, 0))
        
        for row_idx, row in enumerate(row_definitions):
            for col_idx, frame_idx in enumerate(row):
                if frame_idx < len(all_frames):
                    x = col_idx * frame_size[0]
                    y = row_idx * frame_size[1]
                    sprite_sheet.paste(all_frames[frame_idx], (x, y), all_frames[frame_idx])
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        sprite_sheet.save(output_path, 'PNG')
        
        print(f"スプライトシート作成完了: {output_path}")
        return output_path

    def create_animation_video(self, input_dir: str, output_path: str,
                                fps: int = 12,
                                loop_count: int = 3,
                                frame_size: Optional[Tuple[int, int]] = None,
                                remove_bg: bool = False,
                                bg_color_video: Tuple[int, int, int] = (255, 255, 255)) -> str:
        """
        フレーム画像からアニメーション動画を生成
        
        input_dir: フレーム画像フォルダ
        output_path: 出力動画パス (.mp4)
        fps: フレームレート
        loop_count: ループ回数
        frame_size: フレームサイズ (width, height)、None=自動
        remove_bg: 背景除去処理を行うか
        bg_color_video: 動画の背景色 (R, G, B)
        
        returns: 出力ファイルパス
        """
        # フレーム画像を読み込み
        frame_files = sorted([
            f for f in os.listdir(input_dir) 
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
        ])
        
        if not frame_files:
            print(f"エラー: フレーム画像が見つかりません: {input_dir}")
            return ""
        
        print(f"アニメーション動画生成中...")
        print(f"  フレーム数: {len(frame_files)}")
        print(f"  FPS: {fps}")
        print(f"  ループ: {loop_count}回")
        
        frames = []
        for f in frame_files:
            img = Image.open(os.path.join(input_dir, f)).convert('RGBA')
            frames.append(img)
        
        # 背景除去
        if remove_bg:
            frames = [self._remove_background(f) for f in frames]
        
        # フレームサイズを決定
        if frame_size is None:
            max_w = max(f.width for f in frames)
            max_h = max(f.height for f in frames)
            frame_size = (max_w, max_h)
        
        # フレームを正規化
        frames = [self._normalize_frame(f, frame_size) for f in frames]
        
        # RGBA → RGB（動画用に背景色を適用）
        rgb_frames = []
        for frame in frames:
            bg = Image.new('RGB', frame_size, bg_color_video)
            bg.paste(frame, (0, 0), frame)
            rgb_frames.append(np.array(bg))
        
        # ループ分を追加
        all_frames = rgb_frames * loop_count
        
        # OpenCVで動画作成
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, frame_size)
        
        for frame in all_frames:
            # RGB → BGR
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            out.write(frame_bgr)
        
        out.release()
        
        # 動画の長さを計算
        duration = len(all_frames) / fps
        
        print(f"アニメーション動画作成完了:")
        print(f"  サイズ: {frame_size[0]} x {frame_size[1]}")
        print(f"  長さ: {duration:.2f}秒")
        print(f"  出力: {output_path}")
        
        return output_path

    def create_animation_gif(self, input_dir: str, output_path: str,
                              fps: int = 12,
                              loop: int = 0,
                              frame_size: Optional[Tuple[int, int]] = None,
                              remove_bg: bool = False) -> str:
        """
        フレーム画像からアニメーションGIFを生成
        
        input_dir: フレーム画像フォルダ
        output_path: 出力GIFパス (.gif)
        fps: フレームレート
        loop: ループ回数（0=無限ループ）
        frame_size: フレームサイズ
        remove_bg: 背景除去処理
        
        returns: 出力ファイルパス
        """
        frame_files = sorted([
            f for f in os.listdir(input_dir) 
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))
        ])
        
        if not frame_files:
            print(f"エラー: フレーム画像が見つかりません: {input_dir}")
            return ""
        
        print(f"アニメーションGIF生成中...")
        
        frames = []
        for f in frame_files:
            img = Image.open(os.path.join(input_dir, f)).convert('RGBA')
            frames.append(img)
        
        if remove_bg:
            frames = [self._remove_background(f) for f in frames]
        
        if frame_size is None:
            max_w = max(f.width for f in frames)
            max_h = max(f.height for f in frames)
            frame_size = (max_w, max_h)
        
        frames = [self._normalize_frame(f, frame_size) for f in frames]
        
        # RGBA → パレット画像に変換（GIF用）
        gif_frames = []
        for frame in frames:
            # 白背景に合成
            bg = Image.new('RGB', frame_size, (255, 255, 255))
            bg.paste(frame, (0, 0), frame)
            gif_frames.append(bg)
        
        # GIF保存
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        duration_ms = int(1000 / fps)
        
        gif_frames[0].save(
            output_path,
            save_all=True,
            append_images=gif_frames[1:],
            duration=duration_ms,
            loop=loop
        )
        
        print(f"アニメーションGIF作成完了: {output_path}")
        return output_path
