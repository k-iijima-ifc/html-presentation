/**
 * IFORCOMスイープエフェクト
 * Matter.js物理演算版（重力あり・衝突あり）
 */
async function effect_iforcomSweep(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;
    const engine = Engine.create();
    engine.world.gravity.y = 0.8;

    const currentIframe = current.querySelector('iframe');
    let capturedCanvas = null;
    
    try {
        if (typeof window.captureIframeCanvas === 'function') {
            capturedCanvas = await window.captureIframeCanvas(currentIframe, width, height);
        }
    } catch (e) {}

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });

    const cols = 12, rows = 8;
    const cellW = width / cols, cellH = height / rows;
    const blocks = [];

    const floor = Bodies.rectangle(width / 2, height + 25, width * 2, 50, { isStatic: true, friction: 0.5 });
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height * 2, { isStatic: true });
    World.add(engine.world, [floor, leftWall, rightWall]);

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
            } else {
                block.style.background = `hsl(${(row * cols + col) * 4}, 60%, 45%)`;
            }
            blocksContainer.appendChild(block);

            const body = Bodies.rectangle(centerX, centerY, cellW * 0.95, cellH * 0.95, {
                isStatic: true, restitution: 0.6, friction: 0.3
            });
            World.add(engine.world, body);
            blocks.push({ element: block, body, cellW, cellH, hit: false });
        }
    }

    const iforcomObj = document.createElement('div');
    iforcomObj.textContent = 'IFORCOM';
    iforcomObj.style.cssText = `position:absolute;left:-500px;top:50%;transform:translateY(-50%);font-size:100px;font-weight:900;font-family:'Arial Black',Impact,sans-serif;color:transparent;-webkit-text-stroke:3px #00ffff;text-shadow:0 0 20px #00ffff,0 0 40px #00ffff,0 0 60px #ff00ff;white-space:nowrap;z-index:200;`;
    blocksContainer.appendChild(iforcomObj);

    const iforcomWidth = 480, iforcomHeight = 100;
    const iforcomBody = Bodies.rectangle(-iforcomWidth / 2, height / 2, iforcomWidth, iforcomHeight, { isStatic: true });
    World.add(engine.world, iforcomBody);

    let iforcomX = -iforcomWidth;
    const iforcomSpeed = 8;

    function updatePhysics() {
        iforcomX += iforcomSpeed;
        Body.setPosition(iforcomBody, { x: iforcomX + iforcomWidth / 2, y: height / 2 });
        iforcomObj.style.left = iforcomX + 'px';

        blocks.forEach(b => {
            if (b.hit) return;
            const bx = b.body.position.x, by = b.body.position.y;
            const ix = iforcomBody.position.x;
            if (Math.abs(bx - ix) < (iforcomWidth / 2 + cellW / 2) && Math.abs(by - height / 2) < (iforcomHeight / 2 + cellH / 2)) {
                b.hit = true;
                Body.setStatic(b.body, false);
                const angle = Math.atan2(by - height / 2, bx - ix);
                Body.applyForce(b.body, b.body.position, { x: Math.cos(angle) * 0.15, y: Math.sin(angle) * 0.15 - 0.05 });
            }
        });

        Matter.Engine.update(engine, 1000 / 60);

        blocks.forEach(b => {
            const pos = b.body.position;
            b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${b.body.angle}rad)`;
        });

        if (iforcomX < width + 200) {
            requestAnimationFrame(updatePhysics);
        } else {
            let extraFrames = 120;
            function continuePhysics() {
                Matter.Engine.update(engine, 1000 / 60);
                blocks.forEach(b => {
                    const pos = b.body.position;
                    b.element.style.transform = `translate(${pos.x - cellW / 2}px, ${pos.y - cellH / 2}px) rotate(${b.body.angle}rad)`;
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
    .to({}, { duration: 0.3 })
    .call(() => updatePhysics())
    .call(() => {
        gsap.set(next, { opacity: 1, scale: 0.95 });
        gsap.to(next, { scale: 1, duration: 0.4, ease: "power2.out" });
    }, null, "+=1.8");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('iforcomSweep', effect_iforcomSweep, { name: 'IFORCOMスイープ', category: 'iforcom' });
}
