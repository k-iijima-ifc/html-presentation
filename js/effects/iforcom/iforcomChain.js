/**
 * IFORCOMチェーンバウンドエフェクト
 * 鎖につながったIFORCOMがバウンドしながら左から右へ移動し、ブロックを蹴散らす
 */
async function effect_iforcomChain(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;
    const Constraint = Matter.Constraint, Composite = Matter.Composite;
    const engine = Engine.create();
    engine.world.gravity.y = 1.2;

    const currentIframe = current.querySelector('iframe');
    let capturedImage = null;
    
    try {
        const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
            const canvas = await html2canvas(iframeDoc.documentElement, {
                width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
            capturedImage = canvas.toDataURL('image/png');
        }
    } catch (e) {}

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });

    // ブロック生成
    const cols = 10, rows = 6;
    const cellW = width / cols, cellH = height / rows;
    const blocks = [];

    const floor = Bodies.rectangle(width / 2, height + 25, width * 3, 50, { isStatic: true, friction: 0.8, restitution: 0.3 });
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 500, height / 2, 50, height * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -25, width * 2, 50, { isStatic: true });
    World.add(engine.world, [floor, leftWall, rightWall, ceiling]);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * cellW, y = row * cellH;
            const centerX = x + cellW / 2, centerY = y + cellH / 2;
            
            const block = document.createElement('div');
            block.className = 'falling-block';
            block.style.cssText = `width:${cellW}px;height:${cellH}px;left:0;top:0;opacity:0;`;
            if (capturedImage) {
                block.style.backgroundImage = `url(${capturedImage})`;
                block.style.backgroundSize = `${width}px ${height}px`;
                block.style.backgroundPosition = `-${x}px -${y}px`;
            } else {
                block.style.background = `hsl(${(row * cols + col) * 6}, 60%, 45%)`;
            }
            blocksContainer.appendChild(block);

            const body = Bodies.rectangle(centerX, centerY, cellW * 0.95, cellH * 0.95, {
                isStatic: true, restitution: 0.5, friction: 0.4
            });
            World.add(engine.world, body);
            blocks.push({ element: block, body, cellW, cellH, hit: false });
        }
    }

    // IFORCOMテキストオブジェクト
    const iforcomObj = document.createElement('div');
    iforcomObj.textContent = 'IFORCOM';
    iforcomObj.style.cssText = `
        position: absolute;
        left: -400px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 80px;
        font-weight: 900;
        font-family: 'Arial Black', Impact, sans-serif;
        color: #ff3366;
        text-shadow: 
            0 0 10px #ff3366,
            0 0 20px #ff3366,
            0 0 40px #ff0066,
            3px 3px 0 #000,
            -1px -1px 0 #000;
        white-space: nowrap;
        z-index: 200;
    `;
    blocksContainer.appendChild(iforcomObj);

    // 鎖のリンクを描画するキャンバス
    const chainCanvas = document.createElement('canvas');
    chainCanvas.width = width;
    chainCanvas.height = height;
    chainCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:150;pointer-events:none;';
    blocksContainer.appendChild(chainCanvas);
    const chainCtx = chainCanvas.getContext('2d');

    // IFORCOM物理ボディ（バウンドする）
    const iforcomWidth = 350, iforcomHeight = 80;
    const iforcomBody = Bodies.rectangle(-200, height * 0.3, iforcomWidth, iforcomHeight, {
        restitution: 0.7,  // バウンド力
        friction: 0.3,
        frictionAir: 0.01,
        mass: 50
    });
    World.add(engine.world, iforcomBody);

    // 鎖のアンカーポイント（画面左上から移動）
    let anchorX = -300;
    const anchorY = -50;
    const anchorSpeed = 6;

    // 鎖のリンク（複数のボディをConstraintで接続）
    const chainLinks = [];
    const numLinks = 8;
    const linkLength = 30;
    
    for (let i = 0; i < numLinks; i++) {
        const link = Bodies.circle(-250 + i * linkLength, anchorY + i * 20, 8, {
            restitution: 0.3,
            friction: 0.5,
            mass: 2
        });
        chainLinks.push(link);
        World.add(engine.world, link);
    }

    // 鎖のConstraints
    const constraints = [];
    
    // アンカーから最初のリンクへ（動的に更新）
    const anchorConstraint = Constraint.create({
        pointA: { x: anchorX, y: anchorY },
        bodyB: chainLinks[0],
        length: linkLength,
        stiffness: 0.9,
        damping: 0.1
    });
    constraints.push(anchorConstraint);
    World.add(engine.world, anchorConstraint);

    // リンク同士の接続
    for (let i = 0; i < numLinks - 1; i++) {
        const c = Constraint.create({
            bodyA: chainLinks[i],
            bodyB: chainLinks[i + 1],
            length: linkLength,
            stiffness: 0.9,
            damping: 0.1
        });
        constraints.push(c);
        World.add(engine.world, c);
    }

    // 最後のリンクからIFORCOMへ
    const iforcomConstraint = Constraint.create({
        bodyA: chainLinks[numLinks - 1],
        bodyB: iforcomBody,
        pointB: { x: -iforcomWidth / 2 + 20, y: 0 },
        length: linkLength,
        stiffness: 0.8,
        damping: 0.1
    });
    World.add(engine.world, iforcomConstraint);

    // 鎖を描画する関数
    function drawChain() {
        chainCtx.clearRect(0, 0, width, height);
        
        // 鎖のリンクを描画
        chainCtx.strokeStyle = '#666';
        chainCtx.lineWidth = 6;
        chainCtx.lineCap = 'round';
        chainCtx.shadowColor = '#333';
        chainCtx.shadowBlur = 3;
        
        // アンカーから最初のリンクへ
        chainCtx.beginPath();
        chainCtx.moveTo(anchorX, anchorY);
        
        chainLinks.forEach((link, i) => {
            chainCtx.lineTo(link.position.x, link.position.y);
        });
        
        // IFORCOMへ
        chainCtx.lineTo(
            iforcomBody.position.x - iforcomWidth / 2 + 20,
            iforcomBody.position.y
        );
        chainCtx.stroke();

        // リンクの丸い部分
        chainCtx.fillStyle = '#888';
        chainCtx.shadowBlur = 0;
        chainLinks.forEach(link => {
            chainCtx.beginPath();
            chainCtx.arc(link.position.x, link.position.y, 10, 0, Math.PI * 2);
            chainCtx.fill();
            chainCtx.strokeStyle = '#555';
            chainCtx.lineWidth = 2;
            chainCtx.stroke();
        });

        // アンカーポイント
        chainCtx.fillStyle = '#444';
        chainCtx.beginPath();
        chainCtx.arc(anchorX, anchorY, 15, 0, Math.PI * 2);
        chainCtx.fill();
    }

    function updatePhysics() {
        // アンカーを右へ移動
        anchorX += anchorSpeed;
        anchorConstraint.pointA.x = anchorX;

        // ブロックとの衝突判定
        blocks.forEach(b => {
            if (b.hit) return;
            const bx = b.body.position.x, by = b.body.position.y;
            const ix = iforcomBody.position.x, iy = iforcomBody.position.y;
            
            // IFORCOMとの衝突
            if (Math.abs(bx - ix) < (iforcomWidth / 2 + cellW / 2) && 
                Math.abs(by - iy) < (iforcomHeight / 2 + cellH / 2)) {
                b.hit = true;
                Body.setStatic(b.body, false);
                const angle = Math.atan2(by - iy, bx - ix);
                const force = 0.2 + Math.random() * 0.1;
                Body.applyForce(b.body, b.body.position, {
                    x: Math.cos(angle) * force,
                    y: Math.sin(angle) * force - 0.05
                });
                Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.3);
            }

            // 鎖リンクとの衝突
            chainLinks.forEach(link => {
                const lx = link.position.x, ly = link.position.y;
                const dist = Math.sqrt((bx - lx) ** 2 + (by - ly) ** 2);
                if (dist < cellW / 2 + 15) {
                    b.hit = true;
                    Body.setStatic(b.body, false);
                    const angle = Math.atan2(by - ly, bx - lx);
                    Body.applyForce(b.body, b.body.position, {
                        x: Math.cos(angle) * 0.08,
                        y: Math.sin(angle) * 0.08
                    });
                }
            });
        });

        // 物理エンジン更新
        Matter.Engine.update(engine, 1000 / 60);

        // ブロック位置更新
        blocks.forEach(b => {
            const pos = b.body.position;
            b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${b.body.angle}rad)`;
        });

        // IFORCOM位置更新
        iforcomObj.style.left = (iforcomBody.position.x - iforcomWidth / 2) + 'px';
        iforcomObj.style.top = (iforcomBody.position.y - iforcomHeight / 2) + 'px';
        iforcomObj.style.transform = `rotate(${iforcomBody.angle}rad)`;

        // 鎖描画
        drawChain();

        if (anchorX < width + 400) {
            requestAnimationFrame(updatePhysics);
        } else {
            // 終了処理
            let extraFrames = 90;
            function continuePhysics() {
                Matter.Engine.update(engine, 1000 / 60);
                blocks.forEach(b => {
                    const pos = b.body.position;
                    b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${b.body.angle}rad)`;
                });
                iforcomObj.style.left = (iforcomBody.position.x - iforcomWidth / 2) + 'px';
                iforcomObj.style.top = (iforcomBody.position.y - iforcomHeight / 2) + 'px';
                iforcomObj.style.transform = `rotate(${iforcomBody.angle}rad)`;
                drawChain();
                
                if (--extraFrames > 0) {
                    requestAnimationFrame(continuePhysics);
                } else {
                    gsap.to(blocksContainer, {
                        opacity: 0, duration: 0.5,
                        onComplete: () => {
                            World.clear(engine.world);
                            Matter.Engine.clear(engine);
                            blocksContainer.innerHTML = '';
                            blocksContainer.style.opacity = '1';
                            gsap.set(current, { opacity: 1 });
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
    .call(() => updatePhysics())
    .call(() => {
        gsap.set(next, { opacity: 1, scale: 0.95 });
        gsap.to(next, { scale: 1, duration: 0.4, ease: "power2.out" });
    }, null, "+=2.5");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('iforcomChain', effect_iforcomChain, { 
        name: '⛓️IFORCOMチェーン', 
        category: 'iforcom' 
    });
}
