/**
 * エレメントスワップエフェクト
 * HTML要素を個別に弾き飛ばして入れ替える
 */
async function effect_elementSwap(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const currentIframe = current.querySelector('iframe');
    const nextIframe = next.querySelector('iframe');
    
    let currentCanvas = null;
    let nextCanvas = null;

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 1 });
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        if (typeof window.captureIframeCanvas === 'function') {
            currentCanvas = await window.captureIframeCanvas(currentIframe, width, height);
            nextCanvas = await window.captureIframeCanvas(nextIframe, width, height);
        }
    } catch (e) {}

    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 0 });

    const cols = 6;
    const rows = 4;
    const cellW = width / cols;
    const cellH = height / rows;
    const totalCells = cols * rows;

    const currentBlocks = [];
    const nextBlocks = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * cellW;
            const y = row * cellH;
            const index = row * cols + col;

            const currentBlock = document.createElement('div');
            currentBlock.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; width: ${cellW}px; height: ${cellH}px; overflow: hidden; z-index: 10;`;
            if (currentCanvas) {
                const blockCanvas = document.createElement('canvas');
                blockCanvas.width = Math.ceil(cellW);
                blockCanvas.height = Math.ceil(cellH);
                blockCanvas.style.width = '100%';
                blockCanvas.style.height = '100%';
                const bctx = blockCanvas.getContext('2d');
                bctx.drawImage(
                    currentCanvas,
                    x,
                    y,
                    cellW,
                    cellH,
                    0,
                    0,
                    blockCanvas.width,
                    blockCanvas.height
                );
                currentBlock.appendChild(blockCanvas);
            } else {
                currentBlock.style.background = `hsl(${index * 15}, 60%, 50%)`;
            }
            blocksContainer.appendChild(currentBlock);
            currentBlocks.push({ element: currentBlock, x, y, col, row });

            const nextBlock = document.createElement('div');
            const directions = ['top', 'bottom', 'left', 'right'];
            const dir = directions[Math.floor(Math.random() * 4)];
            let startX = x, startY = y;
            
            switch (dir) {
                case 'top': startY = -cellH - 50; break;
                case 'bottom': startY = height + 50; break;
                case 'left': startX = -cellW - 50; break;
                case 'right': startX = width + 50; break;
            }

            nextBlock.style.cssText = `position: absolute; left: ${startX}px; top: ${startY}px; width: ${cellW}px; height: ${cellH}px; overflow: hidden; z-index: 5;`;
            if (nextCanvas) {
                const blockCanvas = document.createElement('canvas');
                blockCanvas.width = Math.ceil(cellW);
                blockCanvas.height = Math.ceil(cellH);
                blockCanvas.style.width = '100%';
                blockCanvas.style.height = '100%';
                const bctx = blockCanvas.getContext('2d');
                bctx.drawImage(
                    nextCanvas,
                    x,
                    y,
                    cellW,
                    cellH,
                    0,
                    0,
                    blockCanvas.width,
                    blockCanvas.height
                );
                nextBlock.appendChild(blockCanvas);
            } else {
                nextBlock.style.background = `hsl(${index * 15 + 180}, 60%, 50%)`;
            }
            blocksContainer.appendChild(nextBlock);
            nextBlocks.push({ element: nextBlock, x, y, startX, startY, dir });
        }
    }

    blocksContainer.style.opacity = '1';

    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const tl = gsap.timeline();

    indices.forEach((idx, order) => {
        const delay = order * 0.05;
        const curr = currentBlocks[idx];
        const nxt = nextBlocks[idx];

        let exitX = curr.x, exitY = curr.y;
        switch (nxt.dir) {
            case 'top': exitY = height + 50; break;
            case 'bottom': exitY = -cellH - 50; break;
            case 'left': exitX = width + 50; break;
            case 'right': exitX = -cellW - 50; break;
        }

        tl.to(curr.element, {
            x: exitX - curr.x,
            y: exitY - curr.y,
            rotation: (Math.random() - 0.5) * 60,
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
        }, delay);

        tl.to(nxt.element, {
            left: nxt.x,
            top: nxt.y,
            rotation: 0,
            duration: 0.35,
            ease: "back.out(1.2)"
        }, delay + 0.1);
    });

    tl.call(() => {
        gsap.set(next, { opacity: 1 });
        blocksContainer.innerHTML = '';
        gsap.set(current, { opacity: 1 });
        finishAnimation(current);
    }, null, "+=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('elementSwap', effect_elementSwap, { name: 'スワップ', category: 'special' });
}
