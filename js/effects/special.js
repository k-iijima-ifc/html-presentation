// スペシャルエフェクト
const specialEffects = {
    glitch: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        const tl = gsap.timeline();
        for (let i = 0; i < 8; i++) {
            tl.to(current, { x: gsap.utils.random(-15, 15), y: gsap.utils.random(-8, 8), skewX: gsap.utils.random(-10, 10), filter: `hue-rotate(${gsap.utils.random(0, 360)}deg) saturate(${gsap.utils.random(1, 3)})`, duration: 0.04 });
        }
        tl.to(current, { opacity: 0, duration: 0.1 }).set(current, { x: 0, y: 0, skewX: 0, filter: 'none' });
        for (let i = 0; i < 8; i++) {
            tl.to(next, { opacity: gsap.utils.random(0.3, 1), x: gsap.utils.random(-15, 15), y: gsap.utils.random(-8, 8), skewX: gsap.utils.random(-10, 10), filter: `hue-rotate(${gsap.utils.random(0, 360)}deg)`, duration: 0.04 });
        }
        tl.to(next, { opacity: 1, x: 0, y: 0, skewX: 0, filter: 'none', duration: 0.1, onComplete: () => finishAnimation(current, { x: 0, y: 0, skewX: 0, filter: 'none' }) });
    },

    matrix: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0, filter: 'hue-rotate(90deg) saturate(2)' });
        const tl = gsap.timeline();
        tl.to(current, { filter: 'hue-rotate(90deg) saturate(2) brightness(1.5)', duration: 0.2 })
          .to(current, { yPercent: -5, opacity: 0.8, duration: 0.1, repeat: 5, yoyo: true })
          .to(current, { opacity: 0, yPercent: 0, duration: 0.2 })
          .to(next, { opacity: 1, duration: 0.3 })
          .to(next, { filter: 'hue-rotate(0deg) saturate(1)', duration: 0.4, ease: "power2.out", onComplete: () => finishAnimation(current, { filter: 'none', yPercent: 0 }) });
    },

    shatter: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 1.2, opacity: 0 });
        const tl = gsap.timeline();
        tl.to(current, { scale: 1.1, duration: 0.1 })
          .to(current, { clipPath: 'polygon(0% 0%, 30% 0%, 25% 100%, 0% 100%)', duration: 0.1 })
          .to(current, { x: -100, rotation: -10, opacity: 0, duration: 0.3, ease: "power2.in" })
          .set(current, { clipPath: 'none', x: 0, rotation: 0 })
          .to(next, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)", onComplete: () => finishAnimation(current, { scale: 1, clipPath: 'none' }) }, "-=0.2");
    },

    morph: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { borderRadius: '50%', scale: 0, opacity: 1 });
        gsap.timeline()
            .to(current, { borderRadius: '50%', scale: 0.5, duration: 0.4, ease: "power2.in" })
            .to(current, { scale: 0, opacity: 0, duration: 0.2 })
            .to(next, { scale: 0.5, duration: 0.2 }, "-=0.2")
            .to(next, { scale: 1, borderRadius: '0%', duration: 0.4, ease: "power2.out", onComplete: () => finishAnimation(current, { borderRadius: '0%', scale: 1 }) });
    },

    newspaper: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: 720, scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { rotation: -720, scale: 0, opacity: 0, duration: 0.8, ease: "power2.in" })
            .to(next, { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power2.out", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1 }) }, "-=0.4");
    },

    // エレメントスワップ - HTML要素を個別に弾き飛ばして入れ替え
    elementSwap: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // 両方のiframeをキャプチャ
        const currentIframe = current.querySelector('iframe');
        const nextIframe = next.querySelector('iframe');
        
        let currentImage = null;
        let nextImage = null;

        // 遷移先を先に表示してキャプチャ
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        await new Promise(resolve => setTimeout(resolve, 150));

        try {
            const currentDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (currentDoc && currentDoc.body) {
                const canvas = await html2canvas(currentDoc.documentElement, {
                    width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
                });
                currentImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        try {
            const nextDoc = nextIframe.contentDocument || nextIframe.contentWindow.document;
            if (nextDoc && nextDoc.body) {
                const canvas = await html2canvas(nextDoc.documentElement, {
                    width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
                });
                nextImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        gsap.set(next, { opacity: 0 });
        gsap.set(current, { opacity: 0 });

        // グリッド分割
        const cols = 6;
        const rows = 4;
        const cellW = width / cols;
        const cellH = height / rows;
        const totalCells = cols * rows;

        const currentBlocks = [];
        const nextBlocks = [];

        // ブロック生成
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellW;
                const y = row * cellH;
                const index = row * cols + col;

                // 現在のブロック
                const currentBlock = document.createElement('div');
                currentBlock.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${cellW}px;
                    height: ${cellH}px;
                    overflow: hidden;
                    z-index: 10;
                `;
                if (currentImage) {
                    currentBlock.style.backgroundImage = `url(${currentImage})`;
                    currentBlock.style.backgroundSize = `${width}px ${height}px`;
                    currentBlock.style.backgroundPosition = `-${x}px -${y}px`;
                } else {
                    currentBlock.style.background = `hsl(${index * 15}, 60%, 50%)`;
                }
                blocksContainer.appendChild(currentBlock);
                currentBlocks.push({ element: currentBlock, x, y, col, row });

                // 次のブロック（画面外に配置）
                const nextBlock = document.createElement('div');
                const directions = ['top', 'bottom', 'left', 'right'];
                const dir = directions[Math.floor(Math.random() * 4)];
                let startX = x, startY = y;
                
                switch (dir) {
                    case 'top': startY = -cellH - 50; break;
                    case 'bottom': startY = height + 50; break;
                    case 'left': startX = -cellW - 50; break;
                    case 'right': startX = width + 50; break;
                }

                nextBlock.style.cssText = `
                    position: absolute;
                    left: ${startX}px;
                    top: ${startY}px;
                    width: ${cellW}px;
                    height: ${cellH}px;
                    overflow: hidden;
                    z-index: 5;
                `;
                if (nextImage) {
                    nextBlock.style.backgroundImage = `url(${nextImage})`;
                    nextBlock.style.backgroundSize = `${width}px ${height}px`;
                    nextBlock.style.backgroundPosition = `-${x}px -${y}px`;
                } else {
                    nextBlock.style.background = `hsl(${index * 15 + 180}, 60%, 50%)`;
                }
                blocksContainer.appendChild(nextBlock);
                nextBlocks.push({ element: nextBlock, x, y, startX, startY, dir });
            }
        }

        blocksContainer.style.opacity = '1';

        // ランダムな順序で入れ替え
        const indices = Array.from({ length: totalCells }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const tl = gsap.timeline();

        indices.forEach((idx, order) => {
            const delay = order * 0.05;
            const current = currentBlocks[idx];
            const next = nextBlocks[idx];

            // 弾き飛ばす方向（反対方向）
            let exitX = current.x, exitY = current.y;
            switch (next.dir) {
                case 'top': exitY = height + 50; break;
                case 'bottom': exitY = -cellH - 50; break;
                case 'left': exitX = width + 50; break;
                case 'right': exitX = -cellW - 50; break;
            }

            // 現在のブロックを弾き飛ばす
            tl.to(current.element, {
                x: exitX - current.x,
                y: exitY - current.y,
                rotation: (Math.random() - 0.5) * 60,
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in"
            }, delay);

            // 次のブロックを入れる
            tl.to(next.element, {
                left: next.x,
                top: next.y,
                rotation: 0,
                duration: 0.35,
                ease: "back.out(1.2)"
            }, delay + 0.1);
        });

        // 完了
        tl.call(() => {
            gsap.set(next, { opacity: 1 });
            blocksContainer.innerHTML = '';
            gsap.set(current, { opacity: 1 });
            finishAnimation(current);
        }, null, "+=0.2");
    },

    // 砂エフェクト - 画面が砂のようにさらさら流れ落ちる
    sandfall: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // 現在のiframeをキャプチャ（先にキャプチャしてから遷移先を準備）
        const currentIframe = current.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                capturedImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            capturedImage = canvas;
        }

        // メインキャンバス作成（キャプチャ画像で初期化）
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
        blocksContainer.appendChild(mainCanvas);
        blocksContainer.style.opacity = '1';
        
        const ctx = mainCanvas.getContext('2d');
        
        // 最初にキャプチャ画像を描画（遷移先が見えないように）
        ctx.drawImage(capturedImage, 0, 0);
        
        const imageData = capturedImage.getContext('2d').getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // 遷移先を裏に準備（キャンバスの後ろ）
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        gsap.set(current, { opacity: 0 });

        // 砂粒パーティクル設定
        const particleSize = 3;
        const cols = Math.ceil(width / particleSize);
        const rows = Math.ceil(height / particleSize);
        
        const particles = [];
        
        // グリッドごとにパーティクル化
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * particleSize;
                const y = row * particleSize;
                
                const idx = (y * width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const a = pixels[idx + 3];
                
                if (a > 0) {
                    particles.push({
                        x: x,
                        y: y,
                        vx: 0,
                        vy: 0,
                        color: `rgba(${r},${g},${b},${a/255})`,
                        size: particleSize,
                        activated: false,
                        delay: row * 0.3 + Math.random() * 8, // 早めに崩れ始める
                        fallen: false
                    });
                }
            }
        }

        let startTime = performance.now();
        let isAnimating = true;
        const gravity = 1.2; // 重力を強く
        const maxSpeed = 25; // 最高速度

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000 * 60;
            
            ctx.clearRect(0, 0, width, height);
            
            let allFallen = true;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                if (p.fallen) continue;
                
                // まだアクティブ化されていない
                if (!p.activated) {
                    if (elapsed > p.delay) {
                        p.activated = true;
                        p.vx = (Math.random() - 0.5) * 3;
                        p.vy = Math.random() * 3;
                    } else {
                        // 元の位置に描画
                        ctx.fillStyle = p.color;
                        ctx.fillRect(p.x, p.y, p.size, p.size);
                        allFallen = false;
                        continue;
                    }
                }

                allFallen = false;
                
                // 重力加速
                p.vy += gravity;
                if (p.vy > maxSpeed) p.vy = maxSpeed;
                
                // ランダムな揺れ（砂らしさ）
                p.vx += (Math.random() - 0.5) * 0.8;
                p.vx *= 0.95;
                
                p.x += p.vx;
                p.y += p.vy;
                
                // 画面外に出たら終了
                if (p.y > height + 20) {
                    p.fallen = true;
                    continue;
                }
                
                // 描画
                ctx.fillStyle = p.color;
                // 落下中は少し伸びる効果
                const stretch = Math.min(p.vy * 0.3, 6);
                ctx.fillRect(p.x, p.y, p.size, p.size + stretch);
            }

            // 全て落下完了チェック
            if (allFallen || elapsed > 150) {
                isAnimating = false;
                blocksContainer.innerHTML = '';
                gsap.set(current, { opacity: 1 });
                finishAnimation(current);
                return;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    },

    // 水中エフェクト - リアルな深海への潜水
    underwater: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // キャプチャ
        const currentIframe = current.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                capturedImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
            capturedImage = canvas;
        }

        // メインキャンバス
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 5;`;
        blocksContainer.appendChild(mainCanvas);
        const ctx = mainCanvas.getContext('2d');

        // 光線キャンバス
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = width;
        lightCanvas.height = height;
        lightCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 8; mix-blend-mode: screen; opacity: 0.4;`;
        blocksContainer.appendChild(lightCanvas);
        const lightCtx = lightCanvas.getContext('2d');

        // 泡・パーティクルキャンバス
        const bubbleCanvas = document.createElement('canvas');
        bubbleCanvas.width = width;
        bubbleCanvas.height = height;
        bubbleCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 15;`;
        blocksContainer.appendChild(bubbleCanvas);
        const bubbleCtx = bubbleCanvas.getContext('2d');

        // 魚キャンバス
        const fishCanvas = document.createElement('canvas');
        fishCanvas.width = width;
        fishCanvas.height = height;
        fishCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 20;`;
        blocksContainer.appendChild(fishCanvas);
        const fishCtx = fishCanvas.getContext('2d');

        // 遷移先を準備
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.set(current, { opacity: 0 });
        blocksContainer.style.opacity = '1';

        // リアルな泡パーティクル
        const bubbles = [];
        for (let i = 0; i < 80; i++) {
            bubbles.push({
                x: Math.random() * width,
                y: height + Math.random() * 200,
                radius: 2 + Math.random() * 8,
                speed: 0.5 + Math.random() * 2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.02,
                opacity: 0.3 + Math.random() * 0.5
            });
        }

        // 浮遊パーティクル（プランクトン的な）
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 1 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: -0.2 - Math.random() * 0.3,
                opacity: 0.2 + Math.random() * 0.4
            });
        }

        // リアルな魚たち
        const fishes = [];
        const fishTypes = [
            { bodyColor: '#4a90d9', finColor: '#2c5aa0', stripeColor: '#6ab0ff', size: 35, speed: 2.5 },
            { bodyColor: '#ff7f50', finColor: '#cc5533', stripeColor: '#ffaa80', size: 25, speed: 3.5 },
            { bodyColor: '#98d8c8', finColor: '#5cb8a5', stripeColor: '#c5ece3', size: 30, speed: 2.8 },
            { bodyColor: '#f7dc6f', finColor: '#d4ac0d', stripeColor: '#fbeaa5', size: 22, speed: 4 },
            { bodyColor: '#bb8fce', finColor: '#8e44ad', stripeColor: '#d7bde2', size: 28, speed: 3 },
        ];
        
        for (let i = 0; i < 8; i++) {
            const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            const sizeVar = 0.7 + Math.random() * 0.6;
            fishes.push({
                x: -100 - Math.random() * 400,
                y: 80 + Math.random() * (height - 160),
                size: fishType.size * sizeVar,
                speed: fishType.speed * (0.8 + Math.random() * 0.4),
                bodyColor: fishType.bodyColor,
                finColor: fishType.finColor,
                stripeColor: fishType.stripeColor,
                phase: Math.random() * Math.PI * 2,
                delay: i * 25 + Math.random() * 20,
                yBase: 0,
                swimAmplitude: 5 + Math.random() * 10
            });
        }

        // 光の筋
        const lightRays = [];
        for (let i = 0; i < 5; i++) {
            lightRays.push({
                x: width * 0.2 + Math.random() * width * 0.6,
                width: 30 + Math.random() * 60,
                opacity: 0.1 + Math.random() * 0.2,
                speed: 0.2 + Math.random() * 0.3
            });
        }

        let startTime = performance.now();
        let isAnimating = true;
        let waterPhase = 0;
        let depth = 0; // 深度（0〜1）

        // リアルな魚を描画
        function drawRealisticFish(ctx, x, y, size, bodyColor, finColor, stripeColor, phase) {
            ctx.save();
            ctx.translate(x, y);
            
            const tailSwing = Math.sin(phase) * 0.25;
            const bodyWave = Math.sin(phase * 0.5) * 0.05;
            
            // 影
            ctx.save();
            ctx.translate(3, 5);
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.4, bodyWave, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 尾びれ
            ctx.fillStyle = finColor;
            ctx.beginPath();
            ctx.moveTo(-size * 0.6, 0);
            ctx.quadraticCurveTo(
                -size * 1.0, -size * 0.3 + tailSwing * size,
                -size * 1.4, -size * 0.5 + tailSwing * size * 1.5
            );
            ctx.quadraticCurveTo(
                -size * 1.1, tailSwing * size * 0.5,
                -size * 1.4, size * 0.5 + tailSwing * size * 1.5
            );
            ctx.quadraticCurveTo(
                -size * 1.0, size * 0.3 + tailSwing * size,
                -size * 0.6, 0
            );
            ctx.fill();
            
            // 体（グラデーション）
            const bodyGrad = ctx.createRadialGradient(size * 0.2, -size * 0.15, 0, 0, 0, size);
            bodyGrad.addColorStop(0, stripeColor);
            bodyGrad.addColorStop(0.5, bodyColor);
            bodyGrad.addColorStop(1, finColor);
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.4, bodyWave, 0, Math.PI * 2);
            ctx.fill();
            
            // 縞模様
            ctx.strokeStyle = stripeColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < 3; i++) {
                const sx = -size * 0.3 + i * size * 0.25;
                ctx.beginPath();
                ctx.moveTo(sx, -size * 0.3);
                ctx.quadraticCurveTo(sx + 5, 0, sx, size * 0.3);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            
            // 背びれ
            ctx.fillStyle = finColor;
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, -size * 0.35);
            ctx.quadraticCurveTo(-size * 0.1, -size * 0.7, size * 0.2, -size * 0.35);
            ctx.closePath();
            ctx.fill();
            
            // 胸びれ
            ctx.save();
            ctx.translate(size * 0.1, size * 0.2);
            ctx.rotate(Math.sin(phase * 2) * 0.3);
            ctx.fillStyle = finColor;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.ellipse(0, size * 0.15, size * 0.25, size * 0.1, 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 目
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(size * 0.55, -size * 0.05, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // 目の輪郭
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 瞳
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(size * 0.58, -size * 0.05, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            // 目のハイライト
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(size * 0.6, -size * 0.08, size * 0.03, 0, Math.PI * 2);
            ctx.fill();
            
            // 鱗の光沢
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 8; i++) {
                const sx = -size * 0.5 + i * size * 0.12;
                const sy = Math.sin(i * 0.8) * size * 0.1;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(sx, sy, size * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000;
            waterPhase += 0.03;
            
            // 深度計算（ゆっくり深くなる）
            depth = Math.min(elapsed / 8, 1); // 8秒かけて最深部へ

            // メイン画像描画（水中揺らぎ）
            ctx.clearRect(0, 0, width, height);
            
            // 揺らぎを適用（深度で強くなる）
            const waveStrength = 2 + depth * 4;
            for (let y = 0; y < height; y += 1) {
                const waveOffset = Math.sin(y * 0.015 + waterPhase) * waveStrength;
                const waveOffset2 = Math.sin(y * 0.025 + waterPhase * 1.3) * waveStrength * 0.5;
                ctx.drawImage(
                    capturedImage,
                    0, y, width, 1,
                    waveOffset + waveOffset2, y, width, 1
                );
            }

            // 深度による色調変化（深くなるほど青く暗く）
            const blueIntensity = depth * 0.7;
            const darkness = depth * 0.5;
            
            // 青みオーバーレイ
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, `rgba(0, 80, 160, ${blueIntensity * 0.5})`);
            gradient.addColorStop(0.5, `rgba(0, 50, 120, ${blueIntensity * 0.7})`);
            gradient.addColorStop(1, `rgba(0, 20, 60, ${blueIntensity * 0.9})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 暗くなるオーバーレイ
            ctx.fillStyle = `rgba(0, 10, 30, ${darkness})`;
            ctx.fillRect(0, 0, width, height);

            // 光の筋を描画
            lightCtx.clearRect(0, 0, width, height);
            if (depth < 0.7) {
                lightRays.forEach(ray => {
                    ray.x += ray.speed;
                    if (ray.x > width + ray.width) ray.x = -ray.width;
                    
                    const rayGrad = lightCtx.createLinearGradient(ray.x, 0, ray.x + ray.width, height);
                    rayGrad.addColorStop(0, `rgba(200, 230, 255, ${ray.opacity * (1 - depth)})`);
                    rayGrad.addColorStop(1, `rgba(100, 180, 255, 0)`);
                    
                    lightCtx.fillStyle = rayGrad;
                    lightCtx.beginPath();
                    lightCtx.moveTo(ray.x, 0);
                    lightCtx.lineTo(ray.x + ray.width * 0.3, 0);
                    lightCtx.lineTo(ray.x + ray.width * 1.5, height);
                    lightCtx.lineTo(ray.x + ray.width * 0.5, height);
                    lightCtx.closePath();
                    lightCtx.fill();
                });
            }

            // 泡を描画
            bubbleCtx.clearRect(0, 0, width, height);
            bubbles.forEach(bubble => {
                bubble.y -= bubble.speed;
                bubble.wobble += bubble.wobbleSpeed;
                const wobbleX = Math.sin(bubble.wobble) * 8;
                
                if (bubble.y < -bubble.radius * 2) {
                    bubble.y = height + bubble.radius + Math.random() * 50;
                    bubble.x = Math.random() * width;
                }
                
                // リアルな泡
                const bx = bubble.x + wobbleX;
                const by = bubble.y;
                const r = bubble.radius;
                
                // 泡本体
                const bubbleGrad = bubbleCtx.createRadialGradient(
                    bx - r * 0.3, by - r * 0.3, 0,
                    bx, by, r
                );
                bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.9})`);
                bubbleGrad.addColorStop(0.4, `rgba(200, 235, 255, ${bubble.opacity * 0.5})`);
                bubbleGrad.addColorStop(0.8, `rgba(150, 200, 255, ${bubble.opacity * 0.2})`);
                bubbleGrad.addColorStop(1, `rgba(100, 180, 255, 0)`);
                
                bubbleCtx.beginPath();
                bubbleCtx.arc(bx, by, r, 0, Math.PI * 2);
                bubbleCtx.fillStyle = bubbleGrad;
                bubbleCtx.fill();
                
                // ハイライト
                bubbleCtx.beginPath();
                bubbleCtx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, Math.PI * 2);
                bubbleCtx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
                bubbleCtx.fill();
            });

            // プランクトン
            particles.forEach(p => {
                p.x += p.speedX + Math.sin(waterPhase + p.y * 0.01) * 0.3;
                p.y += p.speedY;
                
                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                
                bubbleCtx.beginPath();
                bubbleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                bubbleCtx.fillStyle = `rgba(200, 230, 255, ${p.opacity * (1 - depth * 0.5)})`;
                bubbleCtx.fill();
            });

            // 魚を描画
            fishCtx.clearRect(0, 0, width, height);
            fishes.forEach(fish => {
                if (elapsed * 60 > fish.delay) {
                    fish.x += fish.speed;
                    fish.phase += 0.15;
                    
                    // 自然な泳ぎの動き
                    const yOffset = Math.sin(fish.phase * 0.4) * fish.swimAmplitude;
                    
                    if (fish.x < width + fish.size * 3) {
                        // 深度による暗さ
                        fishCtx.globalAlpha = 1 - depth * 0.3;
                        drawRealisticFish(
                            fishCtx, 
                            fish.x, 
                            fish.y + yOffset, 
                            fish.size, 
                            fish.bodyColor, 
                            fish.finColor, 
                            fish.stripeColor, 
                            fish.phase
                        );
                        fishCtx.globalAlpha = 1;
                    }
                }
            });

            // 遷移先をゆっくりフェードイン（深度に連動）
            if (depth > 0.5) {
                const nextOpacity = (depth - 0.5) * 2; // 0.5〜1 → 0〜1
                gsap.set(next, { opacity: nextOpacity });
            }

            // 完了チェック（ゆっくり）
            if (elapsed > 10) { // 10秒
                isAnimating = false;
                gsap.to([mainCanvas, lightCanvas, bubbleCanvas, fishCanvas], {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        gsap.set(next, { opacity: 1 });
                        blocksContainer.innerHTML = '';
                        gsap.set(current, { opacity: 1 });
                        finishAnimation(current);
                    }
                });
                return;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    },

    // 燃焼エフェクト - 下から燃え上がり燃え尽きる
    burn: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // キャプチャ
        const currentIframe = current.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                capturedImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
            capturedImage = canvas;
        }

        // メインキャンバス（燃えている画像）
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
        blocksContainer.appendChild(mainCanvas);
        const ctx = mainCanvas.getContext('2d');

        // 炎キャンバス
        const fireCanvas = document.createElement('canvas');
        fireCanvas.width = width;
        fireCanvas.height = height;
        fireCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 15;`;
        blocksContainer.appendChild(fireCanvas);
        const fireCtx = fireCanvas.getContext('2d');

        // 煙・灰キャンバス
        const smokeCanvas = document.createElement('canvas');
        smokeCanvas.width = width;
        smokeCanvas.height = height;
        smokeCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 20;`;
        blocksContainer.appendChild(smokeCanvas);
        const smokeCtx = smokeCanvas.getContext('2d');

        // 火花キャンバス
        const sparkCanvas = document.createElement('canvas');
        sparkCanvas.width = width;
        sparkCanvas.height = height;
        sparkCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 25;`;
        blocksContainer.appendChild(sparkCanvas);
        const sparkCtx = sparkCanvas.getContext('2d');

        // 遷移先を準備（裏に配置）
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        gsap.set(current, { opacity: 0 });
        blocksContainer.style.opacity = '1';

        // 燃焼ライン（各列の燃焼位置）
        const burnLineResolution = 4;
        const burnLine = [];
        for (let x = 0; x < width; x += burnLineResolution) {
            burnLine.push({
                x: x,
                y: height,
                speed: 80 + Math.random() * 60, // さらに10倍速く
                noise: Math.random() * Math.PI * 2
            });
        }

        // 炎パーティクル
        const flames = [];
        
        // 煙パーティクル
        const smokes = [];

        // 火花パーティクル
        const sparks = [];

        // 灰パーティクル
        const ashes = [];

        let startTime = performance.now();
        let isAnimating = true;
        let phase = 0;

        // 炎パーティクルを生成（燃えてる感を増強）
        function spawnFlame(x, y) {
            // 赤〜オレンジ系を中心に
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.35) {
                color = { r: 255, g: 120 + Math.random() * 60, b: 0 }; // オレンジ
            } else if (colorChoice < 0.6) {
                color = { r: 255, g: 80 + Math.random() * 40, b: 0 }; // 赤オレンジ
            } else if (colorChoice < 0.85) {
                color = { r: 220, g: 40, b: 0 }; // 赤
            } else {
                color = { r: 255, g: 200 + Math.random() * 30, b: 80 }; // 明るいオレンジ
            }
            
            flames.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -4 - Math.random() * 6,
                size: 10 + Math.random() * 25, // サイズ大きく
                life: 1.0,
                decay: 0.025 + Math.random() * 0.03, // 少し長持ち
                color: color,
                turbulence: Math.random() * Math.PI * 2
            });
        }

        // 煙パーティクルを生成（抑えめ）
        function spawnSmoke(x, y) {
            // 1〜2個の煙を生成
            const count = 1 + Math.floor(Math.random() * 1.5);
            for (let i = 0; i < count; i++) {
                smokes.push({
                    x: x + (Math.random() - 0.5) * 30,
                    y: y - 10 - Math.random() * 20,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -2 - Math.random() * 2,
                    size: 20 + Math.random() * 35,
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.015,
                    opacity: 0.25 + Math.random() * 0.2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.03
                });
            }
        }

        // 火花パーティクルを生成
        function spawnSpark(x, y) {
            sparks.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: -4 - Math.random() * 5,
                size: 0.5 + Math.random() * 1.5, // 小さく
                life: 1.0,
                decay: 0.05 + Math.random() * 0.05, // 早く消える
                gravity: 0.15
            });
        }

        // 灰パーティクルを生成
        function spawnAsh(x, y) {
            ashes.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -1 - Math.random() * 2,
                size: 1.5 + Math.random() * 2.5,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.015,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }

        // リアルな炎を描画（黄色を控えめに）
        function drawFlame(ctx, flame) {
            const size = flame.size * flame.life;
            if (size < 1) return;
            
            const gradient = ctx.createRadialGradient(
                flame.x, flame.y, 0,
                flame.x, flame.y, size
            );
            
            const alpha = flame.life * 0.7;
            // 中心も黄色を抑えめに
            gradient.addColorStop(0, `rgba(255, 200, 120, ${alpha * 0.8})`);
            gradient.addColorStop(0.15, `rgba(${flame.color.r}, ${flame.color.g}, ${flame.color.b}, ${alpha * 0.7})`);
            gradient.addColorStop(0.4, `rgba(${Math.floor(flame.color.r * 0.6)}, ${Math.floor(flame.color.g * 0.3)}, 0, ${alpha * 0.4})`);
            gradient.addColorStop(0.7, `rgba(80, 20, 0, ${alpha * 0.15})`);
            gradient.addColorStop(1, `rgba(30, 0, 0, 0)`);

            ctx.beginPath();
            ctx.arc(flame.x, flame.y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // 煙を描画（濃くして境界を隠す）
        function drawSmoke(ctx, smoke) {
            ctx.save();
            ctx.translate(smoke.x, smoke.y);
            ctx.rotate(smoke.rotation);
            
            const size = smoke.size * (0.5 + smoke.life * 0.5); // サイズ維持
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            const alpha = smoke.opacity * smoke.life;
            // より濃いグラデーション
            gradient.addColorStop(0, `rgba(40, 40, 45, ${alpha * 1.2})`);
            gradient.addColorStop(0.3, `rgba(35, 35, 40, ${alpha * 0.9})`);
            gradient.addColorStop(0.6, `rgba(30, 30, 35, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(20, 20, 25, 0)`);

            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000;
            phase += 0.1;

            // 燃焼ラインを更新（下から上へ）
            let allBurned = true;
            burnLine.forEach((point, index) => {
                if (point.y > -50) {
                    allBurned = false;
                    // ノイズを加えた不規則な燃焼速度
                    const noise = Math.sin(phase + point.noise) * 0.3;
                    point.y -= point.speed * (1 + noise);
                    
                    // 燃焼ラインでパーティクル生成
                    if (Math.random() < 0.7) { // 炎を増強
                        spawnFlame(point.x, point.y);
                    }
                    if (Math.random() < 0.25) { // 煙を抑える
                        spawnSmoke(point.x, point.y);
                    }
                    if (Math.random() < 0.3) { // 火花も少し増やす
                        spawnSpark(point.x, point.y);
                    }
                    if (Math.random() < 0.1) {
                        spawnAsh(point.x, point.y);
                    }
                }
            });

            // メイン画像を描画（燃えた部分はクリップ）
            ctx.clearRect(0, 0, width, height);
            
            // 燃焼マスクを作成
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            
            // 燃焼ラインに沿ってパスを描画
            for (let i = burnLine.length - 1; i >= 0; i--) {
                const point = burnLine[i];
                // 波打つ燃焼エッジ
                const waveY = point.y + Math.sin(phase * 2 + i * 0.3) * 8;
                ctx.lineTo(point.x + burnLineResolution, Math.max(0, waveY));
            }
            ctx.lineTo(0, burnLine[0].y);
            ctx.closePath();
            ctx.clip();

            // 熱による揺らぎ効果
            for (let y = 0; y < height; y += 1) {
                // 燃焼ラインに近いほど揺らぎが強い
                const avgBurnY = burnLine.reduce((sum, p) => sum + p.y, 0) / burnLine.length;
                const distToBurn = Math.abs(y - avgBurnY);
                const heatDistortion = distToBurn < 100 ? (1 - distToBurn / 100) * 5 : 0;
                const offset = Math.sin(y * 0.05 + phase * 3) * heatDistortion;
                
                ctx.drawImage(capturedImage, 0, y, width, 1, offset, y, width, 1);
            }

            // 燃焼エッジの焦げ効果
            ctx.restore();
            
            // 焦げたエッジを描画
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < burnLine.length; i++) {
                const point = burnLine[i];
                const waveY = point.y + Math.sin(phase * 2 + i * 0.3) * 8;
                if (i === 0) {
                    ctx.moveTo(point.x, waveY);
                } else {
                    ctx.lineTo(point.x + burnLineResolution, waveY);
                }
            }
            // エッジに焦げグラデーション
            for (let i = burnLine.length - 1; i >= 0; i--) {
                const point = burnLine[i];
                const waveY = point.y + Math.sin(phase * 2 + i * 0.3) * 8 - 25;
                ctx.lineTo(point.x + burnLineResolution, waveY);
            }
            ctx.closePath();
            
            const burnGradient = ctx.createLinearGradient(0, 0, 0, 30);
            burnGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            burnGradient.addColorStop(0.3, 'rgba(30, 15, 0, 0.8)');
            burnGradient.addColorStop(0.6, 'rgba(60, 30, 0, 0.6)');
            burnGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = burnGradient;
            ctx.fill();
            ctx.restore();

            // 炎を描画
            fireCtx.clearRect(0, 0, width, height);
            fireCtx.globalCompositeOperation = 'lighter';
            
            flames.forEach((flame, index) => {
                flame.x += flame.vx + Math.sin(phase * 5 + flame.turbulence) * 1.5;
                flame.y += flame.vy;
                flame.vy *= 0.98;
                flame.life -= flame.decay;
                flame.turbulence += 0.1;
                
                if (flame.life > 0) {
                    drawFlame(fireCtx, flame);
                }
            });
            
            // 消えた炎を削除
            for (let i = flames.length - 1; i >= 0; i--) {
                if (flames[i].life <= 0) flames.splice(i, 1);
            }

            // 煙を描画
            smokeCtx.clearRect(0, 0, width, height);
            
            smokes.forEach((smoke, index) => {
                smoke.x += smoke.vx;
                smoke.y += smoke.vy;
                smoke.size *= 1.01;
                smoke.life -= smoke.decay;
                smoke.rotation += smoke.rotationSpeed;
                
                if (smoke.life > 0) {
                    drawSmoke(smokeCtx, smoke);
                }
            });
            
            for (let i = smokes.length - 1; i >= 0; i--) {
                if (smokes[i].life <= 0) smokes.splice(i, 1);
            }

            // 火花を描画
            sparkCtx.clearRect(0, 0, width, height);
            sparkCtx.globalCompositeOperation = 'lighter';
            
            sparks.forEach((spark) => {
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.vy += spark.gravity;
                spark.life -= spark.decay;
                
                if (spark.life > 0) {
                    const alpha = spark.life * 0.8;
                    // 火花は小さく控えめに
                    sparkCtx.beginPath();
                    sparkCtx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
                    sparkCtx.fillStyle = `rgba(255, ${150 + Math.random() * 50}, 50, ${alpha})`;
                    sparkCtx.fill();
                    
                    // 火花の軌跡（短く）
                    sparkCtx.beginPath();
                    sparkCtx.moveTo(spark.x, spark.y);
                    sparkCtx.lineTo(spark.x - spark.vx * 1.5, spark.y - spark.vy * 1.5);
                    sparkCtx.strokeStyle = `rgba(255, 120, 30, ${alpha * 0.4})`;
                    sparkCtx.lineWidth = spark.size * 0.4;
                    sparkCtx.stroke();
                }
            });
            
            for (let i = sparks.length - 1; i >= 0; i--) {
                if (sparks[i].life <= 0) sparks.splice(i, 1);
            }

            // 灰を描画
            ashes.forEach((ash) => {
                ash.x += ash.vx + Math.sin(phase + ash.rotation) * 0.5;
                ash.y += ash.vy;
                ash.life -= ash.decay;
                ash.rotation += ash.rotationSpeed;
                
                if (ash.life > 0) {
                    smokeCtx.save();
                    smokeCtx.translate(ash.x, ash.y);
                    smokeCtx.rotate(ash.rotation);
                    smokeCtx.fillStyle = `rgba(40, 40, 40, ${ash.life * 0.7})`;
                    smokeCtx.fillRect(-ash.size / 2, -ash.size / 2, ash.size, ash.size * 0.5);
                    smokeCtx.restore();
                }
            });
            
            for (let i = ashes.length - 1; i >= 0; i--) {
                if (ashes[i].life <= 0) ashes.splice(i, 1);
            }

            // 完了チェック（高速化）
            if (allBurned && flames.length < 5) {
                isAnimating = false;
                
                gsap.to([mainCanvas, fireCanvas, smokeCanvas, sparkCanvas], {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        blocksContainer.innerHTML = '';
                        gsap.set(current, { opacity: 1 });
                        finishAnimation(current);
                    }
                });
                return;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    },

    // ブラックホール/異世界ゲートエフェクト
    blackhole: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // 現在のページをキャプチャ
        const currentIframe = current.querySelector('iframe');
        let currentImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                currentImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
            currentImage = canvas;
        }

        // 次のページをキャプチャ（画面外で行う）
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1, visibility: 'hidden' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const nextIframe = next.querySelector('iframe');
        let nextImage = null;
        try {
            const iframeDoc = nextIframe.contentDocument || nextIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                nextImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#764ba2';
            ctx.fillRect(0, 0, width, height);
            nextImage = canvas;
        }

        gsap.set(next, { opacity: 0, visibility: 'visible' });
        gsap.set(current, { opacity: 0 });

        // メインキャンバス
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
        blocksContainer.appendChild(mainCanvas);
        const ctx = mainCanvas.getContext('2d');

        blocksContainer.style.opacity = '1';

        // パーティクル配列（画面を分割）
        const particles = [];
        const gridSize = 12; // グリッドサイズ
        const cols = Math.ceil(width / gridSize);
        const rows = Math.ceil(height / gridSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gridSize;
                const y = row * gridSize;
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                particles.push({
                    x: x,
                    y: y,
                    origX: x,
                    origY: y,
                    size: gridSize,
                    dist: dist,
                    angle: angle,
                    rotation: 0,
                    scale: 1,
                    opacity: 1,
                    absorbed: false,
                    delay: dist / Math.max(width, height) // 距離に応じた遅延
                });
            }
        }

        // ポータルのパラメータ
        let portalRadius = 0;
        const maxPortalRadius = Math.min(width, height) * 0.15;
        let portalRotation = 0;
        
        // 渦巻きエフェクト用
        const spiralArms = 5;
        
        // 次のページ用パーティクル
        const nextParticles = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gridSize;
                const y = row * gridSize;
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                nextParticles.push({
                    x: centerX,
                    y: centerY,
                    origX: x,
                    origY: y,
                    size: gridSize,
                    dist: dist,
                    angle: angle,
                    rotation: 720 * Math.PI / 180,
                    scale: 0,
                    opacity: 0,
                    delay: dist / Math.max(width, height)
                });
            }
        }
        
        // 写実的な稲妻を生成する関数
        function generateLightningBolt(startX, startY, endX, endY, depth = 0, maxDepth = 4) {
            const segments = [];
            const points = [{ x: startX, y: startY }];
            
            // 開始点から終了点への方向
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const baseAngle = Math.atan2(dy, dx);
            
            // 稲妻の細かさ（深さに応じて）
            const numPoints = Math.max(3, Math.floor(length / (8 + depth * 3)));
            
            let x = startX, y = startY;
            let totalLen = 0;
            
            for (let i = 1; i < numPoints; i++) {
                const t = i / numPoints;
                // 基本位置（直線上）
                const baseX = startX + dx * t;
                const baseY = startY + dy * t;
                
                // 鋭角的なジグザグ（不規則なオフセット）
                const perpAngle = baseAngle + Math.PI / 2;
                // 急激な角度変化のために、時々大きくずれる
                const jitterIntensity = (depth === 0 ? 35 : 20 / (depth + 1)) * (1 - t * 0.5);
                const jitter = (Math.random() - 0.5) * jitterIntensity * 2;
                // 追加でランダムに鋭角的な変化
                const sharpJitter = Math.random() < 0.3 ? (Math.random() - 0.5) * jitterIntensity * 1.5 : 0;
                
                const offsetX = Math.cos(perpAngle) * (jitter + sharpJitter);
                const offsetY = Math.sin(perpAngle) * (jitter + sharpJitter);
                
                const newX = baseX + offsetX;
                const newY = baseY + offsetY;
                
                const segLen = Math.sqrt((newX - x) ** 2 + (newY - y) ** 2);
                segments.push({
                    x1: x, y1: y,
                    x2: newX, y2: newY,
                    len: totalLen,
                    depth: depth,
                    width: Math.max(0.3, 2.5 - depth * 0.6 - t * 1.5)
                });
                
                x = newX;
                y = newY;
                totalLen += segLen;
                points.push({ x: newX, y: newY });
            }
            
            // 最後のセグメント
            segments.push({
                x1: x, y1: y,
                x2: endX, y2: endY,
                len: totalLen,
                depth: depth,
                width: Math.max(0.2, 1 - depth * 0.3)
            });
            
            return { segments, maxLen: totalLen + Math.sqrt((endX - x) ** 2 + (endY - y) ** 2), points, depth };
        }
        
        // 分岐を生成する関数
        function generateBranches(mainBolt, maxDepth = 3) {
            const branches = [];
            const points = mainBolt.points;
            const depth = mainBolt.depth;
            
            if (depth >= maxDepth) return branches;
            
            // ランダムな点から分岐
            const numBranches = depth === 0 ? 4 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
            
            for (let b = 0; b < numBranches; b++) {
                const pointIndex = Math.floor(Math.random() * (points.length - 2)) + 1;
                const point = points[pointIndex];
                
                // 分岐方向（メインから逸れる方向）
                const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
                const mainAngle = Math.atan2(
                    points[Math.min(pointIndex + 1, points.length - 1)].y - point.y,
                    points[Math.min(pointIndex + 1, points.length - 1)].x - point.x
                );
                const angle = mainAngle + branchAngle;
                
                // 分岐の長さ（深さに応じて短く）
                const branchLength = (60 + Math.random() * 100) / (depth + 1);
                const endX = point.x + Math.cos(angle) * branchLength;
                const endY = point.y + Math.sin(angle) * branchLength;
                
                const branch = generateLightningBolt(point.x, point.y, endX, endY, depth + 1, maxDepth);
                branches.push(branch);
                
                // 再帰的に小さい分岐を追加
                if (depth + 1 < maxDepth && Math.random() < 0.5) {
                    const subBranches = generateBranches(branch, maxDepth);
                    branches.push(...subBranches);
                }
            }
            
            return branches;
        }
        
        // 稲妻データ（縦方向メイン）
        const cracks = [];
        
        // メインの縦稲妻（中央から上下に）
        for (let i = 0; i < 2; i++) {
            const offsetX = (i - 0.5) * 40 + (Math.random() - 0.5) * 30;
            
            // 上方向
            const boltUp = generateLightningBolt(
                centerX + offsetX, centerY,
                centerX + offsetX + (Math.random() - 0.5) * 80, -30,
                0, 4
            );
            cracks.push(boltUp);
            cracks.push(...generateBranches(boltUp, 3));
            
            // 下方向
            const boltDown = generateLightningBolt(
                centerX + offsetX, centerY,
                centerX + offsetX + (Math.random() - 0.5) * 80, height + 30,
                0, 4
            );
            cracks.push(boltDown);
            cracks.push(...generateBranches(boltDown, 3));
        }
        
        // 追加の細い稲妻
        for (let i = 0; i < 3; i++) {
            const startX = centerX + (Math.random() - 0.5) * 60;
            const startY = centerY + (Math.random() - 0.5) * 40;
            const goingUp = Math.random() > 0.5;
            const endY = goingUp ? -20 : height + 20;
            const endX = startX + (Math.random() - 0.5) * 120;
            
            const bolt = generateLightningBolt(startX, startY, endX, endY, 1, 3);
            cracks.push(bolt);
            cracks.push(...generateBranches(bolt, 2));
        }
        
        let startTime = performance.now();
        let isAnimating = true;
        let phase = 0; // 0: 空間割れ, 1: 吸い込み, 2: 吐き出し
        
        // 断続的な稲妻のタイミング制御
        let lastFlashTime = 0;
        let flashActive = false;
        let flashIntensity = 0;
        let burstCount = 0;
        
        // 「ジジ...ジジジ...バリバリ...ピシピシ...ガパ！」のタイミング（3秒版）
        const timingEvents = [
            { time: 0.0, type: 'jiji', intensity: 0.12, duration: 0.15 },      // ジ
            { time: 0.2, type: 'jiji', intensity: 0.15, duration: 0.12 },      // ジ
            { time: 0.4, type: 'jiji', intensity: 0.13, duration: 0.1 },       // ジ
            { time: 0.6, type: 'jijiji', intensity: 0.22, duration: 0.18 },    // ジジジ
            { time: 0.85, type: 'jiji', intensity: 0.18, duration: 0.12 },     // ジ
            { time: 1.05, type: 'jiji', intensity: 0.2, duration: 0.1 },       // ジ
            { time: 1.25, type: 'jijiji', intensity: 0.3, duration: 0.2 },     // ジジジジ
            { time: 1.55, type: 'jiji', intensity: 0.25, duration: 0.12 },     // ジ
            { time: 1.75, type: 'jijiji', intensity: 0.38, duration: 0.22 },   // ジジジジジ
            { time: 2.05, type: 'bari', intensity: 0.55, duration: 0.12 },     // バリ
            { time: 2.22, type: 'bari', intensity: 0.65, duration: 0.12 },     // バリバリ
            { time: 2.4, type: 'pishi', intensity: 0.75, duration: 0.06 },     // ピシ
            { time: 2.5, type: 'pishi', intensity: 0.82, duration: 0.05 },     // ピシ
            { time: 2.6, type: 'pishi', intensity: 0.9, duration: 0.05 },      // ピシ
            { time: 2.7, type: 'pishi', intensity: 0.95, duration: 0.04 },     // ピシ
            { time: 2.8, type: 'gapa', intensity: 1.0, duration: 0.4 }         // ガパ！
        ];

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000;
            
            if (phase === 0) {
                // フェーズ0: 空間が割れる (3.2秒) - 段階的に
                const duration = 3.2;
                const progress = Math.min(elapsed / duration, 1);
                
                // キャンバスをクリア
                ctx.clearRect(0, 0, width, height);
                
                // 現在のイベントを特定
                let currentEvent = null;
                let eventProgress = 0;
                for (let i = timingEvents.length - 1; i >= 0; i--) {
                    if (elapsed >= timingEvents[i].time) {
                        currentEvent = timingEvents[i];
                        eventProgress = Math.min(1, (elapsed - currentEvent.time) / currentEvent.duration);
                        break;
                    }
                }
                
                // 断続的な震え（イベントに応じて）
                let shakeAmount = 0;
                if (currentEvent) {
                    if (currentEvent.type === 'jiji' || currentEvent.type === 'jijiji') {
                        // ジジジ：小さな断続的な震え
                        shakeAmount = eventProgress < 0.8 ? currentEvent.intensity * 5 * (Math.random() > 0.5 ? 1 : 0) : 0;
                    } else if (currentEvent.type === 'bari') {
                        // バリバリ：激しい震え
                        shakeAmount = currentEvent.intensity * 12;
                    } else if (currentEvent.type === 'pishi') {
                        // ピシ：鋭い一瞬の震え
                        shakeAmount = eventProgress < 0.5 ? currentEvent.intensity * 8 : 0;
                    } else if (currentEvent.type === 'gapa') {
                        // ガパ！：大きな震えから静まる
                        shakeAmount = currentEvent.intensity * 15 * (1 - eventProgress);
                    }
                }
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                // ガパ！の瞬間：世界が歪む「ドン！」効果
                if (currentEvent && currentEvent.type === 'gapa') {
                    const distortProgress = eventProgress;
                    // 最初に膨張して戻る
                    const bulgeAmount = Math.sin(distortProgress * Math.PI) * 0.15;
                    const scaleX = 1 + bulgeAmount * (1 - distortProgress * 0.5);
                    const scaleY = 1 + bulgeAmount * 0.7 * (1 - distortProgress * 0.5);
                    
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.scale(scaleX, scaleY);
                    ctx.translate(-centerX, -centerY);
                    ctx.drawImage(currentImage, shakeX, shakeY);
                    ctx.restore();
                    
                    // 衝撃波リング（歪んだ形状）
                    if (distortProgress < 0.6) {
                        const ringProgress = distortProgress / 0.6;
                        const ringRadius = ringProgress * Math.max(width, height) * 0.8;
                        const ringWidth = 30 * (1 - ringProgress);
                        
                        ctx.save();
                        ctx.translate(centerX, centerY);
                        
                        // 歪んだ衝撃波を描画
                        const drawDistortedRing = (radius, color, lineW) => {
                            ctx.strokeStyle = color;
                            ctx.lineWidth = lineW;
                            ctx.beginPath();
                            for (let a = 0; a <= Math.PI * 2; a += 0.08) {
                                // 不規則な歪み
                                const noise = Math.sin(a * 6 + elapsed * 15) * 8 
                                            + Math.sin(a * 3 + elapsed * 10) * 12
                                            + Math.cos(a * 9 + elapsed * 20) * 5;
                                const r = radius + noise * (1 - ringProgress);
                                const x = Math.cos(a) * r;
                                const y = Math.sin(a) * r;
                                if (a === 0) ctx.moveTo(x, y);
                                else ctx.lineTo(x, y);
                            }
                            ctx.closePath();
                            ctx.stroke();
                        };
                        
                        // 白い衝撃波
                        drawDistortedRing(ringRadius, `rgba(255, 255, 255, ${0.4 * (1 - ringProgress)})`, ringWidth);
                        
                        // 歪みリング（紫）
                        drawDistortedRing(ringRadius * 0.92, `rgba(180, 100, 255, ${0.3 * (1 - ringProgress)})`, ringWidth * 1.3);
                        
                        // 内側のリング（より歪んだ）
                        drawDistortedRing(ringRadius * 0.85, `rgba(138, 43, 226, ${0.2 * (1 - ringProgress)})`, ringWidth * 0.8);
                        
                        ctx.restore();
                    }
                    
                    // 空間の裂け目から漏れる光（不規則で歪んだ形状）
                    if (distortProgress > 0.2) {
                        const tearProgress = (distortProgress - 0.2) / 0.8;
                        const tearWidth = 15 + tearProgress * 60;
                        const tearHeight = height * 0.5 + tearProgress * height * 0.4;
                        
                        ctx.save();
                        ctx.translate(centerX, centerY);
                        
                        // 不規則な裂け目を複数のパスで描画
                        const numTears = 3 + Math.floor(tearProgress * 4);
                        for (let t = 0; t < numTears; t++) {
                            const tearOffsetX = (Math.sin(t * 2.7 + elapsed * 3) * 8) * tearProgress;
                            const tearOffsetY = (Math.cos(t * 1.9 + elapsed * 2) * 15) * tearProgress;
                            const tearScaleX = 0.6 + Math.sin(t * 1.3) * 0.4;
                            const tearScaleY = 0.7 + Math.cos(t * 2.1) * 0.3;
                            const tearAlpha = (0.3 + (numTears - t) / numTears * 0.5) * tearProgress;
                            
                            // 歪んだ裂け目のパス
                            ctx.beginPath();
                            const points = 12;
                            for (let i = 0; i <= points; i++) {
                                const angle = (i / points) * Math.PI * 2;
                                // 縦長の楕円を基本に、不規則な歪みを加える
                                const baseX = Math.cos(angle) * tearWidth * tearScaleX;
                                const baseY = Math.sin(angle) * tearHeight / 2 * tearScaleY;
                                // ノイズで歪ませる
                                const noise = Math.sin(angle * 5 + elapsed * 8 + t) * (8 + tearProgress * 15)
                                            + Math.sin(angle * 3 + elapsed * 5) * 5;
                                const noiseY = Math.cos(angle * 4 + elapsed * 6 + t * 2) * (10 + tearProgress * 20);
                                const px = tearOffsetX + baseX + (Math.abs(Math.sin(angle)) < 0.3 ? noise : noise * 0.3);
                                const py = tearOffsetY + baseY + noiseY * 0.5;
                                
                                if (i === 0) ctx.moveTo(px, py);
                                else ctx.lineTo(px, py);
                            }
                            ctx.closePath();
                            
                            // グラデーション（中心から外へ）
                            const grad = ctx.createRadialGradient(tearOffsetX, tearOffsetY, 0, tearOffsetX, tearOffsetY, tearHeight / 2);
                            if (t === 0) {
                                // 最も内側は白く光る
                                grad.addColorStop(0, `rgba(255, 255, 255, ${tearAlpha})`);
                                grad.addColorStop(0.4, `rgba(220, 180, 255, ${tearAlpha * 0.7})`);
                                grad.addColorStop(1, 'rgba(138, 43, 226, 0)');
                            } else {
                                // 外側は紫のオーラ
                                grad.addColorStop(0, `rgba(200, 150, 255, ${tearAlpha * 0.6})`);
                                grad.addColorStop(0.5, `rgba(138, 80, 200, ${tearAlpha * 0.4})`);
                                grad.addColorStop(1, 'rgba(80, 20, 120, 0)');
                            }
                            ctx.fillStyle = grad;
                            ctx.fill();
                        }
                        
                        // 裂け目のエッジに稲妻風のギザギザ
                        if (tearProgress > 0.3) {
                            const edgeAlpha = (tearProgress - 0.3) / 0.7;
                            ctx.strokeStyle = `rgba(255, 255, 200, ${edgeAlpha * 0.8})`;
                            ctx.shadowColor = 'rgba(255, 240, 150, 0.8)';
                            ctx.shadowBlur = 5;
                            ctx.lineWidth = 0.5 + Math.random() * 0.5;
                            
                            // 上下に伸びるギザギザエッジ
                            for (let side = -1; side <= 1; side += 2) {
                                ctx.beginPath();
                                let ex = (Math.random() - 0.5) * tearWidth * 0.8;
                                let ey = side * tearHeight * 0.1;
                                ctx.moveTo(ex, ey);
                                const edgeLen = tearHeight * 0.4 * tearProgress;
                                let traveled = 0;
                                while (traveled < edgeLen) {
                                    const segLen = 5 + Math.random() * 12;
                                    ex += (Math.random() - 0.5) * 15;
                                    ey += side * segLen;
                                    ctx.lineTo(ex, ey);
                                    traveled += segLen;
                                }
                                ctx.stroke();
                            }
                        }
                        
                        ctx.restore();
                    }
                } else {
                    ctx.drawImage(currentImage, shakeX, shakeY);
                }
                
                // 稲妻の描画関数（極細・黄色感・断続的なちらつき）
                function drawLightningSegment(seg, segProgress, depth, flickerState, burstIntensity, isUltraThin = false) {
                    // 極細モードか通常か
                    const thinFactor = isUltraThin ? 0.3 : 1;
                    const baseWidth = Math.max(0.2, (seg.width || (1.5 - depth * 0.4)) * thinFactor);
                    
                    // 断続的な表示（ジジジ感）
                    const showFlicker = flickerState > 0.25;
                    if (!showFlicker && burstIntensity < 0.4) return;
                    
                    const intensityMult = Math.max(flickerState, burstIntensity);
                    
                    ctx.save();
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    if (!isUltraThin) {
                        // 通常の稲妻：外側の淡い黄色グロー
                        ctx.shadowColor = 'rgba(255, 240, 150, 0.6)';
                        ctx.shadowBlur = (10 - depth * 2) * intensityMult;
                        ctx.strokeStyle = `rgba(255, 230, 120, ${0.25 * segProgress * intensityMult})`;
                        ctx.lineWidth = (baseWidth * 2.5 + 3 - depth) * intensityMult;
                        ctx.beginPath();
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                        ctx.stroke();
                        
                        // 中間：白～淡い黄色
                        ctx.shadowColor = 'rgba(255, 255, 220, 0.9)';
                        ctx.shadowBlur = (6 - depth) * intensityMult;
                        ctx.strokeStyle = `rgba(255, 255, 200, ${0.5 * segProgress * intensityMult})`;
                        ctx.lineWidth = (baseWidth + 1 - depth * 0.2) * intensityMult;
                        ctx.stroke();
                    }
                    
                    // コア：純白で極細の鋭い線
                    ctx.shadowColor = isUltraThin ? 'rgba(255, 255, 200, 0.8)' : 'rgba(255, 255, 255, 1)';
                    ctx.shadowBlur = isUltraThin ? 2 : 3 * intensityMult;
                    ctx.strokeStyle = `rgba(255, 255, ${isUltraThin ? 220 : 255}, ${segProgress * (isUltraThin ? 0.8 : 1)})`;
                    ctx.lineWidth = Math.max(0.3, baseWidth * 0.5 * intensityMult);
                    ctx.beginPath();
                    ctx.moveTo(seg.x1, seg.y1);
                    ctx.lineTo(seg.x2, seg.y2);
                    ctx.stroke();
                    
                    ctx.restore();
                }
                
                // 稲妻の進行度（イベントベース）
                let crackProgress = 0;
                let burstIntensity = 0;
                
                if (currentEvent) {
                    // 各イベントで稲妻が段階的に伸びる
                    const baseProgress = timingEvents.indexOf(currentEvent) / timingEvents.length;
                    const eventContribution = eventProgress * (1 / timingEvents.length);
                    crackProgress = Math.min(1, baseProgress + eventContribution);
                    burstIntensity = currentEvent.intensity * (1 - eventProgress * 0.5);
                }
                
                // 高速なちらつき（ジジジ感）
                const flickerSpeed = currentEvent?.type === 'jiji' || currentEvent?.type === 'jijiji' ? 80 : 40;
                const flickerState = (Math.sin(elapsed * flickerSpeed) + 1) / 2 
                                   * (Math.sin(elapsed * 127) + 1) / 2;
                
                // 稲妻を描画（メインと極細を交互に）
                cracks.forEach((crack, crackIndex) => {
                    const crackDelay = crackIndex * 0.015;
                    const adjustedProgress = Math.max(0, (crackProgress - crackDelay) / (1 - crackDelay));
                    const currentLen = crack.maxLen * adjustedProgress;
                    const depth = crack.depth || 0;
                    
                    // 深い分岐は後から出現
                    if (depth > 0 && crackProgress < 0.4) return;
                    if (depth > 1 && crackProgress < 0.6) return;
                    if (depth > 2 && crackProgress < 0.8) return;
                    
                    // 一部を極細として描画
                    const isUltraThin = depth >= 2 || (crackIndex % 3 === 0 && depth >= 1);
                    
                    crack.segments.forEach((seg, segIdx) => {
                        if (seg.len < currentLen) {
                            const segProgress = Math.min(1, (currentLen - seg.len) / 10);
                            drawLightningSegment(seg, segProgress, depth, flickerState, burstIntensity, isUltraThin);
                        }
                    });
                });
                
                // 追加の極細稲妻（ランダムに走る）
                if (currentEvent && burstIntensity > 0.3 && Math.random() < 0.5) {
                    const numThinBolts = currentEvent.type === 'gapa' ? 5 : 2;
                    for (let t = 0; t < numThinBolts; t++) {
                        const startX = centerX + (Math.random() - 0.5) * 80;
                        const startY = centerY + (Math.random() - 0.5) * 50;
                        const angle = Math.random() * Math.PI * 2;
                        const length = 30 + Math.random() * 80;
                        
                        ctx.save();
                        ctx.strokeStyle = `rgba(255, 255, 230, ${0.6 * burstIntensity})`;
                        ctx.shadowColor = 'rgba(255, 240, 150, 0.7)';
                        ctx.shadowBlur = 3;
                        ctx.lineWidth = 0.3 + Math.random() * 0.4;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        
                        let x = startX, y = startY;
                        let currentAngle = angle;
                        const segments = 5 + Math.floor(Math.random() * 6);
                        for (let s = 0; s < segments; s++) {
                            currentAngle += (Math.random() - 0.5) * 1.5;
                            const segLen = length / segments * (0.5 + Math.random());
                            x += Math.cos(currentAngle) * segLen;
                            y += Math.sin(currentAngle) * segLen;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                
                // イベントに応じたフラッシュ効果
                if (currentEvent && eventProgress < 0.3) {
                    let flashAlpha = 0;
                    if (currentEvent.type === 'bari') {
                        flashAlpha = 0.15 * (1 - eventProgress / 0.3);
                    } else if (currentEvent.type === 'pishi') {
                        flashAlpha = 0.25 * (1 - eventProgress / 0.3);
                    } else if (currentEvent.type === 'gapa') {
                        flashAlpha = 0.5 * (1 - eventProgress / 0.3);
                    }
                    if (flashAlpha > 0) {
                        ctx.save();
                        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }
                
                // ピシピシの鋭い火花
                if (currentEvent && (currentEvent.type === 'pishi' || currentEvent.type === 'bari') && Math.random() < 0.4) {
                    const sparkX = centerX + (Math.random() - 0.5) * 150;
                    const sparkY = centerY + (Math.random() - 0.5) * height * 0.6;
                    
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.shadowColor = 'rgba(200, 220, 255, 1)';
                    ctx.shadowBlur = 8;
                    ctx.lineWidth = 0.5 + Math.random();
                    ctx.beginPath();
                    ctx.moveTo(sparkX, sparkY);
                    // 鋭いジグザグ
                    let sx = sparkX, sy = sparkY;
                    const sparkAngle = Math.random() * Math.PI * 2;
                    for (let i = 0; i < 4; i++) {
                        sx += Math.cos(sparkAngle + (Math.random() - 0.5) * 2) * (5 + Math.random() * 10);
                        sy += Math.sin(sparkAngle + (Math.random() - 0.5) * 2) * (5 + Math.random() * 10);
                        ctx.lineTo(sx, sy);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
                
                // 中心からの光（ガパ！で最大）
                if (currentEvent && (currentEvent.type === 'gapa' || currentEvent.type === 'pishi')) {
                    const glowIntensity = currentEvent.type === 'gapa' ? eventProgress : 0.3;
                    const glowRadius = 50 + glowIntensity * 120;
                    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * glowIntensity})`);
                    gradient.addColorStop(0.2, `rgba(200, 180, 255, ${0.6 * glowIntensity})`);
                    gradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.4 * glowIntensity})`);
                    gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 画面端のビネット
                const vignetteGradient = ctx.createRadialGradient(centerX, centerY, Math.min(width, height) * 0.3, centerX, centerY, Math.max(width, height) * 0.8);
                vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${progress * 0.5})`);
                ctx.fillStyle = vignetteGradient;
                ctx.fillRect(0, 0, width, height);
                
                if (progress >= 1) {
                    phase = 1;
                    startTime = performance.now();
                }
            } else if (phase === 1) {
                // フェーズ1: 吸い込み (2秒)
                const duration = 2.0;
                const progress = Math.min(elapsed / duration, 1);

                // ポータルの成長
                const portalProgress = Math.min(progress * 2, 1);
                portalRadius = maxPortalRadius * (1 - Math.pow(1 - portalProgress, 3));
                portalRotation += 0.15; // 時計回り

                // キャンバスをクリア
                ctx.clearRect(0, 0, width, height);
                
                // 背景を暗くする
                const bgDarkness = Math.min(0.5 + progress * 0.3, 0.8);
                ctx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
                ctx.fillRect(0, 0, width, height);
                
                // 残りの亀裂（フェードアウト）
                const crackFade = 1 - progress;
                if (crackFade > 0) {
                    cracks.forEach((crack, crackIndex) => {
                        crack.segments.forEach(seg => {
                            ctx.strokeStyle = `rgba(180, 100, 255, ${0.3 * crackFade})`;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(seg.x1, seg.y1);
                            ctx.lineTo(seg.x2, seg.y2);
                            ctx.stroke();
                        });
                    });
                }

                // パーティクルを更新・描画（吸い込み）
                const suctionForce = Math.pow(progress, 1.5) * 2;
                
                particles.forEach(p => {
                    if (!p.absorbed) {
                        const effectProgress = Math.max(0, (progress - p.delay * 0.3) * 1.5);
                        
                        if (effectProgress > 0) {
                            const pullStrength = effectProgress * suctionForce;
                            const targetDist = p.dist * (1 - pullStrength);
                            const spiralAngle = p.angle + pullStrength * 3;
                            
                            p.x = centerX + Math.cos(spiralAngle) * targetDist;
                            p.y = centerY + Math.sin(spiralAngle) * targetDist;
                            p.rotation = pullStrength * 720 * Math.PI / 180;
                            p.scale = Math.max(0, 1 - pullStrength * 0.8);
                            p.opacity = Math.max(0, 1 - pullStrength * 0.9);
                            
                            const currentDist = Math.sqrt(
                                Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)
                            );
                            if (currentDist < portalRadius * 0.5) {
                                p.absorbed = true;
                            }
                        }
                    }
                    
                    if (!p.absorbed && p.opacity > 0 && p.scale > 0) {
                        ctx.save();
                        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
                        ctx.rotate(p.rotation);
                        ctx.scale(p.scale, p.scale);
                        ctx.globalAlpha = p.opacity;
                        ctx.drawImage(
                            currentImage,
                            p.origX, p.origY, p.size, p.size,
                            -p.size / 2, -p.size / 2, p.size, p.size
                        );
                        ctx.restore();
                    }
                });

                // ポータル描画
                drawPortal(ctx, centerX, centerY, portalRadius, portalRotation, spiralArms, maxPortalRadius);

                if (progress >= 1) {
                    phase = 2;
                    startTime = performance.now();
                }
            } else {
                // フェーズ2: 吐き出し (2秒)
                const duration = 2.0;
                const progress = Math.min(elapsed / duration, 1);

                // ポータル縮小
                const portalProgress = 1 - progress;
                portalRadius = maxPortalRadius * portalProgress;
                portalRotation -= 0.2; // 逆回転！

                // キャンバスをクリア
                ctx.clearRect(0, 0, width, height);
                
                // 背景を明るくしていく
                const bgDarkness = 0.7 * (1 - progress);
                ctx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
                ctx.fillRect(0, 0, width, height);

                // ポータル描画（まだ見える間）
                if (portalRadius > 1) {
                    drawPortal(ctx, centerX, centerY, portalRadius, portalRotation, spiralArms, maxPortalRadius);
                }

                // 次のページパーティクルを吐き出す（逆回転）
                const ejectForce = Math.pow(progress, 0.5); // 最初速く、後でゆっくり
                
                nextParticles.forEach(p => {
                    const effectProgress = Math.max(0, (progress - (1 - p.delay) * 0.3) * 1.3);
                    
                    if (effectProgress > 0) {
                        const ejectStrength = Math.min(effectProgress * ejectForce * 1.5, 1);
                        
                        // 中心から外側へ逆回転しながら移動
                        const currentDist = p.dist * ejectStrength;
                        const spiralAngle = p.angle - (1 - ejectStrength) * 3; // 逆回転
                        
                        p.x = centerX + Math.cos(spiralAngle) * currentDist;
                        p.y = centerY + Math.sin(spiralAngle) * currentDist;
                        p.rotation = -(1 - ejectStrength) * 720 * Math.PI / 180; // 逆回転
                        p.scale = Math.min(1, ejectStrength * 1.2);
                        p.opacity = Math.min(1, ejectStrength * 1.5);
                    }
                    
                    if (p.opacity > 0 && p.scale > 0) {
                        ctx.save();
                        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
                        ctx.rotate(p.rotation);
                        ctx.scale(p.scale, p.scale);
                        ctx.globalAlpha = p.opacity;
                        ctx.drawImage(
                            nextImage,
                            p.origX, p.origY, p.size, p.size,
                            -p.size / 2, -p.size / 2, p.size, p.size
                        );
                        ctx.restore();
                    }
                });

                if (progress >= 1) {
                    isAnimating = false;
                    // 次のページを表示
                    gsap.set(next, { opacity: 1 });
                    
                    gsap.to(mainCanvas, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            blocksContainer.innerHTML = '';
                            finishAnimation(current);
                        }
                    });
                    return;
                }
            }

            requestAnimationFrame(animate);
        }
        
        // ポータル描画関数（縦亀裂風デザイン）
        function drawPortal(ctx, cx, cy, radius, rotation, arms, maxRadius) {
            if (radius < 1) return;
            
            ctx.save();
            ctx.translate(cx, cy);
            
            // 時間による揺らぎ
            const time = rotation * 2;
            const wobbleX = Math.sin(time * 1.7) * 5;
            const wobbleY = Math.cos(time * 1.3) * 3;
            
            // 縦亀裂の基本サイズ（縦長）
            const tearWidth = radius * 0.6;
            const tearHeight = radius * 2.5;
            
            // 外側の紫オーラ（複数レイヤー）
            for (let layer = 3; layer >= 0; layer--) {
                const layerScale = 1 + layer * 0.4;
                const layerAlpha = 0.2 - layer * 0.04;
                
                ctx.beginPath();
                // 縦長の不規則な裂け目形状
                const points = 20;
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const angle = t * Math.PI * 2;
                    // 縦長楕円 + ノイズ
                    const baseX = Math.cos(angle) * tearWidth * layerScale;
                    const baseY = Math.sin(angle) * tearHeight * layerScale;
                    const noise = Math.sin(angle * 6 + time * 2 + layer) * (8 + layer * 5)
                                + Math.cos(angle * 4 + time * 3) * 5;
                    const px = wobbleX * 0.3 + baseX + (Math.abs(Math.cos(angle)) > 0.7 ? noise * 0.2 : noise);
                    const py = wobbleY * 0.3 + baseY;
                    
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                
                // 外から内へ：紫から黒のグラデーション
                const grad = ctx.createRadialGradient(0, 0, tearHeight * 0.1 * layerScale, 0, 0, tearHeight * layerScale);
                if (layer === 0) {
                    // 最内層：深い黒
                    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    grad.addColorStop(0.5, 'rgba(10, 0, 20, 0.95)');
                    grad.addColorStop(1, 'rgba(40, 0, 60, 0.3)');
                } else {
                    // 外層：紫のオーラ
                    grad.addColorStop(0, `rgba(60, 0, 100, ${layerAlpha * 1.5})`);
                    grad.addColorStop(0.4, `rgba(120, 40, 180, ${layerAlpha})`);
                    grad.addColorStop(0.7, `rgba(160, 80, 220, ${layerAlpha * 0.6})`);
                    grad.addColorStop(1, 'rgba(180, 100, 255, 0)');
                }
                ctx.fillStyle = grad;
                ctx.fill();
            }
            
            // 亀裂のエッジ（ギザギザ）
            ctx.strokeStyle = 'rgba(180, 100, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = 'rgba(200, 150, 255, 0.8)';
            ctx.shadowBlur = 10;
            
            // 左右のエッジ
            for (let side = -1; side <= 1; side += 2) {
                ctx.beginPath();
                let y = -tearHeight * 0.9;
                let x = side * tearWidth * 0.3 + wobbleX * 0.2;
                ctx.moveTo(x, y);
                
                while (y < tearHeight * 0.9) {
                    const segLen = 8 + Math.random() * 15;
                    x += (Math.random() - 0.5) * 12 + side * Math.sin(y * 0.05 + time) * 3;
                    y += segLen;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            
            // 中心の深淵（縦長楕円）
            const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, tearHeight * 0.7);
            innerGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            innerGrad.addColorStop(0.3, 'rgba(5, 0, 15, 0.98)');
            innerGrad.addColorStop(0.6, 'rgba(30, 0, 50, 0.8)');
            innerGrad.addColorStop(1, 'rgba(80, 20, 120, 0)');
            
            ctx.beginPath();
            ctx.ellipse(wobbleX * 0.2, wobbleY * 0.2, tearWidth * 0.5, tearHeight * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = innerGrad;
            ctx.fill();
            
            // 亀裂から漏れる光（縦に走る）
            for (let i = 0; i < 6; i++) {
                const lightY = (i / 5 - 0.5) * tearHeight * 1.5;
                const lightX = Math.sin(time * 3 + i * 2) * tearWidth * 0.3;
                const lightWidth = 15 + Math.sin(time * 2 + i) * 10;
                const lightHeight = 30 + Math.random() * 40;
                
                const lightGrad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, lightHeight);
                lightGrad.addColorStop(0, `rgba(255, 220, 255, ${0.3 + Math.sin(time * 4 + i) * 0.2})`);
                lightGrad.addColorStop(0.3, 'rgba(200, 150, 255, 0.2)');
                lightGrad.addColorStop(1, 'rgba(150, 80, 200, 0)');
                
                ctx.fillStyle = lightGrad;
                ctx.beginPath();
                ctx.ellipse(lightX, lightY, lightWidth, lightHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 亀裂周辺の紫の稲妻
            for (let i = 0; i < 5; i++) {
                const boltY = (Math.random() - 0.5) * tearHeight * 1.5;
                const boltStartX = (Math.random() > 0.5 ? 1 : -1) * tearWidth * 0.4;
                
                ctx.strokeStyle = `rgba(180, 120, 255, ${0.4 + Math.random() * 0.4})`;
                ctx.shadowColor = 'rgba(200, 150, 255, 0.8)';
                ctx.shadowBlur = 5;
                ctx.lineWidth = 0.5 + Math.random() * 1;
                ctx.lineCap = 'round';
                ctx.beginPath();
                
                let bx = boltStartX, by = boltY;
                ctx.moveTo(bx, by);
                
                const boltDir = boltStartX > 0 ? 1 : -1;
                for (let j = 0; j < 4; j++) {
                    bx += boltDir * (10 + Math.random() * 20);
                    by += (Math.random() - 0.5) * 25;
                    ctx.lineTo(bx, by);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            
            // 亀裂の縁のキラキラ
            for (let i = 0; i < 15; i++) {
                const sparkT = (i / 14) * 2 - 1; // -1 to 1
                const sparkY = sparkT * tearHeight * 0.85;
                const edgeX = tearWidth * 0.4 * (1 + Math.sin(sparkT * 3 + time * 2) * 0.3);
                const sparkX = (Math.random() > 0.5 ? 1 : -1) * edgeX + (Math.random() - 0.5) * 10;
                const sparkSize = 1 + Math.random() * 2;
                const sparkAlpha = 0.4 + Math.sin(time * 5 + i * 1.7) * 0.4;
                
                ctx.fillStyle = `rgba(255, 230, 255, ${sparkAlpha})`;
                ctx.beginPath();
                ctx.arc(sparkX + wobbleX * 0.2, sparkY + wobbleY * 0.1, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        requestAnimationFrame(animate);
    },

    // パンチで画面が割れるエフェクト
    punch: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // 現在のページをキャプチャ
        const currentIframe = current.querySelector('iframe');
        let currentImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                currentImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
            currentImage = canvas;
        }

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.set(current, { opacity: 0 });

        // メインキャンバス
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
        blocksContainer.appendChild(mainCanvas);
        const ctx = mainCanvas.getContext('2d');

        blocksContainer.style.opacity = '1';

        // パンチの衝撃点（中央付近）
        const impactX = centerX + (Math.random() - 0.5) * width * 0.15;
        const impactY = centerY - height * 0.05 + (Math.random() - 0.5) * height * 0.15;

        // ヒビのラインを生成（放射状 + 同心円）
        const crackLines = [];
        const numRadial = 12 + Math.floor(Math.random() * 6);
        const radialAngles = [];
        
        // 放射状のヒビ
        for (let i = 0; i < numRadial; i++) {
            const baseAngle = (i / numRadial) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            radialAngles.push(baseAngle);
            
            const points = [{ x: impactX, y: impactY }];
            let x = impactX, y = impactY;
            let currentAngle = baseAngle;
            const maxDist = Math.max(width, height) * 0.9;
            let dist = 0;
            
            while (dist < maxDist && x > -50 && x < width + 50 && y > -50 && y < height + 50) {
                const segLen = 20 + Math.random() * 40;
                currentAngle = baseAngle + (Math.random() - 0.5) * 0.4;
                x += Math.cos(currentAngle) * segLen;
                y += Math.sin(currentAngle) * segLen;
                points.push({ x, y });
                dist += segLen;
            }
            crackLines.push({ points, type: 'radial', angle: baseAngle });
        }
        
        // 同心円状のヒビ
        const numRings = 4;
        for (let ring = 0; ring < numRings; ring++) {
            const ringRadius = 50 + ring * 70 + Math.random() * 30;
            const points = [];
            for (let a = 0; a < Math.PI * 2; a += 0.15) {
                const noise = (Math.random() - 0.5) * 15;
                points.push({
                    x: impactX + Math.cos(a) * (ringRadius + noise),
                    y: impactY + Math.sin(a) * (ringRadius + noise)
                });
            }
            points.push(points[0]); // 閉じる
            crackLines.push({ points, type: 'ring', radius: ringRadius });
        }

        // ヒビに沿った破片を生成（放射状 + 同心円で分割）
        const shards = [];
        
        // 中心の小さな破片
        const centerVertices = [];
        const centerRadius = 40 + Math.random() * 20;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const r = centerRadius * (0.8 + Math.random() * 0.4);
            centerVertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        shards.push({
            cx: impactX, cy: impactY,
            vertices: centerVertices,
            x: impactX, y: impactY,
            vx: 0, vy: -8,
            rotation: 0, angularVel: (Math.random() - 0.5) * 8,
            gravity: 600 + Math.random() * 200,
            opacity: 1, fallen: false, fallDelay: 0
        });

        // 放射状の分割による破片
        for (let ring = 0; ring < numRings; ring++) {
            const innerRadius = ring === 0 ? centerRadius : 50 + (ring - 1) * 70;
            const outerRadius = 50 + ring * 70 + 40;
            
            for (let i = 0; i < numRadial; i++) {
                const angle1 = radialAngles[i];
                const angle2 = radialAngles[(i + 1) % numRadial];
                
                // 4角形の破片を生成
                const vertices = [];
                const noise = () => (Math.random() - 0.5) * 12;
                
                // 内側の2点
                vertices.push({
                    x: Math.cos(angle1) * innerRadius + noise(),
                    y: Math.sin(angle1) * innerRadius + noise()
                });
                vertices.push({
                    x: Math.cos(angle2) * innerRadius + noise(),
                    y: Math.sin(angle2) * innerRadius + noise()
                });
                // 外側の2点
                vertices.push({
                    x: Math.cos(angle2) * outerRadius + noise(),
                    y: Math.sin(angle2) * outerRadius + noise()
                });
                vertices.push({
                    x: Math.cos(angle1) * outerRadius + noise(),
                    y: Math.sin(angle1) * outerRadius + noise()
                });
                
                // 重心を計算
                const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
                const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
                
                // 頂点を重心基準に変換
                const localVertices = vertices.map(v => ({ x: v.x - cx, y: v.y - cy }));
                
                // 衝撃点からの方向
                const avgAngle = (angle1 + angle2) / 2;
                const distFromImpact = (innerRadius + outerRadius) / 2;
                
                shards.push({
                    cx: impactX + cx,
                    cy: impactY + cy,
                    vertices: localVertices,
                    x: impactX + cx,
                    y: impactY + cy,
                    vx: Math.cos(avgAngle) * (3 + Math.random() * 5),
                    vy: Math.sin(avgAngle) * (3 + Math.random() * 5) - 3,
                    rotation: 0,
                    angularVel: (Math.random() - 0.5) * 6,
                    gravity: 500 + Math.random() * 300,
                    opacity: 1,
                    fallen: false,
                    fallDelay: distFromImpact / 400 + Math.random() * 0.1
                });
            }
        }
        
        // 外側の大きな破片（画面端まで）
        for (let i = 0; i < numRadial; i++) {
            const angle1 = radialAngles[i];
            const angle2 = radialAngles[(i + 1) % numRadial];
            const innerRadius = 50 + (numRings - 1) * 70 + 40;
            const outerRadius = Math.max(width, height);
            
            const vertices = [];
            vertices.push({
                x: Math.cos(angle1) * innerRadius,
                y: Math.sin(angle1) * innerRadius
            });
            vertices.push({
                x: Math.cos(angle2) * innerRadius,
                y: Math.sin(angle2) * innerRadius
            });
            // 外側は画面端に向かう
            const ext = outerRadius * 1.2;
            vertices.push({
                x: Math.cos(angle2) * ext,
                y: Math.sin(angle2) * ext
            });
            vertices.push({
                x: Math.cos(angle1) * ext,
                y: Math.sin(angle1) * ext
            });
            
            const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
            const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
            const localVertices = vertices.map(v => ({ x: v.x - cx, y: v.y - cy }));
            
            const avgAngle = (angle1 + angle2) / 2;
            
            shards.push({
                cx: impactX + cx,
                cy: impactY + cy,
                vertices: localVertices,
                x: impactX + cx,
                y: impactY + cy,
                vx: Math.cos(avgAngle) * (2 + Math.random() * 3),
                vy: Math.sin(avgAngle) * (2 + Math.random() * 3) - 2,
                rotation: 0,
                angularVel: (Math.random() - 0.5) * 3,
                gravity: 400 + Math.random() * 200,
                opacity: 1,
                fallen: false,
                fallDelay: 0.3 + Math.random() * 0.2
            });
        }
        
        // 手の画像を読み込む
        const fistImage = new Image();
        fistImage.src = 'js/effects/hand.png';
        
        // 画像読み込み完了を待つ
        await new Promise((resolve) => {
            if (fistImage.complete) {
                resolve();
            } else {
                fistImage.onload = resolve;
                fistImage.onerror = resolve; // エラーでも続行
            }
        });

        let startTime = performance.now();
        let isAnimating = true;
        let phase = 0; // 0: 奥から拳が近づく, 1: 衝撃+ヒビ, 2: 破片落下
        
        // 手（拳）を描画する関数（画像版）
        function drawFist(ctx, x, y, scale, alpha = 1) {
            if (!fistImage.complete || fistImage.naturalWidth === 0) return;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // 画像のサイズ
            const imgWidth = fistImage.naturalWidth * scale;
            const imgHeight = fistImage.naturalHeight * scale;
            
            // 中心を基準に描画
            ctx.drawImage(
                fistImage,
                x - imgWidth / 2,
                y - imgHeight / 2,
                imgWidth,
                imgHeight
            );
            
            ctx.restore();
        }
        
        // ヒビを描画する関数
        function drawCracks(ctx, progress) {
            crackLines.forEach((line, li) => {
                if (!line.points || line.points.length < 2) return;
                
                const delay = line.type === 'ring' ? 0.2 + li * 0.05 : li * 0.02;
                const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
                
                if (adjustedProgress > 0) {
                    const numPoints = Math.min(line.points.length, Math.floor(line.points.length * adjustedProgress));
                    if (numPoints < 2) return;
                    
                    // 影
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    if (line.points[0]) ctx.moveTo(line.points[0].x + 1, line.points[0].y + 1);
                    for (let i = 1; i < numPoints; i++) {
                        if (line.points[i]) ctx.lineTo(line.points[i].x + 1, line.points[i].y + 1);
                    }
                    ctx.stroke();
                    ctx.restore();
                    
                    // メインライン
                    ctx.save();
                    ctx.strokeStyle = 'rgba(30, 30, 30, 0.9)';
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    if (line.points[0]) ctx.moveTo(line.points[0].x, line.points[0].y);
                    for (let i = 1; i < numPoints; i++) {
                        if (line.points[i]) ctx.lineTo(line.points[i].x, line.points[i].y);
                    }
                    ctx.stroke();
                    ctx.restore();
                    
                    // ハイライト
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 0.5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    if (line.points[0]) ctx.moveTo(line.points[0].x - 0.5, line.points[0].y - 0.5);
                    for (let i = 1; i < numPoints; i++) {
                        if (line.points[i]) ctx.lineTo(line.points[i].x - 0.5, line.points[i].y - 0.5);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }

        // 血の滲みデータを事前生成
        const bloodSplats = [];
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 60;
            bloodSplats.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                size: 8 + Math.random() * 25,
                delay: Math.random() * 0.3,
                shape: Math.random() // 形状のバリエーション
            });
        }

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000;
            
            ctx.clearRect(0, 0, width, height);

            if (phase === 0) {
                // フェーズ0: 奥から拳が近づいてくる (0.3秒)
                const duration = 0.3;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                
                // イージング：最初ゆっくり、最後に加速（パンチ感）
                const easeProgress = Math.pow(progress, 2.5);
                
                // スケール：小さい（奥）→大きい（手前）
                const startScale = 0.05;
                const endScale = 0.7;
                const currentScale = startScale + (endScale - startScale) * easeProgress;
                
                // 位置：中央付近から衝撃点へ
                const startX = centerX;
                const startY = centerY - 50;
                const fistX = startX + (impactX - startX) * easeProgress * 0.3;
                const fistY = startY + (impactY - startY) * easeProgress * 0.5;
                
                // モーションブラー（奥から手前へのブラー）
                if (progress > 0.3) {
                    const blurAmount = Math.min(1, (progress - 0.3) / 0.7);
                    for (let i = 3; i >= 1; i--) {
                        const blurScale = currentScale * (1 - i * 0.08 * blurAmount);
                        const blurAlpha = 0.15 * (1 - i / 4);
                        drawFist(ctx, fistX, fistY, blurScale, blurAlpha);
                    }
                }
                
                // メインの拳
                drawFist(ctx, fistX, fistY, currentScale, 1);
                
                if (progress >= 1) {
                    phase = 1;
                    startTime = performance.now();
                }
            } else if (phase === 1) {
                // フェーズ1: 接触して止まる + 血がにじむ (0.5秒)
                const duration = 0.5;
                const progress = Math.min(elapsed / duration, 1);
                
                // 軽い揺れ（最初だけ）
                const shakeAmount = 15 * Math.max(0, 1 - progress * 4);
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                ctx.save();
                ctx.translate(shakeX, shakeY);
                ctx.drawImage(currentImage, 0, 0);
                ctx.restore();
                
                // 最初に白いフラッシュ
                if (progress < 0.1) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.1) * 0.7})`;
                    ctx.fillRect(0, 0, width, height);
                }
                
                // 衝撃波（最初だけ）
                if (progress < 0.3) {
                    const waveProgress = progress / 0.3;
                    const waveRadius = waveProgress * 200;
                    ctx.save();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - waveProgress) * 0.5})`;
                    ctx.lineWidth = 8 * (1 - waveProgress);
                    ctx.beginPath();
                    ctx.arc(impactX, impactY, waveRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // 拳は止まったまま（微かに振動）- ヒビより奥に描画
                const fistVibrate = Math.sin(elapsed * 50) * 2 * (1 - progress);
                drawFist(ctx, impactX + shakeX + fistVibrate, impactY - 30 + shakeY, 0.7, 1);
                
                // ヒビが広がる（このフェーズ中にゆっくり）- 拳より手前
                drawCracks(ctx, Math.pow(progress, 0.7));
                
                // 血の滲み効果（ヒビの後から出てくる）
                const bloodStartProgress = 0.3; // 血は30%進んでから
                bloodSplats.forEach((splat, i) => {
                    const adjustedProgress = Math.max(0, (progress - bloodStartProgress) / (1 - bloodStartProgress));
                    const splatProgress = Math.max(0, (adjustedProgress - splat.delay) / (1 - splat.delay));
                    if (splatProgress > 0) {
                        const size = splat.size * Math.min(1, splatProgress * 1.5);
                        const alpha = 0.6 * Math.min(1, splatProgress * 2);
                        
                        ctx.save();
                        ctx.translate(impactX + splat.x + shakeX, impactY + splat.y + shakeY);
                        
                        // 不規則な血の形
                        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                        grad.addColorStop(0, `rgba(139, 0, 0, ${alpha})`);
                        grad.addColorStop(0.3, `rgba(180, 20, 20, ${alpha * 0.8})`);
                        grad.addColorStop(0.6, `rgba(120, 0, 0, ${alpha * 0.5})`);
                        grad.addColorStop(1, 'rgba(80, 0, 0, 0)');
                        
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        
                        // 不規則な形を描く
                        const points = 8;
                        for (let p = 0; p <= points; p++) {
                            const angle = (p / points) * Math.PI * 2;
                            const distortion = 0.6 + Math.sin(angle * 3 + splat.shape * 10) * 0.4;
                            const r = size * distortion;
                            const px = Math.cos(angle) * r;
                            const py = Math.sin(angle) * r;
                            if (p === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        ctx.fill();
                        
                        // 血の滴り（下に伸びる）
                        if (splatProgress > 0.3 && splat.shape > 0.5) {
                            const dripLength = (splatProgress - 0.3) / 0.7 * 30 * splat.shape;
                            const dripGrad = ctx.createLinearGradient(0, size * 0.5, 0, size * 0.5 + dripLength);
                            dripGrad.addColorStop(0, `rgba(139, 0, 0, ${alpha * 0.8})`);
                            dripGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');
                            ctx.fillStyle = dripGrad;
                            ctx.beginPath();
                            ctx.moveTo(-3, size * 0.3);
                            ctx.quadraticCurveTo(-2, size * 0.5 + dripLength * 0.5, 0, size * 0.5 + dripLength);
                            ctx.quadraticCurveTo(2, size * 0.5 + dripLength * 0.5, 3, size * 0.3);
                            ctx.closePath();
                            ctx.fill();
                        }
                        
                        ctx.restore();
                    }
                });
                
                // 中心の大きな血の滲み（遅れて出てくる）
                const centerBloodProgress = Math.max(0, (progress - 0.2) / 0.8) * 1.5;
                const centerBloodSize = 40 * centerBloodProgress;
                const grad = ctx.createRadialGradient(
                    impactX + shakeX, impactY + shakeY, 0,
                    impactX + shakeX, impactY + shakeY, centerBloodSize
                );
                grad.addColorStop(0, `rgba(120, 0, 0, ${0.7 * centerBloodProgress})`);
                grad.addColorStop(0.5, `rgba(150, 10, 10, ${0.5 * centerBloodProgress})`);
                grad.addColorStop(1, 'rgba(100, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(impactX + shakeX, impactY + shakeY, centerBloodSize, 0, Math.PI * 2);
                ctx.fill();
                
                if (progress >= 1) {
                    phase = 2;
                    startTime = performance.now();
                }
            } else if (phase === 2) {
                // フェーズ2: 拳が消える (0.3秒) - ヒビは既に完成
                const duration = 0.3;
                const progress = Math.min(elapsed / duration, 1);
                
                const shakeAmount = 5 * Math.max(0, 1 - progress * 2);
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                ctx.save();
                ctx.translate(shakeX, shakeY);
                ctx.drawImage(currentImage, 0, 0);
                ctx.restore();
                
                // 拳が縮小して消える（ヒビより奥に描画）
                const fistScale = 0.7 * (1 - progress * 0.9);
                const fistAlpha = Math.max(0, 1 - progress * 1.5);
                if (fistAlpha > 0) {
                    drawFist(ctx, impactX + shakeX, impactY - 30 + shakeY, fistScale, fistAlpha);
                }
                
                // ヒビを描画（完成状態を維持）- 拳より手前
                drawCracks(ctx, 1);
                
                // 血の滲みを維持（フェードアウト）
                bloodSplats.forEach((splat, i) => {
                    const size = splat.size;
                    const alpha = 0.6 * (1 - progress * 0.5);
                    
                    ctx.save();
                    ctx.translate(impactX + splat.x + shakeX, impactY + splat.y + shakeY);
                    
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                    grad.addColorStop(0, `rgba(139, 0, 0, ${alpha})`);
                    grad.addColorStop(0.5, `rgba(150, 20, 20, ${alpha * 0.6})`);
                    grad.addColorStop(1, 'rgba(80, 0, 0, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
                
                // 中心の血（フェードアウト）
                const centerBloodSize = 40;
                const bloodAlpha = 0.7 * (1 - progress * 0.5);
                const bgrad = ctx.createRadialGradient(
                    impactX + shakeX, impactY + shakeY, 0,
                    impactX + shakeX, impactY + shakeY, centerBloodSize
                );
                bgrad.addColorStop(0, `rgba(120, 0, 0, ${bloodAlpha})`);
                bgrad.addColorStop(0.5, `rgba(150, 10, 10, ${bloodAlpha * 0.7})`);
                bgrad.addColorStop(1, 'rgba(100, 0, 0, 0)');
                ctx.fillStyle = bgrad;
                ctx.beginPath();
                ctx.arc(impactX + shakeX, impactY + shakeY, centerBloodSize, 0, Math.PI * 2);
                ctx.fill();
                
                if (progress >= 1) {
                    phase = 3;
                    startTime = performance.now();
                }
            } else if (phase === 3) {
                // フェーズ3: 破片落下 (2秒)
                const duration = 2.0;
                const progress = Math.min(elapsed / duration, 1);
                const dt = 1/60;
                
                // 遷移先を背景に表示
                gsap.set(next, { opacity: Math.min(1, progress * 2) });
                
                // 背景（遷移先が見えるように薄く）
                ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * (1 - progress)})`;
                ctx.fillRect(0, 0, width, height);
                
                // 破片を物理更新・描画
                let allFallen = true;
                shards.forEach((shard, si) => {
                    if (elapsed < shard.fallDelay) {
                        // まだ落ちていない破片は元の位置に表示
                        allFallen = false;
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(shard.cx + shard.vertices[0].x, shard.cy + shard.vertices[0].y);
                        for (let v = 1; v < shard.vertices.length; v++) {
                            ctx.lineTo(shard.cx + shard.vertices[v].x, shard.cy + shard.vertices[v].y);
                        }
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(currentImage, 0, 0);
                        ctx.restore();
                        
                        // エッジを描画
                        ctx.save();
                        ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(shard.cx + shard.vertices[0].x, shard.cy + shard.vertices[0].y);
                        for (let v = 1; v < shard.vertices.length; v++) {
                            ctx.lineTo(shard.cx + shard.vertices[v].x, shard.cy + shard.vertices[v].y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        ctx.restore();
                        return;
                    }
                    
                    shard.fallen = true;
                    
                    // 物理演算
                    shard.vy += shard.gravity * dt;
                    shard.x += shard.vx;
                    shard.y += shard.vy * dt * 60;
                    shard.rotation += shard.angularVel * dt;
                    
                    // フェードアウト
                    if (shard.y > height + 100) {
                        shard.opacity = Math.max(0, shard.opacity - 0.05);
                    }
                    
                    if (shard.opacity > 0) {
                        allFallen = false;
                        
                        ctx.save();
                        ctx.translate(shard.x, shard.y);
                        ctx.rotate(shard.rotation);
                        ctx.globalAlpha = shard.opacity;
                        
                        // 破片の形状でクリップ
                        ctx.beginPath();
                        ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
                        for (let v = 1; v < shard.vertices.length; v++) {
                            ctx.lineTo(shard.vertices[v].x, shard.vertices[v].y);
                        }
                        ctx.closePath();
                        ctx.clip();
                        
                        // 元ページのテクスチャ
                        ctx.translate(-shard.cx, -shard.cy);
                        ctx.drawImage(currentImage, 0, 0);
                        ctx.restore();
                        
                        // エッジハイライト
                        ctx.save();
                        ctx.translate(shard.x, shard.y);
                        ctx.rotate(shard.rotation);
                        ctx.globalAlpha = shard.opacity * 0.6;
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
                        for (let v = 1; v < shard.vertices.length; v++) {
                            ctx.lineTo(shard.vertices[v].x, shard.vertices[v].y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                
                if (progress >= 1 || allFallen) {
                    isAnimating = false;
                    gsap.set(next, { opacity: 1 });
                    blocksContainer.innerHTML = '';
                    gsap.set(current, { opacity: 1 });
                    finishAnimation(current);
                    return;
                }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    },

    // 3連パンチで画面が割れるエフェクト（ドン、ドンドン！ばりーん！）
    punchCombo: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // 現在のページをキャプチャ
        const currentIframe = current.querySelector('iframe');
        let currentImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                currentImage = canvas;
            }
        } catch (e) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
            currentImage = canvas;
        }

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.set(current, { opacity: 0 });

        // メインキャンバス
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = width;
        mainCanvas.height = height;
        mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
        blocksContainer.appendChild(mainCanvas);
        const ctx = mainCanvas.getContext('2d');

        blocksContainer.style.opacity = '1';

        // 3回のパンチの衝撃点（少しずつずらす）
        const impactPoints = [
            { x: centerX - width * 0.15, y: centerY - height * 0.1 },
            { x: centerX + width * 0.1, y: centerY + height * 0.05 },
            { x: centerX, y: centerY }
        ];

        // 各パンチ後のヒビを蓄積
        let allCrackLines = [];
        let currentPunchIndex = 0;
        
        // ヒビのラインを生成する関数（パンチごとに異なる強度）
        function generateCracks(impactX, impactY, intensity) {
            const crackLines = [];
            const numRadial = Math.floor(4 + intensity * 8) + Math.floor(Math.random() * 3);
            const maxDist = Math.max(width, height) * (0.3 + intensity * 0.4);
            
            // 放射状のヒビ
            for (let i = 0; i < numRadial; i++) {
                const baseAngle = (i / numRadial) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const points = [{ x: impactX, y: impactY }];
                let x = impactX, y = impactY;
                let currentAngle = baseAngle;
                let dist = 0;
                
                while (dist < maxDist && x > -50 && x < width + 50 && y > -50 && y < height + 50) {
                    const segLen = 15 + Math.random() * 30;
                    currentAngle = baseAngle + (Math.random() - 0.5) * 0.5;
                    x += Math.cos(currentAngle) * segLen;
                    y += Math.sin(currentAngle) * segLen;
                    points.push({ x, y });
                    dist += segLen;
                }
                crackLines.push({ points, type: 'radial', angle: baseAngle });
            }
            
            // 同心円状のヒビ（強度に応じて）
            const numRings = Math.floor(1 + intensity * 3);
            for (let ring = 0; ring < numRings; ring++) {
                const ringRadius = 30 + ring * 50 + Math.random() * 20;
                if (ringRadius > maxDist) continue;
                const points = [];
                for (let a = 0; a < Math.PI * 2; a += 0.2) {
                    const noise = (Math.random() - 0.5) * 10;
                    points.push({
                        x: impactX + Math.cos(a) * (ringRadius + noise),
                        y: impactY + Math.sin(a) * (ringRadius + noise)
                    });
                }
                points.push(points[0]);
                crackLines.push({ points, type: 'ring', radius: ringRadius });
            }
            
            return crackLines;
        }
        
        // 破片を生成する関数（最終パンチ用）
        function generateShards() {
            const shards = [];
            const impactX = impactPoints[2].x;
            const impactY = impactPoints[2].y;
            const numRadial = 12 + Math.floor(Math.random() * 6);
            const radialAngles = [];
            const numRings = 4;
            
            for (let i = 0; i < numRadial; i++) {
                radialAngles.push((i / numRadial) * Math.PI * 2 + (Math.random() - 0.5) * 0.3);
            }
            
            // 中心の破片
            const centerVertices = [];
            const centerRadius = 40 + Math.random() * 20;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const r = centerRadius * (0.8 + Math.random() * 0.4);
                centerVertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
            shards.push({
                cx: impactX, cy: impactY,
                vertices: centerVertices,
                x: impactX, y: impactY,
                vx: 0, vy: -10,
                rotation: 0, angularVel: (Math.random() - 0.5) * 10,
                gravity: 700 + Math.random() * 200,
                opacity: 1, fallen: false, fallDelay: 0
            });

            // 放射状の破片
            for (let ring = 0; ring < numRings; ring++) {
                const innerRadius = ring === 0 ? centerRadius : 50 + (ring - 1) * 70;
                const outerRadius = 50 + ring * 70 + 40;
                
                for (let i = 0; i < numRadial; i++) {
                    const angle1 = radialAngles[i];
                    const angle2 = radialAngles[(i + 1) % numRadial];
                    
                    const vertices = [];
                    const noise = () => (Math.random() - 0.5) * 12;
                    
                    vertices.push({ x: Math.cos(angle1) * innerRadius + noise(), y: Math.sin(angle1) * innerRadius + noise() });
                    vertices.push({ x: Math.cos(angle2) * innerRadius + noise(), y: Math.sin(angle2) * innerRadius + noise() });
                    vertices.push({ x: Math.cos(angle2) * outerRadius + noise(), y: Math.sin(angle2) * outerRadius + noise() });
                    vertices.push({ x: Math.cos(angle1) * outerRadius + noise(), y: Math.sin(angle1) * outerRadius + noise() });
                    
                    const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
                    const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
                    const localVertices = vertices.map(v => ({ x: v.x - cx, y: v.y - cy }));
                    const avgAngle = (angle1 + angle2) / 2;
                    const distFromImpact = (innerRadius + outerRadius) / 2;
                    
                    shards.push({
                        cx: impactX + cx, cy: impactY + cy,
                        vertices: localVertices,
                        x: impactX + cx, y: impactY + cy,
                        vx: Math.cos(avgAngle) * (4 + Math.random() * 6),
                        vy: Math.sin(avgAngle) * (4 + Math.random() * 6) - 4,
                        rotation: 0, angularVel: (Math.random() - 0.5) * 8,
                        gravity: 600 + Math.random() * 300,
                        opacity: 1, fallen: false,
                        fallDelay: distFromImpact / 500 + Math.random() * 0.1
                    });
                }
            }
            
            // 外側の大きな破片
            for (let i = 0; i < numRadial; i++) {
                const angle1 = radialAngles[i];
                const angle2 = radialAngles[(i + 1) % numRadial];
                const innerRadius = 50 + (numRings - 1) * 70 + 40;
                const outerRadius = Math.max(width, height) * 1.2;
                
                const vertices = [
                    { x: Math.cos(angle1) * innerRadius, y: Math.sin(angle1) * innerRadius },
                    { x: Math.cos(angle2) * innerRadius, y: Math.sin(angle2) * innerRadius },
                    { x: Math.cos(angle2) * outerRadius, y: Math.sin(angle2) * outerRadius },
                    { x: Math.cos(angle1) * outerRadius, y: Math.sin(angle1) * outerRadius }
                ];
                
                const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
                const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;
                const localVertices = vertices.map(v => ({ x: v.x - cx, y: v.y - cy }));
                const avgAngle = (angle1 + angle2) / 2;
                
                shards.push({
                    cx: impactX + cx, cy: impactY + cy,
                    vertices: localVertices,
                    x: impactX + cx, y: impactY + cy,
                    vx: Math.cos(avgAngle) * (2 + Math.random() * 4),
                    vy: Math.sin(avgAngle) * (2 + Math.random() * 4) - 2,
                    rotation: 0, angularVel: (Math.random() - 0.5) * 3,
                    gravity: 400 + Math.random() * 200,
                    opacity: 1, fallen: false, fallDelay: 0.3 + Math.random() * 0.2
                });
            }
            
            return shards;
        }
        
        // 手の画像を読み込む
        const fistImage = new Image();
        fistImage.src = 'js/effects/hand.png';
        
        await new Promise((resolve) => {
            if (fistImage.complete) resolve();
            else {
                fistImage.onload = resolve;
                fistImage.onerror = resolve;
            }
        });

        let startTime = performance.now();
        let isAnimating = true;
        let phase = 0;
        // フェーズ: 0-2: パンチ1,2,3のアプローチ, 3-5: パンチ1,2,3のインパクト, 6: 破片落下
        let shards = [];
        
        // 拳描画関数
        function drawFist(ctx, x, y, scale, alpha = 1) {
            if (!fistImage.complete || fistImage.naturalWidth === 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            const imgWidth = fistImage.naturalWidth * scale;
            const imgHeight = fistImage.naturalHeight * scale;
            ctx.drawImage(fistImage, x - imgWidth / 2, y - imgHeight / 2, imgWidth, imgHeight);
            ctx.restore();
        }
        
        // ヒビ描画関数
        function drawAllCracks(ctx, progressOverride = null) {
            allCrackLines.forEach((crackGroup) => {
                crackGroup.lines.forEach((line) => {
                    if (!line.points || line.points.length < 2) return;
                    
                    const progress = progressOverride !== null ? progressOverride : crackGroup.progress;
                    const delay = line.type === 'ring' ? 0.2 : 0;
                    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
                    
                    if (adjustedProgress > 0) {
                        const numPoints = Math.min(line.points.length, Math.floor(line.points.length * adjustedProgress));
                        if (numPoints < 2) return;
                        
                        // 影
                        ctx.save();
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.lineWidth = 2.5;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        if (line.points[0]) ctx.moveTo(line.points[0].x + 1, line.points[0].y + 1);
                        for (let i = 1; i < numPoints; i++) {
                            if (line.points[i]) ctx.lineTo(line.points[i].x + 1, line.points[i].y + 1);
                        }
                        ctx.stroke();
                        ctx.restore();
                        
                        // メインライン
                        ctx.save();
                        ctx.strokeStyle = 'rgba(30, 30, 30, 0.9)';
                        ctx.lineWidth = 1.5;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        if (line.points[0]) ctx.moveTo(line.points[0].x, line.points[0].y);
                        for (let i = 1; i < numPoints; i++) {
                            if (line.points[i]) ctx.lineTo(line.points[i].x, line.points[i].y);
                        }
                        ctx.stroke();
                        ctx.restore();
                        
                        // ハイライト
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        if (line.points[0]) ctx.moveTo(line.points[0].x - 0.5, line.points[0].y - 0.5);
                        for (let i = 1; i < numPoints; i++) {
                            if (line.points[i]) ctx.lineTo(line.points[i].x - 0.5, line.points[i].y - 0.5);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            });
        }

        function animate(currentTime) {
            if (!isAnimating) return;

            const elapsed = (currentTime - startTime) / 1000;
            ctx.clearRect(0, 0, width, height);
            
            // パンチ1: アプローチ（ドン）
            if (phase === 0) {
                const duration = 0.25;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                drawAllCracks(ctx);
                
                const easeProgress = Math.pow(progress, 2.5);
                const startScale = 0.05;
                const endScale = 0.6;
                const currentScale = startScale + (endScale - startScale) * easeProgress;
                
                const impact = impactPoints[0];
                const fistX = centerX + (impact.x - centerX) * easeProgress * 0.3;
                const fistY = centerY - 50 + (impact.y - centerY + 50) * easeProgress * 0.5;
                
                drawFist(ctx, fistX, fistY, currentScale, 1);
                
                if (progress >= 1) {
                    phase = 1;
                    startTime = performance.now();
                    // ヒビを生成（弱め）
                    const newCracks = generateCracks(impact.x, impact.y, 0.3);
                    allCrackLines.push({ lines: newCracks, progress: 0 });
                }
            }
            // パンチ1: インパクト
            else if (phase === 1) {
                const duration = 0.3;
                const progress = Math.min(elapsed / duration, 1);
                
                const shakeAmount = 10 * Math.max(0, 1 - progress * 3);
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                ctx.save();
                ctx.translate(shakeX, shakeY);
                ctx.drawImage(currentImage, 0, 0);
                ctx.restore();
                
                // 白いフラッシュ
                if (progress < 0.15) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.15) * 0.5})`;
                    ctx.fillRect(0, 0, width, height);
                }
                
                const impact = impactPoints[0];
                
                // 拳（ヒビより奥）
                const fistScale = 0.6 * (1 - progress * 0.5);
                const fistAlpha = Math.max(0, 1 - progress * 2);
                if (fistAlpha > 0) {
                    drawFist(ctx, impact.x + shakeX, impact.y - 30 + shakeY, fistScale, fistAlpha);
                }
                
                // ヒビ描画
                if (allCrackLines.length > 0) {
                    allCrackLines[allCrackLines.length - 1].progress = progress;
                }
                drawAllCracks(ctx);
                
                if (progress >= 1) {
                    phase = 2;
                    startTime = performance.now();
                }
            }
            // 待機（ドン...の余韻）
            else if (phase === 2) {
                const duration = 0.2;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                drawAllCracks(ctx);
                
                if (progress >= 1) {
                    phase = 3;
                    startTime = performance.now();
                }
            }
            // パンチ2: アプローチ（ドン）
            else if (phase === 3) {
                const duration = 0.2;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                drawAllCracks(ctx);
                
                const easeProgress = Math.pow(progress, 2.5);
                const currentScale = 0.05 + 0.55 * easeProgress;
                
                const impact = impactPoints[1];
                const fistX = centerX + (impact.x - centerX) * easeProgress * 0.3;
                const fistY = centerY - 50 + (impact.y - centerY + 50) * easeProgress * 0.5;
                
                drawFist(ctx, fistX, fistY, currentScale, 1);
                
                if (progress >= 1) {
                    phase = 4;
                    startTime = performance.now();
                    const newCracks = generateCracks(impact.x, impact.y, 0.5);
                    allCrackLines.push({ lines: newCracks, progress: 0 });
                }
            }
            // パンチ2: インパクト
            else if (phase === 4) {
                const duration = 0.25;
                const progress = Math.min(elapsed / duration, 1);
                
                const shakeAmount = 15 * Math.max(0, 1 - progress * 3);
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                ctx.save();
                ctx.translate(shakeX, shakeY);
                ctx.drawImage(currentImage, 0, 0);
                ctx.restore();
                
                if (progress < 0.15) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.15) * 0.6})`;
                    ctx.fillRect(0, 0, width, height);
                }
                
                const impact = impactPoints[1];
                const fistScale = 0.6 * (1 - progress * 0.5);
                const fistAlpha = Math.max(0, 1 - progress * 2);
                if (fistAlpha > 0) {
                    drawFist(ctx, impact.x + shakeX, impact.y - 30 + shakeY, fistScale, fistAlpha);
                }
                
                if (allCrackLines.length > 0) {
                    allCrackLines[allCrackLines.length - 1].progress = progress;
                }
                drawAllCracks(ctx);
                
                if (progress >= 1) {
                    phase = 5;
                    startTime = performance.now();
                }
            }
            // 短い待機（ドンドン...!の溜め）
            else if (phase === 5) {
                const duration = 0.1;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                drawAllCracks(ctx);
                
                if (progress >= 1) {
                    phase = 6;
                    startTime = performance.now();
                }
            }
            // パンチ3: アプローチ（ばりーん！への溜め）
            else if (phase === 6) {
                const duration = 0.15;
                const progress = Math.min(elapsed / duration, 1);
                
                ctx.drawImage(currentImage, 0, 0);
                drawAllCracks(ctx);
                
                const easeProgress = Math.pow(progress, 3);
                const currentScale = 0.05 + 0.75 * easeProgress;
                
                const impact = impactPoints[2];
                const fistX = centerX + (impact.x - centerX) * easeProgress * 0.3;
                const fistY = centerY - 50 + (impact.y - centerY + 50) * easeProgress * 0.5;
                
                drawFist(ctx, fistX, fistY, currentScale, 1);
                
                if (progress >= 1) {
                    phase = 7;
                    startTime = performance.now();
                    const newCracks = generateCracks(impact.x, impact.y, 1.0);
                    allCrackLines.push({ lines: newCracks, progress: 0 });
                    shards = generateShards();
                }
            }
            // パンチ3: インパクト（ばりーん！）
            else if (phase === 7) {
                const duration = 0.4;
                const progress = Math.min(elapsed / duration, 1);
                
                const shakeAmount = 25 * Math.max(0, 1 - progress * 2);
                const shakeX = (Math.random() - 0.5) * shakeAmount;
                const shakeY = (Math.random() - 0.5) * shakeAmount;
                
                ctx.save();
                ctx.translate(shakeX, shakeY);
                ctx.drawImage(currentImage, 0, 0);
                ctx.restore();
                
                // 強いフラッシュ
                if (progress < 0.2) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.2) * 0.8})`;
                    ctx.fillRect(0, 0, width, height);
                }
                
                const impact = impactPoints[2];
                const fistScale = 0.8 * (1 - progress * 0.8);
                const fistAlpha = Math.max(0, 1 - progress * 1.5);
                if (fistAlpha > 0) {
                    drawFist(ctx, impact.x + shakeX, impact.y - 30 + shakeY, fistScale, fistAlpha);
                }
                
                if (allCrackLines.length > 0) {
                    allCrackLines[allCrackLines.length - 1].progress = progress;
                }
                drawAllCracks(ctx);
                
                if (progress >= 1) {
                    phase = 8;
                    startTime = performance.now();
                }
            }
            // 破片落下（ばりーん！の後）
            else if (phase === 8) {
                const duration = 2.0;
                const progress = Math.min(elapsed / duration, 1);
                const dt = 1/60;
                
                gsap.set(next, { opacity: Math.min(1, progress * 2) });
                
                let allFallen = true;
                shards.forEach(shard => {
                    if (elapsed < shard.fallDelay) {
                        allFallen = false;
                        return;
                    }
                    
                    const fallElapsed = elapsed - shard.fallDelay;
                    
                    if (!shard.fallen) {
                        shard.vy += shard.gravity * dt;
                        shard.x += shard.vx;
                        shard.y += shard.vy * dt * 60;
                        shard.rotation += shard.angularVel * dt;
                        
                        if (shard.y > height + 200) {
                            shard.fallen = true;
                        }
                    }
                    
                    if (!shard.fallen) allFallen = false;
                });
                
                // 破片描画
                shards.forEach(shard => {
                    if (shard.fallen) return;
                    
                    ctx.save();
                    ctx.translate(shard.x, shard.y);
                    ctx.rotate(shard.rotation);
                    
                    ctx.beginPath();
                    ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
                    for (let v = 1; v < shard.vertices.length; v++) {
                        ctx.lineTo(shard.vertices[v].x, shard.vertices[v].y);
                    }
                    ctx.closePath();
                    ctx.clip();
                    
                    ctx.translate(-shard.cx, -shard.cy);
                    ctx.drawImage(currentImage, 0, 0);
                    ctx.restore();
                    
                    // ガラスの輝き
                    ctx.save();
                    ctx.translate(shard.x, shard.y);
                    ctx.rotate(shard.rotation);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
                    for (let v = 1; v < shard.vertices.length; v++) {
                        ctx.lineTo(shard.vertices[v].x, shard.vertices[v].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                });
                
                if (progress >= 1 || allFallen) {
                    isAnimating = false;
                    gsap.set(next, { opacity: 1 });
                    blocksContainer.innerHTML = '';
                    gsap.set(current, { opacity: 1 });
                    finishAnimation(current);
                    return;
                }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }
};

// エフェクト定義
const specialEffectDefinitions = {
    'glitch': { name: 'グリッチ', category: 'special' },
    'matrix': { name: 'マトリックス', category: 'special' },
    'shatter': { name: 'シャッター', category: 'special' },
    'morph': { name: 'モーフ', category: 'special' },
    'newspaper': { name: '新聞紙', category: 'special' },
    'elementSwap': { name: '🔄 エレメントスワップ', category: 'special' },
    'sandfall': { name: '🏜️ 砂崩れ', category: 'special' },
    'underwater': { name: '🐠 深海潜水', category: 'special' },
    'burn': { name: '🔥 燃焼', category: 'special' },
    'blackhole': { name: '🌀 異世界ゲート', category: 'special' },
    'punch': { name: '👊 パンチ破壊', category: 'special' },
    'punchCombo': { name: '👊👊👊 3連パンチ', category: 'special' }
};
