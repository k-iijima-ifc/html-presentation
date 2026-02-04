"""
フレーム抽出モジュール
動画から特徴的なフレームを抽出
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional

class FrameExtractor:
    def __init__(self):
        self.frames: List[np.ndarray] = []
        self.keyframe_indices: List[int] = []
    
    def extract(self, video_path: str, output_dir: str, 
                mode: str = 'keyframes', 
                interval: float = 0.2,
                count: int = 12) -> List[str]:
        """
        動画からフレームを抽出
        
        video_path: 入力動画ファイル
        output_dir: 出力フォルダ
        mode: 抽出モード ('all', 'keyframes', 'interval')
        interval: 間隔（秒）- intervalモード用
        count: 抽出フレーム数の目安
        
        returns: 抽出されたフレーム画像のパスリスト
        """
        if not os.path.exists(video_path):
            print(f"エラー: 動画ファイルが見つかりません: {video_path}")
            return []
        
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"エラー: 動画を開けません: {video_path}")
            return []
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"動画情報:")
        print(f"  FPS: {fps:.2f}")
        print(f"  総フレーム数: {total_frames}")
        print(f"  長さ: {duration:.2f}秒")
        print(f"  抽出モード: {mode}")
        
        # 全フレーム読み込み
        self.frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            self.frames.append(frame)
        cap.release()
        
        # モードに応じてフレーム選択
        if mode == 'all':
            selected_indices = list(range(len(self.frames)))
        elif mode == 'interval':
            frame_interval = int(fps * interval)
            selected_indices = list(range(0, len(self.frames), max(1, frame_interval)))
        elif mode == 'keyframes':
            selected_indices = self._detect_keyframes(count)
        else:
            selected_indices = list(range(len(self.frames)))
        
        # フレームを保存
        output_paths = []
        for i, idx in enumerate(selected_indices):
            if idx < len(self.frames):
                output_path = os.path.join(output_dir, f"frame_{i:03d}.png")
                cv2.imwrite(output_path, self.frames[idx])
                output_paths.append(output_path)
        
        print(f"抽出完了: {len(output_paths)}フレーム -> {output_dir}")
        return output_paths
    
    def _detect_keyframes(self, target_count: int) -> List[int]:
        """
        特徴的なキーフレームを検出
        動きの変化点を分析して重要なフレームを抽出
        """
        if len(self.frames) <= target_count:
            return list(range(len(self.frames)))
        
        # フレーム間の差分を計算
        differences = []
        for i in range(1, len(self.frames)):
            diff = cv2.absdiff(self.frames[i], self.frames[i-1])
            diff_score = np.mean(diff)
            differences.append((i, diff_score))
        
        # 差分でソートして上位を選択（動きの変化点）
        differences.sort(key=lambda x: x[1], reverse=True)
        
        # 均等に分散させるため、時間的に近すぎるフレームを除外
        min_gap = len(self.frames) // (target_count * 2)
        selected = [0]  # 最初のフレームは必ず含める
        
        for idx, score in differences:
            if len(selected) >= target_count - 1:
                break
            # 既存の選択フレームと十分離れているか確認
            if all(abs(idx - s) > min_gap for s in selected):
                selected.append(idx)
        
        # 最後のフレームも追加
        if len(self.frames) - 1 not in selected:
            selected.append(len(self.frames) - 1)
        
        selected.sort()
        
        # 目標数に調整
        if len(selected) > target_count:
            # 均等にサンプリング
            step = len(selected) / target_count
            selected = [selected[int(i * step)] for i in range(target_count)]
        
        print(f"キーフレーム検出: {len(selected)}フレーム")
        return selected
    
    def extract_with_preview(self, video_path: str) -> List[Tuple[int, np.ndarray]]:
        """
        プレビュー用：全フレームを読み込んで返す
        GUIでの手動選択用
        """
        cap = cv2.VideoCapture(video_path)
        frames = []
        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # BGR to RGB for display
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append((idx, frame_rgb))
            idx += 1
        cap.release()
        return frames
    
    def analyze_motion(self, frames: List[np.ndarray]) -> dict:
        """
        動きの分析
        各フレームの動き量を返す
        """
        if len(frames) < 2:
            return {"motion_scores": [], "peak_frames": []}
        
        motion_scores = []
        for i in range(1, len(frames)):
            diff = cv2.absdiff(frames[i], frames[i-1])
            gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY) if len(diff.shape) == 3 else diff
            score = np.mean(gray_diff)
            motion_scores.append(score)
        
        # ピークフレーム（動きが大きい）を検出
        threshold = np.mean(motion_scores) + np.std(motion_scores)
        peak_frames = [i+1 for i, score in enumerate(motion_scores) if score > threshold]
        
        return {
            "motion_scores": motion_scores,
            "peak_frames": peak_frames,
            "avg_motion": np.mean(motion_scores),
            "max_motion": max(motion_scores) if motion_scores else 0
        }
