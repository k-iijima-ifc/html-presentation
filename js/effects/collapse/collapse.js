/**
 * ブロック崩壊エフェクト（GSAP版）
 * 画面をキャプチャしてブロック化、重力で崩す
 */
async function effect_collapse(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const cols = 5;
    const rows = 4;
    const blockWidth = containerRect.width / cols;
    const blockHeight = containerRect.height / rows;

    const currentIframe = current.querySelector('iframe');
    let capturedCanvas = null;
    
    try {
        if (typeof window.captureIframeCanvas === 'function') {
            capturedCanvas = await window.captureIframeCanvas(currentIframe, containerRect.width, containerRect.height);
        }
    } catch (e) {}

    if (!capturedCanvas) {
        try {
            capturedCanvas = await html2canvas(current, {
                width: containerRect.width, height: containerRect.height, scale: 1, backgroundColor: null
            });
        } catch (e2) {}
    }

    const hasCapturedCanvas = capturedCanvas && capturedCanvas.width > 0;

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

            if (hasCapturedCanvas) {
                const blockCanvas = document.createElement('canvas');
                blockCanvas.width = Math.ceil(blockWidth);
                blockCanvas.height = Math.ceil(blockHeight);
                blockCanvas.style.width = '100%';
                blockCanvas.style.height = '100%';
                const bctx = blockCanvas.getContext('2d');
                bctx.drawImage(
                    capturedCanvas,
                    col * blockWidth,
                    row * blockHeight,
                    blockWidth,
                    blockHeight,
                    0,
                    0,
                    blockCanvas.width,
                    blockCanvas.height
                );
                block.appendChild(blockCanvas);
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
        x: gsap.utils.random(-4, 4), y: gsap.utils.random(-3, 3),
        duration: 0.06, repeat: 12, yoyo: true
    })
    .call(() => {
        blocksContainer.style.opacity = '1';
        blocks.forEach(b => b.element.style.opacity = '1');
        gsap.set(current, { opacity: 0, x: 0, y: 0 });
    })
    .to(blocks.map(b => b.element), {
        scale: 0.92, boxShadow: '0 0 15px rgba(0,0,0,0.7)',
        duration: 0.25, stagger: { from: "random", amount: 0.15 }
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
                delay: delay, ease: "power2.in"
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
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('collapse', effect_collapse, { name: '崩壊', category: 'collapse' });
}
