/**
 * 水中エフェクト
 * リアルな深海への潜水
 */
async function effect_underwater(current, next, container) {
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
            capturedImage = await html2canvas(iframeDoc.documentElement, {
                width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
        }
    } catch (e) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, width, height);
        capturedImage = canvas;
    }

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = width;
    mainCanvas.height = height;
    mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 5;`;
    blocksContainer.appendChild(mainCanvas);
    const ctx = mainCanvas.getContext('2d');

    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = width;
    bubbleCanvas.height = height;
    bubbleCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 15;`;
    blocksContainer.appendChild(bubbleCanvas);
    const bubbleCtx = bubbleCanvas.getContext('2d');

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 0 });
    blocksContainer.style.opacity = '1';

    const bubbles = [];
    for (let i = 0; i < 80; i++) {
        bubbles.push({
            x: Math.random() * width, y: height + Math.random() * 200,
            radius: 2 + Math.random() * 8, speed: 0.5 + Math.random() * 2,
            wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.01 + Math.random() * 0.02,
            opacity: 0.3 + Math.random() * 0.5
        });
    }

    let startTime = performance.now();
    let isAnimating = true;
    let waterPhase = 0;

    function animate(currentTime) {
        if (!isAnimating) return;

        const elapsed = (currentTime - startTime) / 1000;
        waterPhase += 0.03;
        const depth = Math.min(elapsed / 6, 1);

        ctx.clearRect(0, 0, width, height);
        
        const waveStrength = 2 + depth * 4;
        for (let y = 0; y < height; y += 1) {
            const waveOffset = Math.sin(y * 0.015 + waterPhase) * waveStrength;
            ctx.drawImage(capturedImage, 0, y, width, 1, waveOffset, y, width, 1);
        }

        const blueIntensity = depth * 0.7;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(0, 80, 160, ${blueIntensity * 0.5})`);
        gradient.addColorStop(1, `rgba(0, 20, 60, ${blueIntensity * 0.9})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = `rgba(0, 10, 30, ${depth * 0.5})`;
        ctx.fillRect(0, 0, width, height);

        bubbleCtx.clearRect(0, 0, width, height);
        bubbles.forEach(bubble => {
            bubble.y -= bubble.speed;
            bubble.wobble += bubble.wobbleSpeed;
            const wobbleX = Math.sin(bubble.wobble) * 8;
            
            if (bubble.y < -bubble.radius * 2) {
                bubble.y = height + bubble.radius;
                bubble.x = Math.random() * width;
            }
            
            const bx = bubble.x + wobbleX, by = bubble.y, r = bubble.radius;
            const bubbleGrad = bubbleCtx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
            bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.9})`);
            bubbleGrad.addColorStop(0.4, `rgba(200, 235, 255, ${bubble.opacity * 0.5})`);
            bubbleGrad.addColorStop(1, `rgba(100, 180, 255, 0)`);
            
            bubbleCtx.beginPath();
            bubbleCtx.arc(bx, by, r, 0, Math.PI * 2);
            bubbleCtx.fillStyle = bubbleGrad;
            bubbleCtx.fill();
        });

        if (elapsed < 6) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            gsap.to(blocksContainer, {
                opacity: 0, duration: 0.5,
                onComplete: () => {
                    gsap.set(next, { opacity: 1 });
                    blocksContainer.innerHTML = '';
                    blocksContainer.style.opacity = '1';
                    gsap.set(current, { opacity: 1 });
                    finishAnimation(current);
                }
            });
        }
    }

    requestAnimationFrame(animate);
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('underwater', effect_underwater, { name: '🌊水中', category: 'special' });
}
