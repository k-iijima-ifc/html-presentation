/**
 * 砂落ちエフェクト
 * 画面が砂のようにさらさら流れ落ちる
 */
async function effect_sandfall(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const currentIframe = current.querySelector('iframe');
    let capturedImage = null;
    
    try {
        if (typeof window.captureIframeCanvas === 'function') {
            capturedImage = await window.captureIframeCanvas(currentIframe, width, height);
        }
    } catch (e) {}

    if (!capturedImage) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        capturedImage = canvas;
    }

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = width;
    mainCanvas.height = height;
    mainCanvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 10;`;
    blocksContainer.appendChild(mainCanvas);
    blocksContainer.style.opacity = '1';
    
    const ctx = mainCanvas.getContext('2d');
    ctx.drawImage(capturedImage, 0, 0);
    
    const imageData = capturedImage.getContext('2d').getImageData(0, 0, width, height);
    const pixels = imageData.data;

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 1 });
    gsap.set(current, { opacity: 0 });

    const particleSize = 3;
    const cols = Math.ceil(width / particleSize);
    const rows = Math.ceil(height / particleSize);
    
    const particles = [];
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * particleSize;
            const y = row * particleSize;
            
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];
            
            if (a > 0) {
                particles.push({
                    x: x, y: y, vx: 0, vy: 0,
                    color: `rgba(${r},${g},${b},${a/255})`,
                    size: particleSize, activated: false,
                    delay: row * 0.3 + Math.random() * 8, fallen: false
                });
            }
        }
    }

    let startTime = performance.now();
    let isAnimating = true;
    const gravity = 1.2;
    const maxSpeed = 25;

    function animate(currentTime) {
        if (!isAnimating) return;

        const elapsed = (currentTime - startTime) / 1000 * 60;
        ctx.clearRect(0, 0, width, height);
        
        let allFallen = true;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.fallen) continue;
            
            if (!p.activated) {
                if (elapsed > p.delay) {
                    p.activated = true;
                    p.vx = (Math.random() - 0.5) * 3;
                    p.vy = Math.random() * 3;
                } else {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                    allFallen = false;
                    continue;
                }
            }

            allFallen = false;
            p.vy += gravity;
            if (p.vy > maxSpeed) p.vy = maxSpeed;
            p.vx += (Math.random() - 0.5) * 0.8;
            p.vx *= 0.95;
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.y > height + 20) {
                p.fallen = true;
                continue;
            }
            
            ctx.fillStyle = p.color;
            const stretch = Math.min(p.vy * 0.3, 6);
            ctx.fillRect(p.x, p.y, p.size, p.size + stretch);
        }

        if (allFallen || elapsed > 150) {
            isAnimating = false;
            blocksContainer.innerHTML = '';
            gsap.set(current, { opacity: 1 });
            finishAnimation(current);
            return;
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('sandfall', effect_sandfall, { name: '砂落ち', category: 'special' });
}
