/**
 * スプライト1エフェクト
 * 複数の少年が様々な方向・速度・サイズで画面を横切るアニメーション
 */
async function effect_sprite1(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 1 });

    // キャンバスレイヤー
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = 'position:absolute;top:0;left:0;z-index:10;pointer-events:none;';
    blocksContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // スプライト設定
    const SPRITE = {
        image: null,
        cols: 4,           // 横のフレーム数
        rows: 2,           // 縦のフレーム数
        totalFrames: 8,    // 総フレーム数
        frameWidth: 1280,  // 1フレームの幅
        frameHeight: 720,  // 1フレームの高さ
        ready: false
    };

    // スプライトシート読み込み
    const spriteSheet = new Image();
    spriteSheet.src = 'assets/boy_sprite.png';
    
    await new Promise((resolve) => {
        spriteSheet.onload = () => {
            SPRITE.image = spriteSheet;
            // 画像サイズから自動計算
            SPRITE.frameWidth = spriteSheet.width / SPRITE.cols;
            SPRITE.frameHeight = spriteSheet.height / SPRITE.rows;
            SPRITE.ready = true;
            console.log('Sprite loaded:', SPRITE.frameWidth, 'x', SPRITE.frameHeight, 'frames:', SPRITE.totalFrames);
            resolve();
        };
        spriteSheet.onerror = () => {
            console.error('Failed to load sprite');
            resolve();
        };
    });

    if (!SPRITE.ready) {
        // スプライト読み込み失敗時はシンプルなフェード
        gsap.to(current, { opacity: 0, duration: 0.5 });
        gsap.to(next, { opacity: 1, duration: 0.5, onComplete: () => {
            blocksContainer.innerHTML = '';
            if (typeof finishAnimation === 'function') {
                finishAnimation(current);
            }
        }});
        return;
    }

    // 歩くキャラクタークラス
    class WalkingBoy {
        constructor(config) {
            this.scale = config.scale || 0.15;
            this.direction = config.direction || 1; // 1: 左→右, -1: 右→左
            this.walkSpeed = config.speed || 2;
            this.delay = config.delay || 0;
            this.started = false;
            
            const dw = SPRITE.frameWidth * this.scale;
            const dh = SPRITE.frameHeight * this.scale;
            
            // 開始位置
            if (this.direction > 0) {
                // 左から右へ
                this.x = -dw - 20;
            } else {
                // 右から左へ
                this.x = width + 20;
            }
            
            // Y位置（上中下いろいろ）
            this.y = config.y !== undefined ? config.y : height - dh - 30;
            
            this.frame = 0;
            this.frameTimer = 0;
            this.frameDelay = 100 + Math.random() * 50; // フレーム速度も少しバラつき
            this.active = true;
        }

        update(deltaTime, elapsed) {
            if (elapsed < this.delay) return;
            this.started = true;
            
            // 移動方向に応じて移動
            this.x += this.walkSpeed * this.direction;

            // フレームアニメーション
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                this.frame = (this.frame + 1) % SPRITE.totalFrames;
                this.frameTimer = 0;
            }
        }

        draw(ctx) {
            if (!SPRITE.ready || !this.started) return;

            const col = this.frame % SPRITE.cols;
            const row = Math.floor(this.frame / SPRITE.cols);
            
            const sx = col * SPRITE.frameWidth;
            const sy = row * SPRITE.frameHeight;
            
            const dw = SPRITE.frameWidth * this.scale;
            const dh = SPRITE.frameHeight * this.scale;

            ctx.save();
            
            if (this.direction > 0) {
                // 左から右へ歩く → スプライトを反転（右向きに）
                ctx.translate(this.x + dw, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    SPRITE.image,
                    sx, sy, SPRITE.frameWidth, SPRITE.frameHeight,
                    0, 0, dw, dh
                );
            } else {
                // 右から左へ歩く → そのまま（左向き）
                ctx.drawImage(
                    SPRITE.image,
                    sx, sy, SPRITE.frameWidth, SPRITE.frameHeight,
                    this.x, this.y, dw, dh
                );
            }
            
            ctx.restore();
        }

        isOffScreen() {
            const dw = SPRITE.frameWidth * this.scale;
            if (this.direction > 0) {
                return this.x > width + 50;
            } else {
                return this.x < -dw - 50;
            }
        }
    }

    // 複数のキャラクターを生成
    const boys = [];
    const boyConfigs = [
        // 下段（大きめ、ゆっくり）
        { scale: 0.18, speed: 2.5, direction: 1, y: height - 130, delay: 0 },
        { scale: 0.15, speed: 3.5, direction: -1, y: height - 110, delay: 500 },
        
        // 中段（中くらい）
        { scale: 0.12, speed: 3, direction: 1, y: height * 0.5, delay: 300 },
        { scale: 0.1, speed: 4, direction: -1, y: height * 0.45, delay: 800 },
        
        // 上段（小さめ、速い - 遠くを歩いてるイメージ）
        { scale: 0.08, speed: 2, direction: 1, y: height * 0.25, delay: 200 },
        { scale: 0.06, speed: 2.5, direction: -1, y: height * 0.2, delay: 1000 },
        { scale: 0.07, speed: 1.8, direction: 1, y: height * 0.15, delay: 600 },
    ];

    for (const config of boyConfigs) {
        boys.push(new WalkingBoy(config));
    }

    const startTime = performance.now();
    let lastTime = startTime;
    const maxDuration = 10000;
    let animationId;
    let fadeStarted = false;

    function animate() {
        const now = performance.now();
        const deltaTime = now - lastTime;
        lastTime = now;
        const elapsed = now - startTime;

        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);

        // 全キャラクター更新・描画（奥から手前の順に描画）
        // Yが小さい（上）から大きい（下）の順に描画
        const sortedBoys = [...boys].sort((a, b) => a.y - b.y);
        
        let allOffScreen = true;
        for (const boy of sortedBoys) {
            boy.update(deltaTime, elapsed);
            boy.draw(ctx);
            if (!boy.isOffScreen() || !boy.started) {
                allOffScreen = false;
            }
        }

        // 全キャラクターが画面外に出たらフェード開始
        if (allOffScreen && elapsed > 2000 && !fadeStarted) {
            fadeStarted = true;
            gsap.to(current, { opacity: 0, duration: 0.8 });
            gsap.to(next, { opacity: 1, duration: 0.8, onComplete: () => {
                cancelAnimationFrame(animationId);
                blocksContainer.innerHTML = '';
                if (typeof finishAnimation === 'function') {
                    finishAnimation(current);
                }
            }});
        }

        // タイムアウト
        if (elapsed > maxDuration) {
            cancelAnimationFrame(animationId);
            gsap.set(next, { opacity: 1 });
            gsap.set(current, { opacity: 0 });
            blocksContainer.innerHTML = '';
            if (typeof finishAnimation === 'function') {
                finishAnimation(current);
            }
            return;
        }

        animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('sprite1', effect_sprite1, {
        name: 'スプライト1',
        category: 'sprite',
        description: '複数の少年が様々な方向から歩くアニメーション'
    });
}
