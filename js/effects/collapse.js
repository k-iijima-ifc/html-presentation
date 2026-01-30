// 崩壊エフェクト
const collapseEffects = {
    // ブロック崩壊エフェクト - 画面をキャプチャしてブロック化、重力で崩す（GSAP版）
    collapse: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';

        const containerRect = container.getBoundingClientRect();
        const cols = 5;
        const rows = 4;
        const blockWidth = containerRect.width / cols;
        const blockHeight = containerRect.height / rows;

        // 現在のiframeを取得
        const currentIframe = current.querySelector('iframe');
        
        let capturedCanvas = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const iframeWidth = currentIframe.offsetWidth || containerRect.width;
                const iframeHeight = currentIframe.offsetHeight || containerRect.height;
                capturedCanvas = await html2canvas(iframeDoc.documentElement, {
                    width: iframeWidth,
                    height: iframeHeight,
                    windowWidth: iframeWidth,
                    windowHeight: iframeHeight,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
            }
        } catch (e) {
            try {
                capturedCanvas = await html2canvas(current, {
                    width: containerRect.width,
                    height: containerRect.height,
                    scale: 1,
                    backgroundColor: null
                });
            } catch (e2) {}
        }

        let capturedImage = null;
        if (capturedCanvas && capturedCanvas.width > 0 && capturedCanvas.height > 0) {
            capturedImage = capturedCanvas.toDataURL('image/png');
        }

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        const blocks = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const block = document.createElement('div');
                block.className = 'falling-block';
                block.style.width = blockWidth + 'px';
                block.style.height = blockHeight + 'px';
                block.style.left = col * blockWidth + 'px';
                block.style.top = row * blockHeight + 'px';
                block.style.opacity = '0';
                block.style.overflow = 'hidden';

                if (capturedImage) {
                    block.style.backgroundImage = `url(${capturedImage})`;
                    block.style.backgroundSize = `${containerRect.width}px ${containerRect.height}px`;
                    block.style.backgroundPosition = `-${col * blockWidth}px -${row * blockHeight}px`;
                } else {
                    const hue = (row * cols + col) * (360 / (rows * cols));
                    block.style.background = `linear-gradient(135deg, hsl(${hue}, 60%, 40%), hsl(${hue + 30}, 60%, 30%))`;
                }

                blocksContainer.appendChild(block);
                blocks.push({ element: block, row, col });
            }
        }

        const tl = gsap.timeline();

        tl.to(current, {
            x: gsap.utils.random(-4, 4),
            y: gsap.utils.random(-3, 3),
            duration: 0.06,
            repeat: 12,
            yoyo: true
        })
        .call(() => {
            blocksContainer.style.opacity = '1';
            blocks.forEach(b => b.element.style.opacity = '1');
            gsap.set(current, { opacity: 0, x: 0, y: 0 });
        })
        .to(blocks.map(b => b.element), {
            scale: 0.92,
            boxShadow: '0 0 15px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.2)',
            duration: 0.25,
            stagger: { from: "random", amount: 0.15 }
        })
        .add(() => {
            blocks.forEach(b => {
                const delay = b.row * 0.12 + Math.random() * 0.08;
                gsap.to(b.element, {
                    y: containerRect.height + 150 + Math.random() * 100,
                    x: gsap.utils.random(-70, 70),
                    rotation: gsap.utils.random(-200, 200),
                    opacity: 0,
                    duration: gsap.utils.random(0.6, 1.0),
                    delay: delay,
                    ease: "power2.in"
                });
            });
        })
        .call(() => {
            gsap.set(next, { opacity: 1, y: -50 });
        }, null, "+=0.5")
        .to(next, { y: 0, duration: 0.5, ease: "bounce.out" })
        .call(() => {
            blocksContainer.innerHTML = '';
            gsap.set(current, { x: 0, y: 0, opacity: 1 });
            finishAnimation(current);
        }, null, "+=0.3");
    },

    // 物理エンジン版崩壊エフェクト - Matter.jsでリアルな物理挙動（不規則形状）
    collapsePhysics: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';

        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // iframeキャプチャ
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
                capturedImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        // Voronoi風のランダム点を生成
        const numPoints = 35; // 細かめに分割
        const points = [];
        
        // グリッドベースでランダム配置（均等に散らばるように）
        const gridCols = 7;
        const gridRows = 5;
        const cellW = width / gridCols;
        const cellH = height / gridRows;
        
        for (let gy = 0; gy < gridRows; gy++) {
            for (let gx = 0; gx < gridCols; gx++) {
                points.push({
                    x: cellW * gx + cellW * (0.2 + Math.random() * 0.6),
                    y: cellH * gy + cellH * (0.2 + Math.random() * 0.6)
                });
            }
        }

        // シンプルなVoronoi風の領域分割（近似）
        function generateVoronoiCells(points, width, height) {
            const cells = [];
            const resolution = 8; // サンプリング解像度
            
            points.forEach((center, idx) => {
                const cellPoints = [];
                const angles = [];
                
                // 中心から放射状にサンプリング
                for (let a = 0; a < 360; a += 15) {
                    const rad = a * Math.PI / 180;
                    let maxDist = Math.max(width, height);
                    
                    // この方向で最も近い境界を探す
                    for (let d = 5; d < maxDist; d += resolution) {
                        const px = center.x + Math.cos(rad) * d;
                        const py = center.y + Math.sin(rad) * d;
                        
                        // 画面外チェック
                        if (px < 0 || px > width || py < 0 || py > height) {
                            cellPoints.push({ x: px, y: py });
                            angles.push(a);
                            break;
                        }
                        
                        // 他の点により近いかチェック
                        let closerToOther = false;
                        for (let j = 0; j < points.length; j++) {
                            if (j === idx) continue;
                            const distToCenter = Math.hypot(px - center.x, py - center.y);
                            const distToOther = Math.hypot(px - points[j].x, py - points[j].y);
                            if (distToOther < distToCenter) {
                                closerToOther = true;
                                break;
                            }
                        }
                        
                        if (closerToOther) {
                            cellPoints.push({ x: px, y: py });
                            angles.push(a);
                            break;
                        }
                    }
                }
                
                if (cellPoints.length >= 3) {
                    cells.push({
                        center: center,
                        vertices: cellPoints
                    });
                }
            });
            
            return cells;
        }

        const cells = generateVoronoiCells(points, width, height);

        // Matter.js セットアップ
        const Engine = Matter.Engine,
              World = Matter.World,
              Bodies = Matter.Bodies,
              Body = Matter.Body,
              Vertices = Matter.Vertices;

        const engine = Engine.create();
        engine.world.gravity.y = 2; // 重力を強めに

        const blocks = [];

        // 各セルに対してブロック生成
        cells.forEach((cell, i) => {
            const center = cell.center;
            const vertices = cell.vertices;
            
            // バウンディングボックス計算
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            vertices.forEach(v => {
                minX = Math.min(minX, v.x);
                maxX = Math.max(maxX, v.x);
                minY = Math.min(minY, v.y);
                maxY = Math.max(maxY, v.y);
            });
            
            const cellWidth = maxX - minX;
            const cellHeight = maxY - minY;
            
            if (cellWidth < 10 || cellHeight < 10) return;

            // SVGでクリップパスを作成
            const clipId = `clip-${i}`;
            const pathD = vertices.map((v, idx) => 
                `${idx === 0 ? 'M' : 'L'} ${v.x - minX} ${v.y - minY}`
            ).join(' ') + ' Z';

            // DOM要素（SVGマスク使用）
            const block = document.createElement('div');
            block.className = 'falling-block';
            block.style.width = cellWidth + 'px';
            block.style.height = cellHeight + 'px';
            block.style.left = minX + 'px';
            block.style.top = minY + 'px';
            block.style.opacity = '0';
            block.style.overflow = 'visible';
            block.style.background = 'transparent';

            // SVGクリップパス
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.width = '0';
            svg.style.height = '0';
            svg.innerHTML = `
                <defs>
                    <clipPath id="${clipId}">
                        <path d="${pathD}"/>
                    </clipPath>
                </defs>
            `;
            block.appendChild(svg);

            // 内部コンテンツ
            const inner = document.createElement('div');
            inner.style.width = cellWidth + 'px';
            inner.style.height = cellHeight + 'px';
            inner.style.clipPath = `url(#${clipId})`;
            inner.style.webkitClipPath = `url(#${clipId})`;
            
            if (capturedImage) {
                inner.style.backgroundImage = `url(${capturedImage})`;
                inner.style.backgroundSize = `${width}px ${height}px`;
                inner.style.backgroundPosition = `-${minX}px -${minY}px`;
            } else {
                const hue = (i * 17) % 360;
                inner.style.background = `hsl(${hue}, 60%, 45%)`;
            }
            
            // 境界線を追加
            inner.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.3)';
            
            block.appendChild(inner);
            blocksContainer.appendChild(block);

            // 物理ボディ（多角形は複雑なので矩形で近似）
            const body = Bodies.rectangle(
                center.x, 
                center.y, 
                cellWidth * 0.8, 
                cellHeight * 0.8, 
                {
                    isStatic: true,
                    restitution: 0.3 + Math.random() * 0.3,
                    friction: 0.4,
                    frictionAir: 0.01 + Math.random() * 0.02,
                    angle: (Math.random() - 0.5) * 0.1
                }
            );

            World.add(engine.world, body);
            blocks.push({ 
                element: block, 
                body, 
                centerX: center.x,
                centerY: center.y,
                offsetX: center.x - minX - cellWidth / 2,
                offsetY: center.y - minY - cellHeight / 2,
                cellWidth,
                cellHeight
            });
        });

        // 床と壁
        const wallThickness = 60;
        const floor = Bodies.rectangle(
            width / 2, 
            height + wallThickness / 2 + 50, 
            width * 2, 
            wallThickness, 
            { isStatic: true, restitution: 0.2 }
        );
        const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true });
        const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true });
        World.add(engine.world, [floor, leftWall, rightWall]);

        let animationId;
        let frameCount = 0;
        const maxFrames = 360;

        function updatePhysics() {
            Engine.update(engine, 1000 / 60);

            blocks.forEach(b => {
                const pos = b.body.position;
                const angle = b.body.angle;
                b.element.style.left = (pos.x - b.cellWidth / 2 - b.offsetX) + 'px';
                b.element.style.top = (pos.y - b.cellHeight / 2 - b.offsetY) + 'px';
                b.element.style.transform = `rotate(${angle}rad)`;
            });

            frameCount++;

            if (frameCount > 220) {
                const fadeProgress = (frameCount - 220) / 140;
                blocks.forEach(b => {
                    b.element.style.opacity = Math.max(0, 1 - fadeProgress);
                });
            }

            if (frameCount < maxFrames) {
                animationId = requestAnimationFrame(updatePhysics);
            } else {
                cancelAnimationFrame(animationId);
                World.clear(engine.world);
                Engine.clear(engine);
                blocksContainer.innerHTML = '';
                gsap.set(current, { x: 0, y: 0, opacity: 1 });
                finishAnimation(current);
            }
        }

        const tl = gsap.timeline();

        // フェーズ1: 揺れ
        tl.to(current, {
            x: gsap.utils.random(-6, 6),
            y: gsap.utils.random(-4, 4),
            duration: 0.04,
            repeat: 20,
            yoyo: true
        })
        // フェーズ2: ブロック表示
        .call(() => {
            blocksContainer.style.opacity = '1';
            blocks.forEach(b => b.element.style.opacity = '1');
            gsap.set(current, { opacity: 0, x: 0, y: 0 });
        })
        // フェーズ3: ヒビ演出（ブロックを少し縮める）
        .to(blocks.map(b => b.element), {
            scale: 0.97,
            duration: 0.15,
            stagger: { from: "random", amount: 0.1 }
        })
        // フェーズ4: 物理シミュレーション開始
        .call(() => {
            // ランダムな順序で落下開始
            const shuffled = [...blocks].sort(() => Math.random() - 0.5);
            shuffled.forEach((b, i) => {
                setTimeout(() => {
                    Body.setStatic(b.body, false);
                    Body.setVelocity(b.body, {
                        x: (Math.random() - 0.5) * 8,
                        y: Math.random() * -5
                    });
                    Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.3);
                }, i * 25 + Math.random() * 30);
            });
            
            updatePhysics();
        })
        // フェーズ5: 新コンテンツ表示
        .call(() => {
            gsap.set(next, { opacity: 1, y: -30 });
            gsap.to(next, { y: 0, duration: 0.4, ease: "power2.out" });
        }, null, "+=1.2");
    },

    // IFORCOMスイープエフェクト - Matter.js物理演算版（重力あり・衝突あり）
    iforcomSweep: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';

        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // Matter.js設定
        const Engine = Matter.Engine,
              Render = Matter.Render,
              World = Matter.World,
              Bodies = Matter.Bodies,
              Body = Matter.Body,
              Composite = Matter.Composite;

        const engine = Engine.create();
        engine.world.gravity.y = 0.8; // 重力有効

        // iframeキャプチャ
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
                capturedImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        // 細かいグリッド分割（12x8 = 96個）
        const cols = 12;
        const rows = 8;
        const cellW = width / cols;
        const cellH = height / rows;
        
        const blocks = [];

        // 床と壁を作成（ピースが落ちて溜まる）
        const wallThickness = 50;
        const floor = Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { 
            isStatic: true, 
            friction: 0.5,
            restitution: 0.3
        });
        const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { 
            isStatic: true 
        });
        const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { 
            isStatic: true 
        });
        World.add(engine.world, [floor, leftWall, rightWall]);

        // ブロック生成
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellW;
                const y = row * cellH;
                const centerX = x + cellW / 2;
                const centerY = y + cellH / 2;
                
                const block = document.createElement('div');
                block.className = 'falling-block';
                block.style.width = cellW + 'px';
                block.style.height = cellH + 'px';
                block.style.left = '0px';
                block.style.top = '0px';
                block.style.opacity = '0';
                block.style.background = 'transparent';
                block.style.transformOrigin = 'center center';

                if (capturedImage) {
                    block.style.backgroundImage = `url(${capturedImage})`;
                    block.style.backgroundSize = `${width}px ${height}px`;
                    block.style.backgroundPosition = `-${x}px -${y}px`;
                } else {
                    const hue = (row * cols + col) * (360 / (rows * cols));
                    block.style.background = `hsl(${hue}, 60%, 45%)`;
                }
                
                block.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.15)';
                blocksContainer.appendChild(block);

                // 物理ボディ（最初は静止）
                const body = Bodies.rectangle(centerX, centerY, cellW * 0.95, cellH * 0.95, {
                    isStatic: true,
                    restitution: 0.6,
                    friction: 0.3,
                    frictionAir: 0.01
                });

                World.add(engine.world, body);

                blocks.push({ 
                    element: block, 
                    body: body,
                    initialX: x,
                    initialY: y,
                    col, 
                    row,
                    hit: false
                });
            }
        }

        // IFORCOMテキストオブジェクトを作成
        const iforcomObj = document.createElement('div');
        iforcomObj.textContent = 'IFORCOM';
        iforcomObj.style.cssText = `
            position: absolute;
            left: -500px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 100px;
            font-weight: 900;
            font-family: 'Arial Black', Impact, sans-serif;
            color: transparent;
            -webkit-text-stroke: 3px #00ffff;
            text-shadow: 
                0 0 20px #00ffff,
                0 0 40px #00ffff,
                0 0 60px #ff00ff,
                0 0 80px #ff00ff;
            white-space: nowrap;
            z-index: 200;
            pointer-events: none;
        `;
        blocksContainer.appendChild(iforcomObj);

        // IFORCOM物理ボディ（キネマティック：他を押すが自分は動かない）
        const iforcomWidth = 480;
        const iforcomHeight = 100;
        const iforcomBody = Bodies.rectangle(-iforcomWidth / 2, height / 2, iforcomWidth, iforcomHeight, {
            isStatic: true,
            restitution: 1.0,
            friction: 0,
            label: 'iforcom'
        });
        World.add(engine.world, iforcomBody);

        let animationId;
        let iforcomX = -iforcomWidth;
        const iforcomSpeed = 8;
        let isRunning = true;

        function updatePhysics() {
            if (!isRunning) return;

            // IFORCOMを移動
            iforcomX += iforcomSpeed;
            Body.setPosition(iforcomBody, { x: iforcomX + iforcomWidth / 2, y: height / 2 });
            iforcomObj.style.left = iforcomX + 'px';

            // 各ブロックとIFORCOMの衝突判定
            blocks.forEach(b => {
                if (b.hit) return;

                const bx = b.body.position.x;
                const by = b.body.position.y;
                const ix = iforcomBody.position.x;
                const iy = iforcomBody.position.y;

                // 衝突判定
                const dx = bx - ix;
                const dy = by - iy;
                const distX = Math.abs(dx);
                const distY = Math.abs(dy);

                if (distX < (iforcomWidth / 2 + cellW / 2) && distY < (iforcomHeight / 2 + cellH / 2)) {
                    b.hit = true;
                    
                    // 静止状態を解除
                    Body.setStatic(b.body, false);
                    
                    // 弾き飛ばす力を加える
                    const angle = Math.atan2(dy, dx);
                    const forceMag = 0.15 + Math.random() * 0.1;
                    Body.applyForce(b.body, b.body.position, {
                        x: Math.cos(angle) * forceMag,
                        y: Math.sin(angle) * forceMag - 0.05
                    });
                    Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.4);
                }
            });

            // 物理演算更新
            Engine.update(engine, 1000 / 60);

            // DOM位置更新
            blocks.forEach(b => {
                const pos = b.body.position;
                const angle = b.body.angle;
                b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
            });

            // IFORCOMが画面外に出たら終了処理
            if (iforcomX < width + 200) {
                animationId = requestAnimationFrame(updatePhysics);
            } else {
                // 少し物理演算を続ける（ピースが落ちて溜まる）
                let extraFrames = 120;
                function continuePhysics() {
                    Engine.update(engine, 1000 / 60);
                    blocks.forEach(b => {
                        const pos = b.body.position;
                        const angle = b.body.angle;
                        b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
                    });
                    extraFrames--;
                    if (extraFrames > 0) {
                        requestAnimationFrame(continuePhysics);
                    } else {
                        // フェードアウトしてクリーンアップ
                        gsap.to(blocksContainer, {
                            opacity: 0,
                            duration: 0.5,
                            onComplete: () => {
                                World.clear(engine.world);
                                Engine.clear(engine);
                                blocksContainer.innerHTML = '';
                                blocksContainer.style.opacity = '1';
                                gsap.set(current, { x: 0, y: 0, opacity: 1 });
                                finishAnimation(current);
                            }
                        });
                    }
                }
                continuePhysics();
            }
        }

        const tl = gsap.timeline();

        // フェーズ1: ブロック表示
        tl.call(() => {
            blocksContainer.style.opacity = '1';
            blocks.forEach(b => b.element.style.opacity = '1');
            gsap.set(current, { opacity: 0 });
        })
        // フェーズ2: 少し待機
        .to({}, { duration: 0.3 })
        // フェーズ3: IFORCOM登場とアニメーション開始
        .call(() => {
            updatePhysics();
        })
        // フェーズ4: 新コンテンツ表示
        .call(() => {
            gsap.set(next, { opacity: 1, scale: 0.95 });
            gsap.to(next, { scale: 1, duration: 0.4, ease: "power2.out" });
        }, null, "+=1.8");
    },

    // IFORCOMバウンスエフェクト - 鎖でつながれた文字が先頭のiに引っ張られる
    iforcomBounce: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';

        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // Matter.js設定
        const Engine = Matter.Engine,
              World = Matter.World,
              Bodies = Matter.Bodies,
              Body = Matter.Body,
              Constraint = Matter.Constraint;

        const engine = Engine.create();
        engine.world.gravity.y = 2.0; // 強めの重力

        // iframeキャプチャ
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
                capturedImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        // 細かいグリッド分割
        const cols = 14;
        const rows = 10;
        const cellW = width / cols;
        const cellH = height / rows;
        
        const blocks = [];

        // 床を作成（文字用のみ - ピースは画面外に飛ばす）
        const floor = Bodies.rectangle(width / 2, height + 25, width * 2, 50, { 
            isStatic: true, 
            friction: 0.5,
            restitution: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0002 } // 文字のみ衝突
        });
        World.add(engine.world, floor);

        // ブロック生成
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellW;
                const y = row * cellH;
                const centerX = x + cellW / 2;
                const centerY = y + cellH / 2;
                
                const block = document.createElement('div');
                block.className = 'falling-block';
                block.style.width = cellW + 'px';
                block.style.height = cellH + 'px';
                block.style.left = '0px';
                block.style.top = '0px';
                block.style.opacity = '0';
                block.style.background = 'transparent';

                if (capturedImage) {
                    block.style.backgroundImage = `url(${capturedImage})`;
                    block.style.backgroundSize = `${width}px ${height}px`;
                    block.style.backgroundPosition = `-${x}px -${y}px`;
                } else {
                    const hue = (row * cols + col) * (360 / (rows * cols));
                    block.style.background = `hsl(${hue}, 60%, 45%)`;
                }
                
                block.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.1)';
                blocksContainer.appendChild(block);

                const body = Bodies.rectangle(centerX, centerY, cellW * 0.9, cellH * 0.9, {
                    isStatic: true,
                    restitution: 0.8,
                    friction: 0.1,
                    frictionAir: 0.005, // 空気抵抗を減らして遠くへ飛ぶ
                    collisionFilter: { category: 0x0001, mask: 0x0001 } // ピース同士のみ衝突
                });
                World.add(engine.world, body);

                blocks.push({ 
                    element: block, 
                    body: body,
                    hit: false
                });
            }
        }

        // IFORCOM各文字を物理ボディとして作成
        const letters = ['I', 'F', 'O', 'R', 'C', 'O', 'M'];
        const letterBodies = [];
        const letterElements = [];
        const letterWidth = 55;
        const letterHeight = 70;
        const chainLength = 35; // 鎖の長さ
        const startX = -350;
        const startY = height - 150;

        // 各文字のDOM要素と物理ボディを作成
        letters.forEach((letter, i) => {
            const letterEl = document.createElement('div');
            letterEl.textContent = letter;
            letterEl.style.cssText = `
                position: absolute;
                left: 0px;
                top: 0px;
                font-size: 70px;
                font-weight: 900;
                font-family: 'Arial Black', Impact, sans-serif;
                color: ${i === 0 ? '#ffff00' : '#00ffff'};
                text-shadow: 
                    0 0 10px ${i === 0 ? '#ffff00' : '#00ffff'},
                    0 0 20px ${i === 0 ? '#ff8800' : '#00ffff'},
                    0 0 30px ${i === 0 ? '#ff0000' : '#ff00ff'},
                    3px 3px 0 #000;
                white-space: nowrap;
                z-index: ${200 - i};
                pointer-events: none;
                width: ${letterWidth}px;
                text-align: center;
            `;
            blocksContainer.appendChild(letterEl);
            letterElements.push(letterEl);

            // 物理ボディ（先頭のiは特別扱い）
            const body = Bodies.rectangle(
                startX + i * (letterWidth + chainLength * 0.5),
                startY + (i === 0 ? 0 : 20),
                letterWidth * 0.6,
                letterHeight * 0.6,
                {
                    restitution: 0.7,
                    friction: 0.1,
                    frictionAir: 0.01,
                    mass: i === 0 ? 5 : 1, // 先頭は重い
                    label: `letter_${letter}_${i}`
                }
            );
            World.add(engine.world, body);
            letterBodies.push(body);
        });

        // 文字間を鎖（Constraint）で接続
        const constraints = [];
        for (let i = 0; i < letterBodies.length - 1; i++) {
            const constraint = Constraint.create({
                bodyA: letterBodies[i],
                bodyB: letterBodies[i + 1],
                length: chainLength,
                stiffness: 0.3, // 柔らかい鎖
                damping: 0.1
            });
            constraints.push(constraint);
            World.add(engine.world, constraint);
        }

        // 先頭文字の制御用変数
        let leadX = startX;
        let leadY = startY;
        let leadVx = 10; // より速く
        let leadVy = 0;
        let bounceCount = 0;
        const groundY = height - 50; // 地面位置

        function updatePhysics() {
            // 先頭の「I」を手動で制御（大きく飛び跳ねながら進む）
            leadX += leadVx;
            leadVy += 1.8; // 強い重力
            leadY += leadVy;

            // 床との衝突（大きくバウンス）
            if (leadY >= groundY) {
                leadY = groundY;
                if (leadVy > 2) {
                    bounceCount++;
                    leadVy = -28 - Math.random() * 8; // 大きくジャンプ
                    
                    // 着地時の強い衝撃波
                    const impactX = leadX;
                    const impactRadius = 250; // 広い範囲
                    
                    blocks.forEach(b => {
                        if (b.hit) return;
                        const bx = b.body.position.x;
                        const by = b.body.position.y;
                        const dx = bx - impactX;
                        const dy = by - groundY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < impactRadius) {
                            b.hit = true;
                            Body.setStatic(b.body, false);
                            const angle = Math.atan2(dy - 50, dx);
                            const force = (1 - dist / impactRadius) * 0.5; // 強い力
                            Body.applyForce(b.body, b.body.position, {
                                x: Math.cos(angle) * force * 1.5,
                                y: -Math.abs(Math.sin(angle)) * force - 0.2
                            });
                            Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.4);
                        }
                    });
                } else {
                    leadVy = 0;
                }
            }

            // 先頭文字の位置を強制設定
            Body.setPosition(letterBodies[0], { x: leadX, y: leadY });
            Body.setVelocity(letterBodies[0], { x: leadVx, y: leadVy });
            Body.setAngle(letterBodies[0], 0); // 回転しない

            // 後続文字も回転を抑制
            for (let i = 1; i < letterBodies.length; i++) {
                Body.setAngle(letterBodies[i], 0);
                Body.setAngularVelocity(letterBodies[i], 0);
            }

            // 文字がブロックにぶつかった時の判定（強い力で飛ばす）
            letterBodies.forEach((lb, idx) => {
                const lx = lb.position.x;
                const ly = lb.position.y;
                
                blocks.forEach(b => {
                    if (b.hit) return;
                    const bx = b.body.position.x;
                    const by = b.body.position.y;
                    const dx = bx - lx;
                    const dy = by - ly;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 70) {
                        b.hit = true;
                        Body.setStatic(b.body, false);
                        const angle = Math.atan2(dy, dx);
                        const force = 0.2 + (idx === 0 ? 0.25 : 0.1); // 強い力
                        Body.applyForce(b.body, b.body.position, {
                            x: Math.cos(angle) * force + leadVx * 0.02,
                            y: Math.sin(angle) * force - 0.1
                        });
                        Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.6);
                    }
                });
            });

            // 物理演算更新
            Engine.update(engine, 1000 / 60);

            // 文字DOM位置更新（回転なし）
            letterBodies.forEach((body, i) => {
                const pos = body.position;
                letterElements[i].style.transform = `translate(${pos.x - letterWidth / 2}px, ${pos.y - letterHeight / 2}px)`;
            });

            // ブロックDOM位置更新
            blocks.forEach(b => {
                const pos = b.body.position;
                const angle = b.body.angle;
                b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
            });

            // 終了判定
            if (leadX < width + 150) {
                requestAnimationFrame(updatePhysics);
            } else {
                // 残りの物理演算（文字が画面外に消えるまで）
                let extraFrames = 120;
                function continuePhysics() {
                    // 後続文字も回転を抑制し続ける
                    for (let i = 0; i < letterBodies.length; i++) {
                        Body.setAngle(letterBodies[i], 0);
                        Body.setAngularVelocity(letterBodies[i], 0);
                    }
                    
                    Engine.update(engine, 1000 / 60);
                    
                    letterBodies.forEach((body, i) => {
                        const pos = body.position;
                        letterElements[i].style.transform = `translate(${pos.x - letterWidth / 2}px, ${pos.y - letterHeight / 2}px)`;
                    });
                    
                    blocks.forEach(b => {
                        const pos = b.body.position;
                        const angle = b.body.angle;
                        b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
                    });
                    
                    extraFrames--;
                    if (extraFrames > 0) {
                        requestAnimationFrame(continuePhysics);
                    } else {
                        gsap.to(blocksContainer, {
                            opacity: 0,
                            duration: 0.4,
                            onComplete: () => {
                                World.clear(engine.world);
                                Engine.clear(engine);
                                blocksContainer.innerHTML = '';
                                blocksContainer.style.opacity = '1';
                                gsap.set(current, { x: 0, y: 0, opacity: 1 });
                                finishAnimation(current);
                            }
                        });
                    }
                }
                continuePhysics();
            }
        }

        const tl = gsap.timeline();

        tl.call(() => {
            blocksContainer.style.opacity = '1';
            blocks.forEach(b => b.element.style.opacity = '1');
            gsap.set(current, { opacity: 0 });
        })
        .to({}, { duration: 0.2 })
        .call(() => {
            leadVy = -18;
            updatePhysics();
        })
        .call(() => {
            gsap.set(next, { opacity: 1, scale: 0.95 });
            gsap.to(next, { scale: 1, duration: 0.4, ease: "power2.out" });
        }, null, "+=2.5");
    },

    // IFORCOMカオスエフェクト - あちこちからランダムに登場
    iforcomChaos: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';

        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // Matter.js設定
        const Engine = Matter.Engine,
              World = Matter.World,
              Bodies = Matter.Bodies,
              Body = Matter.Body;

        const engine = Engine.create();
        engine.world.gravity.y = 0.5;

        // iframeキャプチャ
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
                capturedImage = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        // 細かいグリッド分割
        const cols = 16;
        const rows = 10;
        const cellW = width / cols;
        const cellH = height / rows;
        
        const blocks = [];

        // 壁を作成
        const wallThickness = 100;
        World.add(engine.world, [
            Bodies.rectangle(width / 2, height + wallThickness / 2, width * 3, wallThickness, { isStatic: true }),
            Bodies.rectangle(width / 2, -wallThickness / 2, width * 3, wallThickness, { isStatic: true }),
            Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true }),
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, { isStatic: true })
        ]);

        // ブロック生成
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellW;
                const y = row * cellH;
                const centerX = x + cellW / 2;
                const centerY = y + cellH / 2;
                
                const block = document.createElement('div');
                block.className = 'falling-block';
                block.style.width = cellW + 'px';
                block.style.height = cellH + 'px';
                block.style.left = '0px';
                block.style.top = '0px';
                block.style.opacity = '0';
                block.style.background = 'transparent';

                if (capturedImage) {
                    block.style.backgroundImage = `url(${capturedImage})`;
                    block.style.backgroundSize = `${width}px ${height}px`;
                    block.style.backgroundPosition = `-${x}px -${y}px`;
                } else {
                    const hue = (row * cols + col) * (360 / (rows * cols));
                    block.style.background = `hsl(${hue}, 60%, 45%)`;
                }
                
                block.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.1)';
                blocksContainer.appendChild(block);

                const body = Bodies.rectangle(centerX, centerY, cellW * 0.9, cellH * 0.9, {
                    isStatic: true,
                    restitution: 0.6,
                    friction: 0.3,
                    frictionAir: 0.02
                });
                World.add(engine.world, body);

                blocks.push({ 
                    element: block, 
                    body: body,
                    hit: false
                });
            }
        }

        // IFORCOM設定
        const iforcomList = [];
        const directions = [
            { name: 'left', startX: -400, startY: () => height * 0.3 + Math.random() * height * 0.4, vx: 12, vy: 0 },
            { name: 'right', startX: width + 100, startY: () => height * 0.3 + Math.random() * height * 0.4, vx: -12, vy: 0 },
            { name: 'top', startX: () => width * 0.2 + Math.random() * width * 0.6, startY: -100, vx: 0, vy: 10 },
            { name: 'bottom', startX: () => width * 0.2 + Math.random() * width * 0.6, startY: height + 100, vx: 0, vy: -10 },
            { name: 'topLeft', startX: -300, startY: -100, vx: 10, vy: 8 },
            { name: 'topRight', startX: width + 100, startY: -100, vx: -10, vy: 8 },
            { name: 'bottomLeft', startX: -300, startY: height + 100, vx: 10, vy: -8 },
            { name: 'bottomRight', startX: width + 100, startY: height + 100, vx: -10, vy: -8 }
        ];

        const colors = [
            { stroke: '#00ffff', shadow: '#00ffff', accent: '#ff00ff' },
            { stroke: '#ff00ff', shadow: '#ff00ff', accent: '#00ffff' },
            { stroke: '#ffff00', shadow: '#ffff00', accent: '#ff0000' },
            { stroke: '#00ff00', shadow: '#00ff00', accent: '#0088ff' },
            { stroke: '#ff6600', shadow: '#ff6600', accent: '#ffff00' }
        ];

        function createIforcom(dirIndex, delay) {
            const dir = directions[dirIndex % directions.length];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const startX = typeof dir.startX === 'function' ? dir.startX() : dir.startX;
            const startY = typeof dir.startY === 'function' ? dir.startY() : dir.startY;

            const iforcomObj = document.createElement('div');
            iforcomObj.textContent = 'IFORCOM';
            iforcomObj.style.cssText = `
                position: absolute;
                left: ${startX}px;
                top: ${startY}px;
                font-size: ${50 + Math.random() * 40}px;
                font-weight: 900;
                font-family: 'Arial Black', Impact, sans-serif;
                color: transparent;
                -webkit-text-stroke: 2px ${color.stroke};
                text-shadow: 
                    0 0 15px ${color.shadow},
                    0 0 30px ${color.shadow},
                    0 0 45px ${color.accent};
                white-space: nowrap;
                z-index: 200;
                pointer-events: none;
                opacity: 0;
            `;
            blocksContainer.appendChild(iforcomObj);

            const iforcom = {
                element: iforcomObj,
                x: startX,
                y: startY,
                vx: dir.vx * (0.8 + Math.random() * 0.4),
                vy: dir.vy * (0.8 + Math.random() * 0.4),
                width: 300,
                height: 70,
                active: false,
                delay: delay,
                direction: dir.name
            };

            iforcomList.push(iforcom);
            return iforcom;
        }

        // 複数のIFORCOMをランダムに生成（8個）
        const iforcomCount = 8;
        const usedDirections = [];
        for (let i = 0; i < iforcomCount; i++) {
            let dirIndex;
            do {
                dirIndex = Math.floor(Math.random() * directions.length);
            } while (usedDirections.includes(dirIndex) && usedDirections.length < directions.length);
            usedDirections.push(dirIndex);
            if (usedDirections.length >= directions.length) usedDirections.length = 0;
            
            createIforcom(dirIndex, i * 300 + Math.random() * 200);
        }

        let startTime = 0;
        let isRunning = true;

        function updatePhysics(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            // 各IFORCOMを更新
            iforcomList.forEach(iforcom => {
                if (elapsed < iforcom.delay) return;
                
                if (!iforcom.active) {
                    iforcom.active = true;
                    iforcom.element.style.opacity = '1';
                }

                // 移動
                iforcom.x += iforcom.vx;
                iforcom.y += iforcom.vy;
                iforcom.element.style.left = iforcom.x + 'px';
                iforcom.element.style.top = iforcom.y + 'px';
                
                // 回転（進行方向に応じて）
                const angle = Math.atan2(iforcom.vy, iforcom.vx) * 180 / Math.PI;
                iforcom.element.style.transform = `rotate(${angle}deg)`;

                // ブロックとの衝突判定
                blocks.forEach(b => {
                    if (b.hit) return;
                    const bx = b.body.position.x;
                    const by = b.body.position.y;
                    
                    const ix = iforcom.x + iforcom.width / 2;
                    const iy = iforcom.y + iforcom.height / 2;
                    
                    const dx = bx - ix;
                    const dy = by - iy;
                    const distX = Math.abs(dx);
                    const distY = Math.abs(dy);

                    if (distX < (iforcom.width / 2 + cellW / 2) && 
                        distY < (iforcom.height / 2 + cellH / 2)) {
                        b.hit = true;
                        Body.setStatic(b.body, false);
                        
                        // 進行方向に弾き飛ばす
                        const pushAngle = Math.atan2(dy, dx);
                        const forceMag = 0.12 + Math.random() * 0.08;
                        Body.applyForce(b.body, b.body.position, {
                            x: Math.cos(pushAngle) * forceMag + iforcom.vx * 0.008,
                            y: Math.sin(pushAngle) * forceMag + iforcom.vy * 0.008
                        });
                        Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.5);
                    }
                });
            });

            // 物理演算更新
            Engine.update(engine, 1000 / 60);

            // DOM位置更新
            blocks.forEach(b => {
                const pos = b.body.position;
                const angle = b.body.angle;
                b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
            });

            // 終了判定（全てのIFORCOMが画面外に出たか）
            const allOut = iforcomList.every(i => {
                if (!i.active) return false;
                return i.x < -500 || i.x > width + 500 || i.y < -500 || i.y > height + 500;
            });

            if (!allOut && elapsed < 5000) {
                requestAnimationFrame(updatePhysics);
            } else {
                isRunning = false;
                // 残りの物理演算
                let extraFrames = 60;
                function continuePhysics() {
                    Engine.update(engine, 1000 / 60);
                    blocks.forEach(b => {
                        const pos = b.body.position;
                        const angle = b.body.angle;
                        b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${angle}rad)`;
                    });
                    extraFrames--;
                    if (extraFrames > 0) {
                        requestAnimationFrame(continuePhysics);
                    } else {
                        gsap.to(blocksContainer, {
                            opacity: 0,
                            duration: 0.4,
                            onComplete: () => {
                                World.clear(engine.world);
                                Engine.clear(engine);
                                blocksContainer.innerHTML = '';
                                blocksContainer.style.opacity = '1';
                                gsap.set(current, { x: 0, y: 0, opacity: 1 });
                                finishAnimation(current);
                            }
                        });
                    }
                }
                continuePhysics();
            }
        }

        const tl = gsap.timeline();

        tl.call(() => {
            blocksContainer.style.opacity = '1';
            blocks.forEach(b => b.element.style.opacity = '1');
            gsap.set(current, { opacity: 0 });
        })
        .to({}, { duration: 0.2 })
        .call(() => {
            requestAnimationFrame(updatePhysics);
        })
        .call(() => {
            gsap.set(next, { opacity: 1, scale: 0.95 });
            gsap.to(next, { scale: 1, duration: 0.4, ease: "power2.out" });
        }, null, "+=2.5");
    }
};

// エフェクト定義
const collapseEffectDefinitions = {
    'collapse': { name: '🧱 崩壊', category: 'special' },
    'collapsePhysics': { name: '🎮 物理崩壊', category: 'special' },
    'iforcomSweep': { name: '💨 IFORCOMスイープ', category: 'special' },
    'iforcomBounce': { name: '🐸 IFORCOMバウンス', category: 'special' },
    'iforcomChaos': { name: '🌀 IFORCOMカオス', category: 'special' }
};
