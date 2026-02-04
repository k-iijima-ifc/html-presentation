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
    let capturedCanvas = null;

    try {
        if (typeof window.captureIframeCanvas === 'function') {
            capturedCanvas = await window.captureIframeCanvas(currentIframe, width, height);
        }
    } catch (e) {
        capturedCanvas = null;
    }

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });

    // ブロック生成
    const cols = 10, rows = 6;
    const cellW = width / cols, cellH = height / rows;
    const blocks = [];

    const floor = Bodies.rectangle(width / 2, height + 25, width * 3, 50, { isStatic: true, friction: 0.6, restitution: 0.2 });
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 1500, height / 2, 50, height * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -25, width * 2, 50, { isStatic: true });
    World.add(engine.world, [floor, leftWall, rightWall, ceiling]);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * cellW, y = row * cellH;
            const centerX = x + cellW / 2, centerY = y + cellH / 2;
            
            const block = document.createElement('div');
            block.className = 'falling-block';
            block.style.cssText = `width:${cellW}px;height:${cellH}px;left:0;top:0;opacity:0;`;
            if (capturedCanvas) {
                const blockCanvas = document.createElement('canvas');
                blockCanvas.width = Math.ceil(cellW);
                blockCanvas.height = Math.ceil(cellH);
                blockCanvas.style.width = '100%';
                blockCanvas.style.height = '100%';
                const bctx = blockCanvas.getContext('2d');
                bctx.drawImage(
                    capturedCanvas,
                    x,
                    y,
                    cellW,
                    cellH,
                    0,
                    0,
                    blockCanvas.width,
                    blockCanvas.height
                );
                block.appendChild(blockCanvas);
                block.style.outline = '1px solid rgba(0, 0, 0, 0.08)';
            } else {
                const shade = 245 + Math.round((x / width + y / height) * 5);
                block.style.background = `rgb(${shade}, ${shade}, ${shade})`;
                block.style.border = '1px solid #e5e7eb';
            }
            blocksContainer.appendChild(block);

            const body = Bodies.rectangle(centerX, centerY, cellW * 0.95, cellH * 0.95, {
                isStatic: true,
                restitution: 0.9,
                friction: 0.15,
                frictionAir: 0.01,
                mass: 1.2
            });
            World.add(engine.world, body);
            blocks.push({ element: block, body, cellW, cellH, hit: false });
        }
    }

    // IFORCOM文字を個別に生成（鎖は見えない）
    const letters = 'IFORCOM'.split('');
    const letterElements = [];
    const letterBodies = [];
    const letterStates = [];
    const letterSize = 80;
    const letterGap = 6;
    const baseY = height - cellH * 0.6;
    const letterStyle = `
        position: absolute;
        left: 0;
        top: 0;
        font-size: ${letterSize}px;
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
        will-change: transform;
    `;

    let cursorX = -320;
    letters.forEach(letter => {
        const el = document.createElement('div');
        el.textContent = letter;
        el.style.cssText = `${letterStyle}visibility:hidden;`;
        blocksContainer.appendChild(el);

        const rect = el.getBoundingClientRect();
        const w = rect.width || letterSize * 0.8;
        const h = rect.height || letterSize;

        const body = Bodies.rectangle(cursorX + w / 2, baseY, w, h, {
            restitution: 0.5,
            friction: 0.25,
            frictionAir: 0.01,
            mass: 7
        });
        World.add(engine.world, body);

        letterElements.push(el);
        letterBodies.push({ body, width: w, height: h, element: el });
        letterStates.push({ nextJumpAt: 0 });
        cursorX += w + letterGap;
        el.style.visibility = 'visible';
    });

    // 鎖のアンカーポイント（画面左上から移動）
    let anchorX = -260;
    const anchorY = height - cellH * 0.6;
    const anchorSpeed = 12;

    // 文字同士をつなぐConstraints（鎖は表示しない）
    const constraints = [];

    const anchorConstraint = Constraint.create({
        pointA: { x: anchorX, y: anchorY },
        bodyB: letterBodies[0].body,
        length: 50,
        stiffness: 0.9,
        damping: 0.1
    });
    constraints.push(anchorConstraint);
    World.add(engine.world, anchorConstraint);

    for (let i = 1; i < letterBodies.length; i++) {
        const prev = letterBodies[i - 1];
        const curr = letterBodies[i];
        const linkLength = (prev.width + curr.width) / 2 + letterGap + 4;
        const c = Constraint.create({
            bodyA: prev.body,
            bodyB: curr.body,
            length: linkLength,
            stiffness: 0.85,
            damping: 0.12
        });
        constraints.push(c);
        World.add(engine.world, c);
    }

    function updatePhysics() {
        const now = performance.now();
        const groundY = height - cellH * 0.9;

        // アンカーを右へ移動し、弧を描くように上下させる
        anchorX += anchorSpeed;
        anchorConstraint.pointA.x = anchorX;
        anchorConstraint.pointA.y = anchorY - Math.sin(now * 0.004) * (cellH * 1.2);

        // 文字を弧を描くようにジャンプさせる
        letterBodies.forEach((letter, i) => {
            const state = letterStates[i];
            const pos = letter.body.position;
            if (pos.y > groundY && now >= state.nextJumpAt) {
                const jumpForce = 0.11 + Math.random() * 0.05;
                const forwardForce = 0.035 + Math.random() * 0.02;
                Body.applyForce(letter.body, letter.body.position, {
                    x: forwardForce,
                    y: -jumpForce
                });
                state.nextJumpAt = now + 300 + Math.random() * 220;
            }
        });

        // ブロックとの衝突判定
        blocks.forEach(b => {
            if (b.hit) return;
            const bx = b.body.position.x, by = b.body.position.y;
            // 各文字との衝突
            for (let i = 0; i < letterBodies.length; i++) {
                const letter = letterBodies[i];
                const lx = letter.body.position.x;
                const ly = letter.body.position.y;
                const dx = bx - lx;
                const dy = by - ly;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitRadius = Math.max(letter.width, letter.height) * 0.55 + cellW * 0.6;
                if (dist < hitRadius) {
                    b.hit = true;
                    Body.setStatic(b.body, false);
                    const angle = Math.atan2(dy, dx);
                    const force = 0.95 + Math.random() * 0.5;
                    Body.applyForce(b.body, b.body.position, {
                        x: Math.cos(angle) * force,
                        y: Math.sin(angle) * force - 0.1
                    });
                    Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.9);
                    break;
                }
            }
        });

        // 物理エンジン更新
        Matter.Engine.update(engine, 1000 / 60);

        // ブロック位置更新 + 近傍への連鎖的な弾き
        blocks.forEach(b => {
            const pos = b.body.position;
            b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${b.body.angle}rad)`;

            if (!b.hit) return;
            const speed = Math.hypot(b.body.velocity.x, b.body.velocity.y);
            if (speed < 2.2) return;

            for (let i = 0; i < blocks.length; i++) {
                const other = blocks[i];
                if (other.hit) continue;
                const dx = other.body.position.x - pos.x;
                const dy = other.body.position.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < Math.max(cellW, cellH) * 0.95) {
                    other.hit = true;
                    Body.setStatic(other.body, false);
                    const angle = Math.atan2(dy, dx);
                    const rippleForce = 0.35 + Math.random() * 0.2;
                    Body.applyForce(other.body, other.body.position, {
                        x: Math.cos(angle) * rippleForce,
                        y: Math.sin(angle) * rippleForce - 0.05
                    });
                    Body.setAngularVelocity(other.body, (Math.random() - 0.5) * 0.6);
                }
            }
        });

        // 文字位置更新
        letterBodies.forEach(letter => {
            const pos = letter.body.position;
            letter.element.style.transform = `translate(${pos.x - letter.width / 2}px, ${pos.y - letter.height / 2}px) rotate(${letter.body.angle}rad)`;
        });

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
                letterBodies.forEach(letter => {
                    const pos = letter.body.position;
                    letter.element.style.transform = `translate(${pos.x - letter.width / 2}px, ${pos.y - letter.height / 2}px) rotate(${letter.body.angle}rad)`;
                });
                
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
        name: 'IFORCOMチェーン', 
        category: 'iforcom' 
    });
}
