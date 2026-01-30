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
        const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
            capturedCanvas = await html2canvas(iframeDoc.documentElement, {
                width: containerRect.width, height: containerRect.height,
                scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
        }
    } catch (e) {
        try {
            capturedCanvas = await html2canvas(current, {
                width: containerRect.width, height: containerRect.height, scale: 1, backgroundColor: null
            });
        } catch (e2) {}
    }

    let capturedImage = null;
    if (capturedCanvas && capturedCanvas.width > 0) {
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
    effectRegistry.register('collapse', effect_collapse, { name: '💥崩壊', category: 'collapse' });
}
