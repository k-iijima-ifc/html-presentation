/**
 * 紙巻き取りエフェクト（手前方向）
 * Three.jsで手前に向かって巻く
 */
async function effect_paperRollFront(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 1 });

    const currentIframe = current.querySelector('iframe');
    let capturedImage = null;
    
    try {
        const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
            const canvas = await html2canvas(iframeDoc.documentElement, {
                width, height, scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
            capturedImage = canvas;
        }
    } catch (e) {
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

    gsap.set(current, { opacity: 0 });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    blocksContainer.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position: absolute; top: 0; left: 0;';

    const texture = new THREE.CanvasTexture(capturedImage);
    texture.needsUpdate = true;

    const aspect = width / height;
    const planeWidth = 5 * aspect;
    const planeHeight = 5;

    const segments = 150;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const rollRadius = 0.25;
    let rollProgress = 0;
    const rollSpeed = 0.008;
    let isAnimating = true;

    blocksContainer.style.opacity = '1';

    function animate() {
        if (!isAnimating) return;

        rollProgress += rollSpeed;
        
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        const rollX = -planeWidth / 2 + rollProgress * planeWidth;
        const currentRadius = rollRadius + rollProgress * 0.15;
        
        for (let i = 0; i < positions.count; i++) {
            const originalX = (uvs.getX(i) - 0.5) * planeWidth;
            const originalY = (uvs.getY(i) - 0.5) * planeHeight;
            
            if (originalX < rollX) {
                const distFromRoll = rollX - originalX;
                const circumference = 2 * Math.PI * currentRadius;
                const angle = (distFromRoll / circumference) * 2 * Math.PI;
                const wraps = Math.floor(angle / (2 * Math.PI));
                const localAngle = angle % (2 * Math.PI);
                const layerRadius = currentRadius + wraps * 0.02;
                
                // 手前方向に巻く（Z正方向）
                const newX = rollX - Math.sin(localAngle) * layerRadius - 0.1;
                const newZ = -Math.cos(localAngle) * layerRadius + layerRadius;
                
                positions.setX(i, newX);
                positions.setY(i, originalY);
                positions.setZ(i, newZ);
            } else {
                positions.setX(i, originalX);
                positions.setY(i, originalY);
                positions.setZ(i, 0);
            }
        }
        
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        renderer.render(scene, camera);

        if (rollProgress < 1.15) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            gsap.to(blocksContainer, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    geometry.dispose();
                    material.dispose();
                    texture.dispose();
                    renderer.dispose();
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
    effectRegistry.register('paperRollFront', effect_paperRollFront, { name: '📜巻き取り(手前)', category: '3d' });
}
