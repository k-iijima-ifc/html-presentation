/**
 * 物理エンジン版崩壊エフェクト
 * Matter.jsでリアルな物理挙動（不規則形状）
 */
async function effect_collapsePhysics(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

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

    // グリッドベースでランダム点を生成
    const gridCols = 7, gridRows = 5;
    const cellW = width / gridCols, cellH = height / gridRows;
    const points = [];
    
    for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
            points.push({
                x: cellW * gx + cellW * (0.2 + Math.random() * 0.6),
                y: cellH * gy + cellH * (0.2 + Math.random() * 0.6)
            });
        }
    }

    // Matter.js セットアップ
    const Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;
    const engine = Engine.create();
    engine.world.gravity.y = 2;

    const blocks = [];
    const cols = 6, rows = 5;
    const bw = width / cols, bh = height / rows;

    // ブロック生成
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * bw, y = row * bh;
            const centerX = x + bw / 2, centerY = y + bh / 2;

            const block = document.createElement('div');
            block.className = 'falling-block';
            block.style.width = bw + 'px';
            block.style.height = bh + 'px';
            block.style.left = x + 'px';
            block.style.top = y + 'px';
            block.style.opacity = '0';

            if (capturedImage) {
                block.style.backgroundImage = `url(${capturedImage})`;
                block.style.backgroundSize = `${width}px ${height}px`;
                block.style.backgroundPosition = `-${x}px -${y}px`;
            } else {
                block.style.background = `hsl(${(row * cols + col) * 12}, 60%, 45%)`;
            }
            
            blocksContainer.appendChild(block);

            const body = Bodies.rectangle(centerX, centerY, bw * 0.8, bh * 0.8, {
                isStatic: true, restitution: 0.4, friction: 0.4, frictionAir: 0.02
            });
            World.add(engine.world, body);
            blocks.push({ element: block, body, bw, bh });
        }
    }

    // 床と壁
    const floor = Bodies.rectangle(width / 2, height + 30, width * 2, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height * 3, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height * 3, { isStatic: true });
    World.add(engine.world, [floor, leftWall, rightWall]);

    let animationId, frameCount = 0;
    const maxFrames = 360;

    function updatePhysics() {
        Matter.Engine.update(engine, 1000 / 60);

        blocks.forEach(b => {
            const pos = b.body.position;
            const angle = b.body.angle;
            b.element.style.left = (pos.x - b.bw / 2) + 'px';
            b.element.style.top = (pos.y - b.bh / 2) + 'px';
            b.element.style.transform = `rotate(${angle}rad)`;
        });

        frameCount++;

        if (frameCount > 220) {
            const fadeProgress = (frameCount - 220) / 140;
            blocks.forEach(b => b.element.style.opacity = Math.max(0, 1 - fadeProgress));
        }

        if (frameCount < maxFrames) {
            animationId = requestAnimationFrame(updatePhysics);
        } else {
            cancelAnimationFrame(animationId);
            World.clear(engine.world);
            Matter.Engine.clear(engine);
            blocksContainer.innerHTML = '';
            gsap.set(current, { x: 0, y: 0, opacity: 1 });
            finishAnimation(current);
        }
    }

    const tl = gsap.timeline();

    tl.to(current, { x: gsap.utils.random(-6, 6), y: gsap.utils.random(-4, 4), duration: 0.04, repeat: 20, yoyo: true })
    .call(() => {
        blocksContainer.style.opacity = '1';
        blocks.forEach(b => b.element.style.opacity = '1');
        gsap.set(current, { opacity: 0, x: 0, y: 0 });
    })
    .to(blocks.map(b => b.element), { scale: 0.97, duration: 0.15, stagger: { from: "random", amount: 0.1 } })
    .call(() => {
        const shuffled = [...blocks].sort(() => Math.random() - 0.5);
        shuffled.forEach((b, i) => {
            setTimeout(() => {
                Body.setStatic(b.body, false);
                Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 8, y: Math.random() * -5 });
                Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.3);
            }, i * 25 + Math.random() * 30);
        });
        updatePhysics();
    })
    .call(() => {
        gsap.set(next, { opacity: 1, y: -30 });
        gsap.to(next, { y: 0, duration: 0.4, ease: "power2.out" });
    }, null, "+=1.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('collapsePhysics', effect_collapsePhysics, { name: '💥物理崩壊', category: 'collapse' });
}
