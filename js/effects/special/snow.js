/**
 * 雪エフェクト
 * リアルな雪が降り、ゆっくりホワイトアウトして遷移
 */
async function effect_snow(current, next, container) {
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

    // ホワイトアウト用オーバーレイ
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:white;opacity:0;z-index:5;`;
    blocksContainer.appendChild(overlay);

    // 雪片クラス
    class Snowflake {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : -10 - Math.random() * 50;
            
            // サイズのバリエーション（遠近感）
            const sizeRand = Math.random();
            if (sizeRand < 0.5) {
                // 小さい雪（遠く、多め）
                this.radius = 1 + Math.random() * 2;
                this.speed = 0.3 + Math.random() * 0.5;
                this.alpha = 0.4 + Math.random() * 0.3;
            } else if (sizeRand < 0.85) {
                // 中くらい
                this.radius = 2.5 + Math.random() * 3;
                this.speed = 0.6 + Math.random() * 0.8;
                this.alpha = 0.6 + Math.random() * 0.3;
            } else {
                // 大きい雪（近く、少なめ）
                this.radius = 4 + Math.random() * 4;
                this.speed = 1.0 + Math.random() * 1.2;
                this.alpha = 0.8 + Math.random() * 0.2;
            }
            
            // 横揺れパラメータ
            this.wobbleSpeed = 0.01 + Math.random() * 0.02;
            this.wobbleAmp = 0.3 + Math.random() * 0.8;
            this.wobblePhase = Math.random() * Math.PI * 2;
            
            // 回転（大きい雪片用）
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            
            // 形状タイプ
            this.type = Math.random() < 0.3 ? 'crystal' : 'round';
        }

        update(windX) {
            this.y += this.speed;
            this.wobblePhase += this.wobbleSpeed;
            this.x += Math.sin(this.wobblePhase) * this.wobbleAmp + windX * this.speed;
            this.rotation += this.rotationSpeed;

            if (this.y > height + 20 || this.x < -50 || this.x > width + 50) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.alpha;

            if (this.type === 'crystal' && this.radius > 3) {
                // 結晶形状
                this.drawCrystal(ctx);
            } else {
                // 丸い雪片（グラデーション）
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        drawCrystal(ctx) {
            const r = this.radius;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 0.8;
            ctx.lineCap = 'round';

            // 6本の枝
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.save();
                ctx.rotate(angle);
                
                // メインの枝
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(r, 0);
                ctx.stroke();

                // サブの枝
                const branchLen = r * 0.4;
                ctx.beginPath();
                ctx.moveTo(r * 0.5, 0);
                ctx.lineTo(r * 0.5 + branchLen * 0.5, -branchLen * 0.5);
                ctx.moveTo(r * 0.5, 0);
                ctx.lineTo(r * 0.5 + branchLen * 0.5, branchLen * 0.5);
                ctx.stroke();

                ctx.restore();
            }

            // 中心の点
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 雪片を生成
    const snowflakes = [];
    const maxSnowflakes = 200;
    for (let i = 0; i < maxSnowflakes; i++) {
        snowflakes.push(new Snowflake());
    }

    const startTime = performance.now();
    const snowDuration = 4000; // 雪が降る時間
    const whiteoutDuration = 2000; // ホワイトアウトにかかる時間
    const maxDuration = snowDuration + whiteoutDuration + 500;
    let animationId;
    let windX = 0;
    let targetWindX = 0;

    function animate() {
        const now = performance.now();
        const elapsed = now - startTime;

        // 時々風向きを変える
        if (Math.random() < 0.01) {
            targetWindX = (Math.random() - 0.5) * 1.5;
        }
        windX += (targetWindX - windX) * 0.02;

        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);

        // 雪片を更新・描画
        for (let i = 0; i < snowflakes.length; i++) {
            snowflakes[i].update(windX);
            snowflakes[i].draw(ctx);
        }

        // ホワイトアウト処理
        let overlayOpacity = 0;
        let whiteoutProgress = 0;
        
        if (elapsed > snowDuration) {
            // ホワイトアウト開始
            whiteoutProgress = Math.min(1, (elapsed - snowDuration) / whiteoutDuration);
            overlayOpacity = whiteoutProgress;
        } else {
            // アニメーション中は軽い雪の曇り
            overlayOpacity = 0.05;
        }
        
        overlay.style.opacity = Math.min(1, overlayOpacity);

        // 次のページのフェードイン（ホワイトアウトの後半）
        if (whiteoutProgress > 0.5) {
            const nextOpacity = (whiteoutProgress - 0.5) / 0.5;
            gsap.set(next, { opacity: nextOpacity });
        }

        // 完了判定
        if (elapsed > maxDuration) {
            cancelAnimationFrame(animationId);
            gsap.set(next, { opacity: 1 });
            gsap.set(current, { opacity: 1 });
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
    effectRegistry.register('snow', effect_snow, {
        name: 'スノー',
        category: 'special',
        description: 'リアルな雪が降り、ホワイトアウトで遷移'
    });
}
