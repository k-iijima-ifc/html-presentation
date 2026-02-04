"""
スプライトアニメーション生成ツール
OpenAI動画生成 → フレーム抽出 → スプライトシート合成
"""

import os
import sys
import json
import argparse
from pathlib import Path

# モジュールインポート
from video_generator import VideoGenerator
from frame_extractor import FrameExtractor
from sprite_composer import SpriteComposer

def main():
    parser = argparse.ArgumentParser(description='スプライトアニメーション生成ツール')
    subparsers = parser.add_subparsers(dest='command', help='コマンド')
    
    # 動画生成コマンド
    gen_parser = subparsers.add_parser('generate', help='OpenAIで動画生成')
    gen_parser.add_argument('--prompt', '-p', required=True, help='動画生成プロンプト')
    gen_parser.add_argument('--output', '-o', default='output/video.mp4', help='出力ファイル')
    gen_parser.add_argument('--duration', '-d', type=int, default=5, help='動画の長さ(秒)')
    
    # フレーム抽出コマンド
    ext_parser = subparsers.add_parser('extract', help='動画からフレーム抽出')
    ext_parser.add_argument('--input', '-i', required=True, help='入力動画ファイル')
    ext_parser.add_argument('--output', '-o', default='output/frames', help='出力フォルダ')
    ext_parser.add_argument('--mode', '-m', choices=['all', 'keyframes', 'interval'], default='keyframes',
                           help='抽出モード: all=全フレーム, keyframes=特徴的フレーム, interval=一定間隔')
    ext_parser.add_argument('--interval', type=float, default=0.2, help='間隔(秒) intervalモード用')
    ext_parser.add_argument('--count', '-c', type=int, default=12, help='抽出フレーム数の目安')
    
    # スプライト合成コマンド
    comp_parser = subparsers.add_parser('compose', help='フレームをスプライトシートに合成')
    comp_parser.add_argument('--input', '-i', required=True, help='フレーム画像フォルダ')
    comp_parser.add_argument('--output', '-o', default='output/sprite.png', help='出力スプライトシート')
    comp_parser.add_argument('--cols', type=int, default=0, help='列数(0=自動)')
    comp_parser.add_argument('--size', '-s', type=int, nargs=2, default=[0, 0], help='フレームサイズ(幅 高さ)')
    comp_parser.add_argument('--padding', type=int, default=0, help='フレーム間のパディング')
    comp_parser.add_argument('--background', '-b', action='store_true', help='背景除去')
    
    # ワンショットコマンド（全工程実行）
    full_parser = subparsers.add_parser('full', help='全工程を一括実行')
    full_parser.add_argument('--prompt', '-p', required=True, help='動画生成プロンプト')
    full_parser.add_argument('--output', '-o', default='output/sprite.png', help='出力スプライトシート')
    full_parser.add_argument('--frames', '-f', type=int, default=12, help='フレーム数')
    
    # GUIモード
    gui_parser = subparsers.add_parser('gui', help='GUIモードで起動')
    
    args = parser.parse_args()
    
    if args.command == 'generate':
        generator = VideoGenerator()
        generator.generate(args.prompt, args.output, args.duration)
        
    elif args.command == 'extract':
        extractor = FrameExtractor()
        extractor.extract(args.input, args.output, args.mode, args.interval, args.count)
        
    elif args.command == 'compose':
        composer = SpriteComposer()
        composer.compose(
            args.input, args.output, 
            cols=args.cols, 
            frame_size=tuple(args.size) if args.size[0] > 0 else None,
            padding=args.padding,
            remove_bg=args.background
        )
        
    elif args.command == 'full':
        run_full_pipeline(args.prompt, args.output, args.frames)
        
    elif args.command == 'gui':
        from gui import run_gui
        run_gui()
        
    else:
        parser.print_help()

def run_full_pipeline(prompt: str, output: str, frame_count: int):
    """全工程を一括実行"""
    print("=" * 50)
    print("スプライト生成パイプライン開始")
    print("=" * 50)
    
    output_dir = Path(output).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    video_path = output_dir / "temp_video.mp4"
    frames_dir = output_dir / "temp_frames"
    
    # Step 1: 動画生成
    print("\n[1/3] 動画生成中...")
    generator = VideoGenerator()
    generator.generate(prompt, str(video_path))
    
    # Step 2: フレーム抽出
    print("\n[2/4] フレーム抽出中...")
    extractor = FrameExtractor()
    extractor.extract(str(video_path), str(frames_dir), 'keyframes', count=frame_count)
    
    # Step 3: スプライト合成
    print("\n[3/4] スプライトシート合成中...")
    composer = SpriteComposer()
    composer.compose(str(frames_dir), output, remove_bg=True)
    
    # Step 4: アニメーション動画生成
    print("\n[4/4] アニメーション動画生成中...")
    animation_path = output_dir / "animation.mp4"
    gif_path = output_dir / "animation.gif"
    
    composer.create_animation_video(
        str(frames_dir), 
        str(animation_path), 
        fps=12, 
        loop_count=3, 
        remove_bg=True
    )
    
    composer.create_animation_gif(
        str(frames_dir), 
        str(gif_path), 
        fps=12, 
        remove_bg=True
    )
    
    print("\n" + "=" * 50)
    print(f"完了！")
    print(f"  スプライトシート: {output}")
    print(f"  アニメーション動画: {animation_path}")
    print(f"  アニメーションGIF: {gif_path}")
    print("=" * 50)

if __name__ == '__main__':
    main()
