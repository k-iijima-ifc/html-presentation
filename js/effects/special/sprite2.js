/**
 * スプライト2エフェクト
 * カエルがピョンピョン跳ねながら画面を移動するアニメーション
 */
async function effect_sprite2(current, next, container) {
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
        rows: 3,           // 縦のフレーム数
        totalFrames: 12,   // 総フレーム数
        frameWidth: 1280,  // 1フレームの幅
        frameHeight: 720,  // 1フレームの高さ
        ready: false
    };

    // スプライトシート読み込み
    const spriteSheet = new Image();
    spriteSheet.src = 'assets/frog_sprite.png';
    
    await new Promise((resolve) => {
        spriteSheet.onload = () => {
            SPRITE.image = spriteSheet;
            // 画像サイズから自動計算
            SPRITE.frameWidth = spriteSheet.width / SPRITE.cols;
            SPRITE.frameHeight = spriteSheet.height / SPRITE.rows;
            SPRITE.ready = true;
            console.log('Frog sprite loaded:', SPRITE.frameWidth, 'x', SPRITE.frameHeight, 'frames:', SPRITE.totalFrames);
            resolve();
        };
        spriteSheet.onerror = () => {
            console.error('Failed to load frog sprite');
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

    // ジャンプするカエルクラス
    class JumpingFrog {
        constructor(config) {
            this.scale = config.scale || 0.12;
            this.direction = config.direction || -1; // -1: 右→左（カエルは左向き）, 1: 左→右
            this.hopSpeed = config.speed || 3;
            this.delay = config.delay || 0;
            this.started = false;
            
            const dw = SPRITE.frameWidth * this.scale;
            const dh = SPRITE.frameHeight * this.scale;
            
            // 開始位置
            if (this.direction < 0) {
                // 右から左へ（カエル左向きなのでそのまま）
                this.x = width + 20;
            } else {
                // 左から右へ（反転必要）
                this.x = -dw - 20;
            }
            
            // Y位置
            this.baseY = config.y !== undefined ? config.y : height - dh - 30;
            this.y = this.baseY;
            
            this.frame = 0;
            this.frameTimer = 0;
            this.frameDelay = 80; // ジャンプアニメは速め
            this.active = true;
            
            // ジャンプの高さアニメーション用
            this.jumpPhase = 0;
            this.jumpHeight = 30 + Math.random() * 40; // ジャンプの高さ
        }

        update(deltaTime, elapsed) {
            if (elapsed < this.delay) return;
            this.started = true;
            
            // 移動方向に応じて移動
            this.x += this.hopSpeed * this.direction;

            // フレームアニメーション
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                this.frame = (this.frame + 1) % SPRITE.totalFrames;
                this.frameTimer = 0;
            }
            
            // ジャンプの上下動き（フレームに応じて）
            // 左上が接地、右下が着地なので、中間フレームが空中
            const jumpProgress = this.frame / SPRITE.totalFrames;
            // 0〜0.5で上昇、0.5〜1で下降
            const jumpCurve = Math.sin(jumpProgress * Math.PI);
            this.y = this.baseY - jumpCurve * this.jumpHeight;
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
            
            if (this.direction < 0) {
                // 右から左へ（カエル左向きなのでそのまま）
                ctx.drawImage(
                    SPRITE.image,
                    sx, sy, SPRITE.frameWidth, SPRITE.frameHeight,
                    this.x, this.y, dw, dh
                );
            } else {
                // 左から右へ（反転して右向きに）
                ctx.translate(this.x + dw, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    SPRITE.image,
                    sx, sy, SPRITE.frameWidth, SPRITE.frameHeight,
                    0, 0, dw, dh
                );
            }
            
            ctx.restore();
        }

        isOffScreen() {
            const dw = SPRITE.frameWidth * this.scale;
            if (this.direction < 0) {
                return this.x < -dw - 50;
            } else {
                return this.x > width + 50;
            }
        }
    }

    // 複数のカエルを生成
    const frogs = [];
    const frogConfigs = [
        // 下段（大きめ、手前感）
        { scale: 0.15, speed: 4, direction: -1, y: height - 120, delay: 0 },
        { scale: 0.12, speed: 5, direction: 1, y: height - 100, delay: 600 },
        
        // 中段
        { scale: 0.1, speed: 3.5, direction: -1, y: height * 0.55, delay: 300 },
        { scale: 0.08, speed: 4.5, direction: 1, y: height * 0.5, delay: 900 },
        
        // 上段（小さめ、遠くのイメージ）
        { scale: 0.06, speed: 2.5, direction: -1, y: height * 0.3, delay: 150 },
        { scale: 0.05, speed: 3, direction: 1, y: height * 0.25, delay: 750 },
        { scale: 0.04, speed: 2, direction: -1, y: height * 0.15, delay: 450 },
    ];

    for (const config of frogConfigs) {
        frogs.push(new JumpingFrog(config));
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

        // 全カエル更新・描画（奥から手前の順に描画）
        const sortedFrogs = [...frogs].sort((a, b) => a.baseY - b.baseY);
        
        let allOffScreen = true;
        for (const frog of sortedFrogs) {
            frog.update(deltaTime, elapsed);
            frog.draw(ctx);
            if (!frog.isOffScreen() || !frog.started) {
                allOffScreen = false;
            }
        }

        // 全カエルが画面外に出たらフェード開始
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
    effectRegistry.register('sprite2', effect_sprite2, {
        name: 'スプライト2',
        category: 'sprite',
        description: 'カエルがピョンピョン跳ねるアニメーション'
    });
}
