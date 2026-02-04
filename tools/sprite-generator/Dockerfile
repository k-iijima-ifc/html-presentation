FROM python:3.11-slim

WORKDIR /app

# システム依存パッケージ（OpenCV用）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Python依存パッケージ
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード
COPY *.py ./

# 出力ディレクトリ
RUN mkdir -p /app/output

# 環境変数
ENV PYTHONUNBUFFERED=1

# デフォルトコマンド
CMD ["python", "sprite_generator.py", "--help"]
