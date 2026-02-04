"""
スプライト生成ツール GUI
"""

import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
from pathlib import Path
import threading

from video_generator import VideoGenerator, PROMPT_TEMPLATES, get_template
from frame_extractor import FrameExtractor
from sprite_composer import SpriteComposer


class SpriteGeneratorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("スプライトアニメーション生成ツール")
        self.root.geometry("1200x800")
        
        # モジュール初期化
        self.video_gen = VideoGenerator()
        self.frame_ext = FrameExtractor()
        self.sprite_comp = SpriteComposer()
        
        # 状態
        self.current_frames = []
        self.selected_frames = []
        self.video_path = None
        
        self._create_ui()
    
    def _create_ui(self):
        # メインコンテナ
        main_frame = ttk.Frame(self.root, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 左パネル（設定）
        left_panel = ttk.Frame(main_frame, width=350)
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        left_panel.pack_propagate(False)
        
        # 右パネル（プレビュー）
        right_panel = ttk.Frame(main_frame)
        right_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        self._create_left_panel(left_panel)
        self._create_right_panel(right_panel)
    
    def _create_left_panel(self, parent):
        # ===== Step 1: 動画生成 =====
        step1_frame = ttk.LabelFrame(parent, text="Step 1: 動画生成", padding=10)
        step1_frame.pack(fill=tk.X, pady=(0, 10))
        
        # プロンプトテンプレート
        ttk.Label(step1_frame, text="テンプレート:").pack(anchor=tk.W)
        self.template_var = tk.StringVar(value="walk")
        template_combo = ttk.Combobox(
            step1_frame, 
            textvariable=self.template_var,
            values=list(PROMPT_TEMPLATES.keys()),
            state="readonly"
        )
        template_combo.pack(fill=tk.X)
        template_combo.bind("<<ComboboxSelected>>", self._on_template_select)
        
        # スタイル
        ttk.Label(step1_frame, text="スタイル:").pack(anchor=tk.W, pady=(5, 0))
        self.style_var = tk.StringVar(value="pixel art style")
        style_combo = ttk.Combobox(
            step1_frame,
            textvariable=self.style_var,
            values=["pixel art style", "anime style", "cartoon style", "realistic", "chibi style"]
        )
        style_combo.pack(fill=tk.X)
        
        # カスタムプロンプト
        ttk.Label(step1_frame, text="プロンプト:").pack(anchor=tk.W, pady=(5, 0))
        self.prompt_text = tk.Text(step1_frame, height=4, wrap=tk.WORD)
        self.prompt_text.pack(fill=tk.X)
        self._on_template_select(None)
        
        # 生成ボタン
        ttk.Button(step1_frame, text="動画を生成", command=self._generate_video).pack(fill=tk.X, pady=(5, 0))
        
        # または既存動画を読み込み
        ttk.Separator(step1_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=10)
        ttk.Button(step1_frame, text="既存の動画を開く", command=self._open_video).pack(fill=tk.X)
        
        # ===== Step 2: フレーム抽出 =====
        step2_frame = ttk.LabelFrame(parent, text="Step 2: フレーム抽出", padding=10)
        step2_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 抽出モード
        ttk.Label(step2_frame, text="抽出モード:").pack(anchor=tk.W)
        self.extract_mode_var = tk.StringVar(value="keyframes")
        modes = [("キーフレーム自動検出", "keyframes"), ("一定間隔", "interval"), ("全フレーム", "all")]
        for text, value in modes:
            ttk.Radiobutton(step2_frame, text=text, value=value, variable=self.extract_mode_var).pack(anchor=tk.W)
        
        # フレーム数
        count_frame = ttk.Frame(step2_frame)
        count_frame.pack(fill=tk.X, pady=(5, 0))
        ttk.Label(count_frame, text="フレーム数:").pack(side=tk.LEFT)
        self.frame_count_var = tk.IntVar(value=12)
        ttk.Spinbox(count_frame, from_=4, to=32, textvariable=self.frame_count_var, width=5).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(step2_frame, text="フレームを抽出", command=self._extract_frames).pack(fill=tk.X, pady=(5, 0))
        
        # ===== Step 3: スプライト合成 =====
        step3_frame = ttk.LabelFrame(parent, text="Step 3: スプライト合成", padding=10)
        step3_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 背景除去
        self.remove_bg_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(step3_frame, text="背景を除去", variable=self.remove_bg_var).pack(anchor=tk.W)
        
        # 列数
        cols_frame = ttk.Frame(step3_frame)
        cols_frame.pack(fill=tk.X, pady=(5, 0))
        ttk.Label(cols_frame, text="列数 (0=自動):").pack(side=tk.LEFT)
        self.cols_var = tk.IntVar(value=0)
        ttk.Spinbox(cols_frame, from_=0, to=16, textvariable=self.cols_var, width=5).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(step3_frame, text="スプライトシートを作成", command=self._compose_sprite).pack(fill=tk.X, pady=(5, 0))
        
        # ===== 進捗表示 =====
        self.progress_var = tk.StringVar(value="準備完了")
        ttk.Label(parent, textvariable=self.progress_var).pack(anchor=tk.W, pady=(10, 0))
        self.progress_bar = ttk.Progressbar(parent, mode='indeterminate')
        self.progress_bar.pack(fill=tk.X)
    
    def _create_right_panel(self, parent):
        # タブ
        notebook = ttk.Notebook(parent)
        notebook.pack(fill=tk.BOTH, expand=True)
        
        # フレームプレビュータブ
        frames_tab = ttk.Frame(notebook)
        notebook.add(frames_tab, text="フレーム")
        
        # フレーム選択エリア
        self.frames_canvas = tk.Canvas(frames_tab, bg='#2d2d2d')
        scrollbar = ttk.Scrollbar(frames_tab, orient=tk.VERTICAL, command=self.frames_canvas.yview)
        self.frames_canvas.configure(yscrollcommand=scrollbar.set)
        
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.frames_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        self.frames_inner = ttk.Frame(self.frames_canvas)
        self.frames_canvas.create_window((0, 0), window=self.frames_inner, anchor=tk.NW)
        self.frames_inner.bind("<Configure>", lambda e: self.frames_canvas.configure(scrollregion=self.frames_canvas.bbox("all")))
        
        # スプライトプレビュータブ
        sprite_tab = ttk.Frame(notebook)
        notebook.add(sprite_tab, text="スプライトシート")
        
        self.sprite_label = ttk.Label(sprite_tab, text="スプライトシートがここに表示されます")
        self.sprite_label.pack(expand=True)
    
    def _on_template_select(self, event):
        template = get_template(self.template_var.get(), self.style_var.get())
        self.prompt_text.delete("1.0", tk.END)
        self.prompt_text.insert("1.0", template)
    
    def _generate_video(self):
        prompt = self.prompt_text.get("1.0", tk.END).strip()
        if not prompt:
            messagebox.showwarning("警告", "プロンプトを入力してください")
            return
        
        output_path = filedialog.asksaveasfilename(
            defaultextension=".mp4",
            filetypes=[("MP4動画", "*.mp4")],
            initialfile="generated_video.mp4"
        )
        if not output_path:
            return
        
        self._run_async(
            lambda: self.video_gen.generate(prompt, output_path),
            lambda result: self._on_video_generated(result)
        )
    
    def _open_video(self):
        path = filedialog.askopenfilename(
            filetypes=[("動画ファイル", "*.mp4 *.avi *.mov *.webm")]
        )
        if path:
            self.video_path = path
            self.progress_var.set(f"動画読み込み: {os.path.basename(path)}")
    
    def _on_video_generated(self, result):
        self.video_path = result
        self.progress_var.set(f"動画生成完了: {os.path.basename(result)}")
    
    def _extract_frames(self):
        if not self.video_path:
            messagebox.showwarning("警告", "先に動画を生成または開いてください")
            return
        
        output_dir = filedialog.askdirectory(title="フレーム出力フォルダを選択")
        if not output_dir:
            output_dir = os.path.join(os.path.dirname(self.video_path), "frames")
        
        mode = self.extract_mode_var.get()
        count = self.frame_count_var.get()
        
        self._run_async(
            lambda: self.frame_ext.extract(self.video_path, output_dir, mode, count=count),
            lambda result: self._on_frames_extracted(result, output_dir)
        )
    
    def _on_frames_extracted(self, paths, output_dir):
        self.current_frames = paths
        self.progress_var.set(f"フレーム抽出完了: {len(paths)}フレーム")
        self._display_frames(paths)
    
    def _display_frames(self, paths):
        # 既存のウィジェットをクリア
        for widget in self.frames_inner.winfo_children():
            widget.destroy()
        
        self.frame_checkbuttons = []
        self.frame_vars = []
        
        cols = 4
        for i, path in enumerate(paths):
            row = i // cols
            col = i % cols
            
            frame = ttk.Frame(self.frames_inner)
            frame.grid(row=row, column=col, padx=5, pady=5)
            
            # サムネイル
            try:
                img = Image.open(path)
                img.thumbnail((150, 150))
                photo = ImageTk.PhotoImage(img)
                label = ttk.Label(frame, image=photo)
                label.image = photo
                label.pack()
            except Exception as e:
                ttk.Label(frame, text=f"Frame {i}").pack()
            
            # チェックボックス
            var = tk.BooleanVar(value=True)
            cb = ttk.Checkbutton(frame, text=f"#{i}", variable=var)
            cb.pack()
            self.frame_vars.append(var)
            self.frame_checkbuttons.append(cb)
    
    def _compose_sprite(self):
        if not self.current_frames:
            # フォルダから直接読み込み
            input_dir = filedialog.askdirectory(title="フレーム画像フォルダを選択")
            if not input_dir:
                return
        else:
            input_dir = os.path.dirname(self.current_frames[0])
        
        output_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG画像", "*.png")],
            initialfile="sprite_sheet.png"
        )
        if not output_path:
            return
        
        cols = self.cols_var.get()
        remove_bg = self.remove_bg_var.get()
        
        self._run_async(
            lambda: self.sprite_comp.compose(input_dir, output_path, cols=cols, remove_bg=remove_bg),
            lambda result: self._on_sprite_composed(result)
        )
    
    def _on_sprite_composed(self, result):
        self.progress_var.set(f"スプライトシート作成完了: {os.path.basename(result)}")
        
        # プレビュー表示
        try:
            img = Image.open(result)
            # 画面に収まるようにリサイズ
            max_size = (800, 600)
            img.thumbnail(max_size)
            photo = ImageTk.PhotoImage(img)
            self.sprite_label.configure(image=photo)
            self.sprite_label.image = photo
        except Exception as e:
            self.sprite_label.configure(text=f"プレビュー読み込みエラー: {e}")
    
    def _run_async(self, task, callback):
        """バックグラウンドでタスクを実行"""
        self.progress_bar.start()
        self.progress_var.set("処理中...")
        
        def run():
            try:
                result = task()
                self.root.after(0, lambda: self._on_task_complete(result, callback))
            except Exception as e:
                self.root.after(0, lambda: self._on_task_error(e))
        
        thread = threading.Thread(target=run)
        thread.daemon = True
        thread.start()
    
    def _on_task_complete(self, result, callback):
        self.progress_bar.stop()
        callback(result)
    
    def _on_task_error(self, error):
        self.progress_bar.stop()
        self.progress_var.set(f"エラー: {error}")
        messagebox.showerror("エラー", str(error))


def run_gui():
    root = tk.Tk()
    app = SpriteGeneratorGUI(root)
    root.mainloop()


if __name__ == '__main__':
    run_gui()
