/**
 * ブラックホール/異世界ゲートエフェクト
 * 空間が裂けてブラックホールポータルに吸い込まれるページ切り替え
 * 3フェーズ: 空間が裂ける → 吸い込み → 吐き出し
 */
async function effect_blackhole(current, next, container) {
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
    const gridSize = 12;
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
                delay: dist / Math.max(width, height)
            });
        }
    }

    // ポータルのパラメータ
    let portalRadius = 0;
    const maxPortalRadius = Math.min(width, height) * 0.15;
    let portalRotation = 0;
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
    
    // 内部的な雷を生成する関数
    function generateLightningBolt(startX, startY, endX, endY, depth = 0, maxDepth = 4) {
        const segments = [];
        const points = [{ x: startX, y: startY }];
        
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const baseAngle = Math.atan2(dy, dx);
        const numPoints = Math.max(3, Math.floor(length / (8 + depth * 3)));
        
        let x = startX, y = startY;
        let totalLen = 0;
        
        for (let i = 1; i < numPoints; i++) {
            const t = i / numPoints;
            const baseX = startX + dx * t;
            const baseY = startY + dy * t;
            const perpAngle = baseAngle + Math.PI / 2;
            const jitterIntensity = (depth === 0 ? 35 : 20 / (depth + 1)) * (1 - t * 0.5);
            const jitter = (Math.random() - 0.5) * jitterIntensity * 2;
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
        
        const numBranches = depth === 0 ? 4 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
        
        for (let b = 0; b < numBranches; b++) {
            const pointIndex = Math.floor(Math.random() * (points.length - 2)) + 1;
            const point = points[pointIndex];
            
            const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
            const mainAngle = Math.atan2(
                points[Math.min(pointIndex + 1, points.length - 1)].y - point.y,
                points[Math.min(pointIndex + 1, points.length - 1)].x - point.x
            );
            const angle = mainAngle + branchAngle;
            
            const branchLength = (60 + Math.random() * 100) / (depth + 1);
            const endX = point.x + Math.cos(angle) * branchLength;
            const endY = point.y + Math.sin(angle) * branchLength;
            
            const branch = generateLightningBolt(point.x, point.y, endX, endY, depth + 1, maxDepth);
            branches.push(branch);
            
            if (depth + 1 < maxDepth && Math.random() < 0.5) {
                const subBranches = generateBranches(branch, maxDepth);
                branches.push(...subBranches);
            }
        }
        
        return branches;
    }
    
    // 雷データ（両方向メイン）
    const cracks = [];
    
    // メインの縦雷（中央から上下に）
    for (let i = 0; i < 2; i++) {
        const offsetX = (i - 0.5) * 40 + (Math.random() - 0.5) * 30;
        
        const boltUp = generateLightningBolt(
            centerX + offsetX, centerY,
            centerX + offsetX + (Math.random() - 0.5) * 80, -30,
            0, 4
        );
        cracks.push(boltUp);
        cracks.push(...generateBranches(boltUp, 3));
        
        const boltDown = generateLightningBolt(
            centerX + offsetX, centerY,
            centerX + offsetX + (Math.random() - 0.5) * 80, height + 30,
            0, 4
        );
        cracks.push(boltDown);
        cracks.push(...generateBranches(boltDown, 3));
    }
    
    // 追加の細い雷
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
    let phase = 0; // 0: 空間裂ける, 1: 吸い込み, 2: 吐き出し
    
    // 「ジジ...ジジジ...バリバリ...ピシピシ...ガパ！」のタイミング（秒単位）
    const timingEvents = [
        { time: 0.0, type: 'jiji', intensity: 0.12, duration: 0.15 },
        { time: 0.2, type: 'jiji', intensity: 0.15, duration: 0.12 },
        { time: 0.4, type: 'jiji', intensity: 0.13, duration: 0.1 },
        { time: 0.6, type: 'jijiji', intensity: 0.22, duration: 0.18 },
        { time: 0.85, type: 'jiji', intensity: 0.18, duration: 0.12 },
        { time: 1.05, type: 'jiji', intensity: 0.2, duration: 0.1 },
        { time: 1.25, type: 'jijiji', intensity: 0.3, duration: 0.2 },
        { time: 1.55, type: 'jiji', intensity: 0.25, duration: 0.12 },
        { time: 1.75, type: 'jijiji', intensity: 0.38, duration: 0.22 },
        { time: 2.05, type: 'bari', intensity: 0.55, duration: 0.12 },
        { time: 2.22, type: 'bari', intensity: 0.65, duration: 0.12 },
        { time: 2.4, type: 'pishi', intensity: 0.75, duration: 0.06 },
        { time: 2.5, type: 'pishi', intensity: 0.82, duration: 0.05 },
        { time: 2.6, type: 'pishi', intensity: 0.9, duration: 0.05 },
        { time: 2.7, type: 'pishi', intensity: 0.95, duration: 0.04 },
        { time: 2.8, type: 'gapa', intensity: 1.0, duration: 0.4 }
    ];

    // ポータル描画関数（縦裂け目デザイン）
    function drawPortal(ctx, cx, cy, radius, rotation, arms, maxRadius) {
        if (radius < 1) return;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        const time = rotation * 2;
        const wobbleX = Math.sin(time * 1.7) * 5;
        const wobbleY = Math.cos(time * 1.3) * 3;
        
        const tearWidth = radius * 0.6;
        const tearHeight = radius * 2.5;
        
        // 外側の紫オーラ（複数レイヤー）
        for (let layer = 3; layer >= 0; layer--) {
            const layerScale = 1 + layer * 0.4;
            const layerAlpha = 0.2 - layer * 0.04;
            
            ctx.beginPath();
            const points = 20;
            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const angle = t * Math.PI * 2;
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
            
            const grad = ctx.createRadialGradient(0, 0, tearHeight * 0.1 * layerScale, 0, 0, tearHeight * layerScale);
            if (layer === 0) {
                grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
                grad.addColorStop(0.5, 'rgba(10, 0, 20, 0.95)');
                grad.addColorStop(1, 'rgba(40, 0, 60, 0.3)');
            } else {
                grad.addColorStop(0, `rgba(60, 0, 100, ${layerAlpha * 1.5})`);
                grad.addColorStop(0.4, `rgba(120, 40, 180, ${layerAlpha})`);
                grad.addColorStop(0.7, `rgba(160, 80, 220, ${layerAlpha * 0.6})`);
                grad.addColorStop(1, 'rgba(180, 100, 255, 0)');
            }
            ctx.fillStyle = grad;
            ctx.fill();
        }
        
        // 裂け目のエッジ（ギザギザ）
        ctx.strokeStyle = 'rgba(180, 100, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(200, 150, 255, 0.8)';
        ctx.shadowBlur = 10;
        
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
        
        // 裂け目から漏れる光（縦に走る）
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
        
        // 裂け目周辺の紫の雷
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
        
        // 裂け目の縁のキラキラ
        for (let i = 0; i < 15; i++) {
            const sparkT = (i / 14) * 2 - 1;
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

    function animate(currentTime) {
        if (!isAnimating) return;

        const elapsed = (currentTime - startTime) / 1000;
        
        if (phase === 0) {
            // フェーズ0: 空間が裂ける (3.2秒) - 段階的に
            const duration = 3.2;
            const progress = Math.min(elapsed / duration, 1);
            
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
            
            // 断続的な揺れ（イベントに応じて）
            let shakeAmount = 0;
            if (currentEvent) {
                if (currentEvent.type === 'jiji' || currentEvent.type === 'jijiji') {
                    shakeAmount = eventProgress < 0.8 ? currentEvent.intensity * 5 * (Math.random() > 0.5 ? 1 : 0) : 0;
                } else if (currentEvent.type === 'bari') {
                    shakeAmount = currentEvent.intensity * 12;
                } else if (currentEvent.type === 'pishi') {
                    shakeAmount = eventProgress < 0.5 ? currentEvent.intensity * 8 : 0;
                } else if (currentEvent.type === 'gapa') {
                    shakeAmount = currentEvent.intensity * 15 * (1 - eventProgress);
                }
            }
            const shakeX = (Math.random() - 0.5) * shakeAmount;
            const shakeY = (Math.random() - 0.5) * shakeAmount;
            
            // ガパ！の瞬間（世界が歪む「ドン！」効果）
            if (currentEvent && currentEvent.type === 'gapa') {
                const distortProgress = eventProgress;
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
                    
                    const drawDistortedRing = (radius, color, lineW) => {
                        ctx.strokeStyle = color;
                        ctx.lineWidth = lineW;
                        ctx.beginPath();
                        for (let a = 0; a <= Math.PI * 2; a += 0.08) {
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
                    
                    drawDistortedRing(ringRadius, `rgba(255, 255, 255, ${0.4 * (1 - ringProgress)})`, ringWidth);
                    drawDistortedRing(ringRadius * 0.92, `rgba(180, 100, 255, ${0.3 * (1 - ringProgress)})`, ringWidth * 1.3);
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
                    
                    const numTears = 3 + Math.floor(tearProgress * 4);
                    for (let t = 0; t < numTears; t++) {
                        const tearOffsetX = (Math.sin(t * 2.7 + elapsed * 3) * 8) * tearProgress;
                        const tearOffsetY = (Math.cos(t * 1.9 + elapsed * 2) * 15) * tearProgress;
                        const tearScaleX = 0.6 + Math.sin(t * 1.3) * 0.4;
                        const tearScaleY = 0.7 + Math.cos(t * 2.1) * 0.3;
                        const tearAlpha = (0.3 + (numTears - t) / numTears * 0.5) * tearProgress;
                        
                        ctx.beginPath();
                        const points = 12;
                        for (let i = 0; i <= points; i++) {
                            const angle = (i / points) * Math.PI * 2;
                            const baseX = Math.cos(angle) * tearWidth * tearScaleX;
                            const baseY = Math.sin(angle) * tearHeight / 2 * tearScaleY;
                            const noise = Math.sin(angle * 5 + elapsed * 8 + t) * (8 + tearProgress * 15)
                                        + Math.sin(angle * 3 + elapsed * 5) * 5;
                            const noiseY = Math.cos(angle * 4 + elapsed * 6 + t * 2) * (10 + tearProgress * 20);
                            const px = tearOffsetX + baseX + (Math.abs(Math.sin(angle)) < 0.3 ? noise : noise * 0.3);
                            const py = tearOffsetY + baseY + noiseY * 0.5;
                            
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        
                        const grad = ctx.createRadialGradient(tearOffsetX, tearOffsetY, 0, tearOffsetX, tearOffsetY, tearHeight / 2);
                        if (t === 0) {
                            grad.addColorStop(0, `rgba(255, 255, 255, ${tearAlpha})`);
                            grad.addColorStop(0.4, `rgba(220, 180, 255, ${tearAlpha * 0.7})`);
                            grad.addColorStop(1, 'rgba(138, 43, 226, 0)');
                        } else {
                            grad.addColorStop(0, `rgba(200, 150, 255, ${tearAlpha * 0.6})`);
                            grad.addColorStop(0.5, `rgba(138, 80, 200, ${tearAlpha * 0.4})`);
                            grad.addColorStop(1, 'rgba(80, 20, 120, 0)');
                        }
                        ctx.fillStyle = grad;
                        ctx.fill();
                    }
                    
                    if (tearProgress > 0.3) {
                        const edgeAlpha = (tearProgress - 0.3) / 0.7;
                        ctx.strokeStyle = `rgba(255, 255, 200, ${edgeAlpha * 0.8})`;
                        ctx.shadowColor = 'rgba(255, 240, 150, 0.8)';
                        ctx.shadowBlur = 5;
                        ctx.lineWidth = 0.5 + Math.random() * 0.5;
                        
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
            
            // 雷の描画関数
            function drawLightningSegment(seg, segProgress, depth, flickerState, burstIntensity, isUltraThin = false) {
                const thinFactor = isUltraThin ? 0.3 : 1;
                const baseWidth = Math.max(0.2, (seg.width || (1.5 - depth * 0.4)) * thinFactor);
                
                const showFlicker = flickerState > 0.25;
                if (!showFlicker && burstIntensity < 0.4) return;
                
                const intensityMult = Math.max(flickerState, burstIntensity);
                
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                if (!isUltraThin) {
                    ctx.shadowColor = 'rgba(255, 240, 150, 0.6)';
                    ctx.shadowBlur = (10 - depth * 2) * intensityMult;
                    ctx.strokeStyle = `rgba(255, 230, 120, ${0.25 * segProgress * intensityMult})`;
                    ctx.lineWidth = (baseWidth * 2.5 + 3 - depth) * intensityMult;
                    ctx.beginPath();
                    ctx.moveTo(seg.x1, seg.y1);
                    ctx.lineTo(seg.x2, seg.y2);
                    ctx.stroke();
                    
                    ctx.shadowColor = 'rgba(255, 255, 220, 0.9)';
                    ctx.shadowBlur = (6 - depth) * intensityMult;
                    ctx.strokeStyle = `rgba(255, 255, 200, ${0.5 * segProgress * intensityMult})`;
                    ctx.lineWidth = (baseWidth + 1 - depth * 0.2) * intensityMult;
                    ctx.stroke();
                }
                
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
            
            // 雷の進行度（イベントベース）
            let crackProgress = 0;
            let burstIntensity = 0;
            
            if (currentEvent) {
                const baseProgress = timingEvents.indexOf(currentEvent) / timingEvents.length;
                const eventContribution = eventProgress * (1 / timingEvents.length);
                crackProgress = Math.min(1, baseProgress + eventContribution);
                burstIntensity = currentEvent.intensity * (1 - eventProgress * 0.5);
            }
            
            // 高速なちらつき（ジジジ感）
            const flickerSpeed = currentEvent?.type === 'jiji' || currentEvent?.type === 'jijiji' ? 80 : 40;
            const flickerState = (Math.sin(elapsed * flickerSpeed) + 1) / 2 
                               * (Math.sin(elapsed * 127) + 1) / 2;
            
            // 雷を描画
            cracks.forEach((crack, crackIndex) => {
                const crackDelay = crackIndex * 0.015;
                const adjustedProgress = Math.max(0, (crackProgress - crackDelay) / (1 - crackDelay));
                const currentLen = crack.maxLen * adjustedProgress;
                const depth = crack.depth || 0;
                
                if (depth > 0 && crackProgress < 0.4) return;
                if (depth > 1 && crackProgress < 0.6) return;
                if (depth > 2 && crackProgress < 0.8) return;
                
                const isUltraThin = depth >= 2 || (crackIndex % 3 === 0 && depth >= 1);
                
                crack.segments.forEach((seg, segIdx) => {
                    if (seg.len < currentLen) {
                        const segProgress = Math.min(1, (currentLen - seg.len) / 10);
                        drawLightningSegment(seg, segProgress, depth, flickerState, burstIntensity, isUltraThin);
                    }
                });
            });
            
            // 追加の極細雷（ランダムに走る）
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
            
            // ピシピシの隙間に閃光
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

            const portalProgress = Math.min(progress * 2, 1);
            portalRadius = maxPortalRadius * (1 - Math.pow(1 - portalProgress, 3));
            portalRotation += 0.15;
            
            ctx.clearRect(0, 0, width, height);
            
            const bgDarkness = Math.min(0.5 + progress * 0.3, 0.8);
            ctx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
            ctx.fillRect(0, 0, width, height);
            
            // 残りの裂け目（フェードアウト）
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

            drawPortal(ctx, centerX, centerY, portalRadius, portalRotation, spiralArms, maxPortalRadius);

            if (progress >= 1) {
                phase = 2;
                startTime = performance.now();
            }
        } else {
            // フェーズ2: 吐き出し (2秒)
            const duration = 2.0;
            const progress = Math.min(elapsed / duration, 1);

            const portalProgress = 1 - progress;
            portalRadius = maxPortalRadius * portalProgress;
            portalRotation -= 0.2;
            
            ctx.clearRect(0, 0, width, height);
            
            const bgDarkness = 0.7 * (1 - progress);
            ctx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
            ctx.fillRect(0, 0, width, height);

            if (portalRadius > 1) {
                drawPortal(ctx, centerX, centerY, portalRadius, portalRotation, spiralArms, maxPortalRadius);
            }

            // 次のページパーティクルを噴き出す（逆回転）
            const ejectForce = Math.pow(progress, 0.5);
            
            nextParticles.forEach(p => {
                const effectProgress = Math.max(0, (progress - (1 - p.delay) * 0.3) * 1.3);
                
                if (effectProgress > 0) {
                    const ejectStrength = Math.min(effectProgress * ejectForce * 1.5, 1);
                    
                    const currentDist = p.dist * ejectStrength;
                    const spiralAngle = p.angle - (1 - ejectStrength) * 3;
                    
                    p.x = centerX + Math.cos(spiralAngle) * currentDist;
                    p.y = centerY + Math.sin(spiralAngle) * currentDist;
                    p.rotation = -(1 - ejectStrength) * 720 * Math.PI / 180;
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

    requestAnimationFrame(animate);
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('blackhole', effect_blackhole, { name: 'ブラックホール', category: 'special' });
}
