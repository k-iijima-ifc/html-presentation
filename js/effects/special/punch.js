// パンチで画面が割れるエフェクト
// 拳が飛んできてガラスを割るような演出

import { effectRegistry } from '../index.js';

const punch = async (current, next, container) => {
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

    // 衝撃点（少しランダムに中心付近）
    const impactX = centerX + (Math.random() - 0.5) * width * 0.2;
    const impactY = centerY + (Math.random() - 0.5) * height * 0.2;

    // ヒビのラインを事前生成
    const crackLines = [];
    const numRadial = 12 + Math.floor(Math.random() * 6);
    const maxDist = Math.max(width, height) * 0.8;
    
    // 放射状のヒビ
    for (let i = 0; i < numRadial; i++) {
        const baseAngle = (i / numRadial) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const points = [{ x: impactX, y: impactY }];
        let x = impactX, y = impactY;
        let currentAngle = baseAngle;
        let dist = 0;
        
        while (dist < maxDist && x > -50 && x < width + 50 && y > -50 && y < height + 50) {
            const segLen = 10 + Math.random() * 25;
            currentAngle = baseAngle + (Math.random() - 0.5) * 0.6;
            x += Math.cos(currentAngle) * segLen;
            y += Math.sin(currentAngle) * segLen;
            points.push({ x, y });
            dist += segLen;
        }
        crackLines.push({ points, type: 'radial', angle: baseAngle });
    }
    
    // 同心円状のヒビ
    for (let ring = 0; ring < 4; ring++) {
        const ringRadius = 50 + ring * 60 + Math.random() * 20;
        if (ringRadius > maxDist) continue;
        const points = [];
        for (let a = 0; a < Math.PI * 2; a += 0.15) {
            const noise = (Math.random() - 0.5) * 15;
            points.push({
                x: impactX + Math.cos(a) * (ringRadius + noise),
                y: impactY + Math.sin(a) * (ringRadius + noise)
            });
        }
        points.push(points[0]);
        crackLines.push({ points, type: 'ring', radius: ringRadius });
    }

    // 破片データ
    const shards = [];
    const radialAngles = [];
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
        gravity: 800 + Math.random() * 200,
        opacity: 1, fallen: false, fallDelay: 0
    });

    // 放射状の破片（リング状に配置）
    const numRings = 4;
    for (let ring = 0; ring < numRings; ring++) {
        const innerRadius = ring === 0 ? centerRadius : 50 + (ring - 1) * 70;
        const outerRadius = 50 + ring * 70 + 40;
        
        for (let i = 0; i < numRadial; i++) {
            const angle1 = radialAngles[i];
            const angle2 = radialAngles[(i + 1) % numRadial];
            
            const vertices = [];
            const noise = () => (Math.random() - 0.5) * 15;
            
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
                vx: Math.cos(avgAngle) * (5 + Math.random() * 8),
                vy: Math.sin(avgAngle) * (5 + Math.random() * 8) - 5,
                rotation: 0, angularVel: (Math.random() - 0.5) * 8,
                gravity: 600 + Math.random() * 400,
                opacity: 1, fallen: false,
                fallDelay: distFromImpact / 400 + Math.random() * 0.15
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
            vx: Math.cos(avgAngle) * (3 + Math.random() * 5),
            vy: Math.sin(avgAngle) * (3 + Math.random() * 5) - 3,
            rotation: 0, angularVel: (Math.random() - 0.5) * 4,
            gravity: 500 + Math.random() * 200,
            opacity: 1, fallen: false, fallDelay: 0.4 + Math.random() * 0.2
        });
    }

    // 手（拳）の画像を読み込む
    const fistImage = new Image();
    fistImage.src = 'js/effects/hand.png';
    
    await new Promise((resolve) => {
        if (fistImage.complete) {
            resolve();
        } else {
            fistImage.onload = resolve;
            fistImage.onerror = resolve;
        }
    });

    let startTime = performance.now();
    let isAnimating = true;
    let phase = 0; // 0: 奥から拳が近づく, 1: 衝撃+ヒビ, 2: 破片落下
    
    // 拳を描画する関数
    function drawFist(ctx, x, y, scale, alpha = 1) {
        if (!fistImage.complete || fistImage.naturalWidth === 0) return;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const imgWidth = fistImage.naturalWidth * scale;
        const imgHeight = fistImage.naturalHeight * scale;
        
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

    // 血の飛沫データを事前生成
    const bloodSplats = [];
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 60;
        bloodSplats.push({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            size: 8 + Math.random() * 25,
            delay: Math.random() * 0.3,
            shape: Math.random()
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
            
            // イージング（最初ゆっくり、最後に加速）
            const easeProgress = Math.pow(progress, 2.5);
            
            // スケール（小さい→大きい）
            const startScale = 0.05;
            const endScale = 0.7;
            const currentScale = startScale + (endScale - startScale) * easeProgress;
            
            // 位置（中央付近から衝撃点へ）
            const startX = centerX;
            const startY = centerY - 50;
            const fistX = startX + (impactX - startX) * easeProgress * 0.3;
            const fistY = startY + (impactY - startY) * easeProgress * 0.5;
            
            // モーションブラー
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
            
            // 最初に弱いフラッシュ
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
            
            // 拳は止まったまま（少し振動）
            const fistVibrate = Math.sin(elapsed * 50) * 2 * (1 - progress);
            drawFist(ctx, impactX + shakeX + fistVibrate, impactY - 30 + shakeY, 0.7, 1);
            
            // ヒビが広がる
            drawCracks(ctx, Math.pow(progress, 0.7));
            
            // 血の飛沫効果
            const bloodStartProgress = 0.3;
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
                    
                    // 血の雫（下に垂れる）
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
            
            // 中心の大きな血の飛沫
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
            // フェーズ2: 拳が消える (0.3秒)
            const duration = 0.3;
            const progress = Math.min(elapsed / duration, 1);
            
            const shakeAmount = 5 * Math.max(0, 1 - progress * 2);
            const shakeX = (Math.random() - 0.5) * shakeAmount;
            const shakeY = (Math.random() - 0.5) * shakeAmount;
            
            ctx.save();
            ctx.translate(shakeX, shakeY);
            ctx.drawImage(currentImage, 0, 0);
            ctx.restore();
            
            // 拳が縮小して消える
            const fistScale = 0.7 * (1 - progress * 0.9);
            const fistAlpha = Math.max(0, 1 - progress * 1.5);
            if (fistAlpha > 0) {
                drawFist(ctx, impactX + shakeX, impactY - 30 + shakeY, fistScale, fistAlpha);
            }
            
            // ヒビを描画
            drawCracks(ctx, 1);
            
            // 血の飛沫を維持（フェードアウト）
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
            
            // 中心の血
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
            
            // 背景（遷移先が見えるように明るく）
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
                
                // 物理計算
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

effectRegistry.register('punch', punch, {
    name: '👊 パンチ破壊',
    category: 'special',
    description: '拳が飛んできてガラスを割るようなエフェクト'
});

export { punch };
