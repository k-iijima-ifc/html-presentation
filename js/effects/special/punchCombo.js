// 3連パンチで画面が割れるエフェクト（ドン、ドンドン、ドリャァァ！）

const punchCombo = async (current, next, container) => {
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
    let captureFailed = false;
    
    try {
        if (typeof window.captureIframeCanvas === 'function') {
            currentImage = await window.captureIframeCanvas(currentIframe, width, height);
        }
        if (!currentImage) captureFailed = true;
    } catch (e) {
        captureFailed = true;
    }

    if (!currentImage || captureFailed) {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.set(current, { opacity: 1 });
        gsap.timeline()
            .to(current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' })
            .to(next, { opacity: 1, duration: 0.4, ease: 'power2.inOut', onComplete: () => {
                blocksContainer.innerHTML = '';
                if (typeof finishAnimation === 'function') {
                    finishAnimation(current);
                }
            } }, '-=0.2');
        return;
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
        
        // 外周の大きな破片
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
    fistImage.src = 'assets/hand.png';
    
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
                // ヒビを生成（弱い）
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
            
            // 弱いフラッシュ
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
        // 待機（ドン...の溜め）
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
        // パンチ3: アプローチ（ドリャァァ！への溜め）
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
        // パンチ3: インパクト（ドリャァァ！）
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
        // 破片落下（ドリャァァ！の後）
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
                if (typeof finishAnimation === 'function') {
                    finishAnimation(current);
                }
                return;
            }
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
};

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('punchCombo', punchCombo, {
        name: '3連パンチ',
        category: 'special',
        description: 'ドン、ドンドン、ドリャァァ！の3連パンチ'
    });
}
