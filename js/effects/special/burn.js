/**
 * 燃焼エフェクト
 * 下から燃え上がる炎・煙・火花を表現
 */
async function effect_burn(current, next, container) {
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
            capturedImage = await html2canvas(iframeDoc.documentElement, {
                width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
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
    mainCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 10;';
    blocksContainer.appendChild(mainCanvas);
    const ctx = mainCanvas.getContext('2d');

    // 炎キャンバス
    const fireCanvas = document.createElement('canvas');
    fireCanvas.width = width;
    fireCanvas.height = height;
    fireCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 15;';
    blocksContainer.appendChild(fireCanvas);
    const fireCtx = fireCanvas.getContext('2d');

    // 煙キャンバス
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = width;
    smokeCanvas.height = height;
    smokeCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 20;';
    blocksContainer.appendChild(smokeCanvas);
    const smokeCtx = smokeCanvas.getContext('2d');

    // 火花キャンバス
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = width;
    sparkCanvas.height = height;
    sparkCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 25;';
    blocksContainer.appendChild(sparkCanvas);
    const sparkCtx = sparkCanvas.getContext('2d');

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 1 });
    gsap.set(current, { opacity: 0 });
    blocksContainer.style.opacity = '1';

    // 燃焼ライン
    const burnLineResolution = 4;
    const burnLine = [];
    for (let x = 0; x < width; x += burnLineResolution) {
        burnLine.push({
            x: x, y: height,
            speed: 400 + Math.random() * 300,
            noise: Math.random() * Math.PI * 2
        });
    }

    // パーティクル配列
    const flames = [], smokes = [], sparks = [];
    let startTime = performance.now();
    let isAnimating = true;
    let phase = 0;

    // 炎パーティクル生成
    function spawnFlame(x, y) {
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.35) color = { r: 255, g: 120 + Math.random() * 60, b: 0 };
        else if (colorChoice < 0.6) color = { r: 255, g: 80 + Math.random() * 40, b: 0 };
        else if (colorChoice < 0.85) color = { r: 220, g: 40, b: 0 };
        else color = { r: 255, g: 200 + Math.random() * 30, b: 80 };

        flames.push({
            x: x + (Math.random() - 0.5) * 20, y: y,
            vx: (Math.random() - 0.5) * 2, vy: -4 - Math.random() * 6,
            size: 10 + Math.random() * 25, life: 1.0,
            decay: 0.025 + Math.random() * 0.03, color: color,
            turbulence: Math.random() * Math.PI * 2
        });
    }

    // 煙パーティクル生成
    function spawnSmoke(x, y) {
        smokes.push({
            x: x + (Math.random() - 0.5) * 30, y: y - 10 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 1, vy: -2 - Math.random() * 2,
            size: 20 + Math.random() * 35, life: 1.0,
            decay: 0.015 + Math.random() * 0.015,
            opacity: 0.25 + Math.random() * 0.2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03
        });
    }

    // 火花パーティクル生成
    function spawnSpark(x, y) {
        sparks.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 5,
            size: 0.5 + Math.random() * 1.5, life: 1.0,
            decay: 0.05 + Math.random() * 0.05, gravity: 0.15
        });
    }

    // 炎描画
    function drawFlame(ctx, flame) {
        const alpha = flame.life * 0.8;
        const gradient = ctx.createRadialGradient(flame.x, flame.y, 0, flame.x, flame.y, flame.size * flame.life);
        gradient.addColorStop(0, `rgba(${flame.color.r}, ${flame.color.g}, ${flame.color.b}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${flame.color.r}, ${Math.max(0, flame.color.g - 50)}, 0, ${alpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(flame.x, flame.y, flame.size * flame.life, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // 煙描画
    function drawSmoke(ctx, smoke) {
        ctx.save();
        ctx.translate(smoke.x, smoke.y);
        ctx.rotate(smoke.rotation);
        const alpha = smoke.life * smoke.opacity;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, smoke.size);
        gradient.addColorStop(0, `rgba(40, 40, 40, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(60, 60, 60, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.beginPath();
        ctx.arc(0, 0, smoke.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    function animate(currentTime) {
        if (!isAnimating) return;
        phase += 0.5;

        // 燃焼ラインを更新
        let allBurned = true;
        burnLine.forEach(point => {
            if (point.y > -50) {
                allBurned = false;
                const noise = Math.sin(phase + point.noise) * 0.3;
                point.y -= point.speed * 0.016 * (1 + noise);

                if (Math.random() < 0.7) spawnFlame(point.x, point.y);
                if (Math.random() < 0.25) spawnSmoke(point.x, point.y);
                if (Math.random() < 0.3) spawnSpark(point.x, point.y);
            }
        });

        // メイン画像を描画
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        for (let i = burnLine.length - 1; i >= 0; i--) {
            const point = burnLine[i];
            const waveY = point.y + Math.sin(phase * 2 + i * 0.3) * 8;
            ctx.lineTo(point.x + burnLineResolution, Math.max(0, waveY));
        }
        ctx.lineTo(0, burnLine[0].y);
        ctx.closePath();
        ctx.clip();

        // 熱による揺らぎ
        const avgBurnY = burnLine.reduce((sum, p) => sum + p.y, 0) / burnLine.length;
        for (let y = 0; y < height; y++) {
            const distToBurn = Math.abs(y - avgBurnY);
            const heatDistortion = distToBurn < 100 ? (1 - distToBurn / 100) * 5 : 0;
            const offset = Math.sin(y * 0.05 + phase * 3) * heatDistortion;
            ctx.drawImage(capturedImage, 0, y, width, 1, offset, y, width, 1);
        }
        ctx.restore();

        // 焦げたエッジを描画
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < burnLine.length; i++) {
            const point = burnLine[i];
            const waveY = point.y + Math.sin(phase * 2 + i * 0.3) * 8;
            if (i === 0) ctx.moveTo(point.x, waveY);
            else ctx.lineTo(point.x + burnLineResolution, waveY);
        }
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
        flames.forEach(flame => {
            flame.x += flame.vx + Math.sin(phase * 5 + flame.turbulence) * 1.5;
            flame.y += flame.vy;
            flame.vy *= 0.98;
            flame.life -= flame.decay;
            flame.turbulence += 0.1;
            if (flame.life > 0) drawFlame(fireCtx, flame);
        });
        for (let i = flames.length - 1; i >= 0; i--) {
            if (flames[i].life <= 0) flames.splice(i, 1);
        }

        // 煙を描画
        smokeCtx.clearRect(0, 0, width, height);
        smokes.forEach(smoke => {
            smoke.x += smoke.vx;
            smoke.y += smoke.vy;
            smoke.size *= 1.01;
            smoke.life -= smoke.decay;
            smoke.rotation += smoke.rotationSpeed;
            if (smoke.life > 0) drawSmoke(smokeCtx, smoke);
        });
        for (let i = smokes.length - 1; i >= 0; i--) {
            if (smokes[i].life <= 0) smokes.splice(i, 1);
        }

        // 火花を描画
        sparkCtx.clearRect(0, 0, width, height);
        sparkCtx.globalCompositeOperation = 'lighter';
        sparks.forEach(spark => {
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vy += spark.gravity;
            spark.life -= spark.decay;
            if (spark.life > 0) {
                const alpha = spark.life * 0.8;
                sparkCtx.beginPath();
                sparkCtx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
                sparkCtx.fillStyle = `rgba(255, ${150 + Math.random() * 50}, 50, ${alpha})`;
                sparkCtx.fill();
                // 軌跡
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

        // 完了チェック
        if (allBurned && flames.length < 5) {
            isAnimating = false;
            gsap.to([mainCanvas, fireCanvas, smokeCanvas, sparkCanvas], {
                opacity: 0, duration: 0.2,
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
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('burn', effect_burn, { name: '🔥燃焼', category: 'special' });
}
