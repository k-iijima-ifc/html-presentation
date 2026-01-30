// 3Dエフェクト
const effects3D = {
    flip: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationY: -180, opacity: 1 });
        gsap.timeline()
            .to(current, { rotationY: 180, duration: 0.8, ease: "power2.inOut" })
            .to(next, { rotationY: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationY: 0 }); container.classList.remove('flip-container'); }}, "-=0.8");
    },

    flipX: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationX: -180, opacity: 1 });
        gsap.timeline()
            .to(current, { rotationX: 180, duration: 0.8, ease: "power2.inOut" })
            .to(next, { rotationX: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationX: 0 }); container.classList.remove('flip-container'); }}, "-=0.8");
    },

    cube: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationY: -90, x: '50%', transformOrigin: 'left center', opacity: 1 });
        gsap.timeline()
            .to(current, { rotationY: 90, x: '-50%', transformOrigin: 'right center', duration: 0.8, ease: "power2.inOut" })
            .to(next, { rotationY: 0, x: '0%', duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationY: 0, x: 0, transformOrigin: 'center center' }); container.classList.remove('flip-container'); }}, "-=0.8");
    },

    fold: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationY: -90, transformOrigin: 'left center', opacity: 1 });
        gsap.timeline()
            .to(current, { rotationY: 90, transformOrigin: 'right center', duration: 0.7, ease: "power2.in" })
            .to(next, { rotationY: 0, duration: 0.7, ease: "power2.out", onComplete: () => { finishAnimation(current, { rotationY: 0, transformOrigin: 'center center' }); container.classList.remove('flip-container'); }}, "-=0.2");
    },

    // 紙巻き取りエフェクト - Three.jsで本格的な巻き取り
    paperRoll: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // 遷移先を先に表示
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });

        // 現在のiframeをキャプチャ
        const currentIframe = current.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
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

        // Three.jsセットアップ
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        blocksContainer.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = 'position: absolute; top: 0; left: 0;';

        // テクスチャ
        const texture = new THREE.CanvasTexture(capturedImage);
        texture.needsUpdate = true;

        // 平面のサイズ
        const aspect = width / height;
        const planeWidth = 5 * aspect;
        const planeHeight = 5;

        // 高解像度メッシュ（巻き取り変形用）
        const segments = 150;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, 1);
        // MeshBasicMaterialでライティングの影響を受けず明るく表示
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // 巻き取りパラメータ
        const rollRadius = 0.25; // 巻き取り半径（細め）
        let rollProgress = 0;
        const rollSpeed = 0.008;
        let isAnimating = true;

        blocksContainer.style.opacity = '1';

        function animate() {
            if (!isAnimating) return;

            rollProgress += rollSpeed;
            
            // 頂点を変形
            const positions = geometry.attributes.position;
            const uvs = geometry.attributes.uv;
            
            // 巻き取り位置（左端から右へ進む）
            const rollX = -planeWidth / 2 + rollProgress * planeWidth;
            
            // 巻き取りが進むと半径が少し増える
            const currentRadius = rollRadius + rollProgress * 0.15;
            
            for (let i = 0; i < positions.count; i++) {
                const originalX = (uvs.getX(i) - 0.5) * planeWidth;
                const originalY = (uvs.getY(i) - 0.5) * planeHeight;
                
                if (originalX < rollX) {
                    // 巻き取られた部分 - 円柱に巻きつく
                    const distFromRoll = rollX - originalX;
                    const circumference = 2 * Math.PI * currentRadius;
                    const angle = (distFromRoll / circumference) * 2 * Math.PI;
                    
                    // 巻き数を計算
                    const wraps = Math.floor(angle / (2 * Math.PI));
                    const localAngle = angle % (2 * Math.PI);
                    
                    // 巻き重なりで半径が増える
                    const layerRadius = currentRadius + wraps * 0.02;
                    
                    // 円柱座標に変換（巻き取り点を中心に）- 回転方向を反転
                    const newX = rollX - Math.sin(localAngle) * layerRadius - 0.1;
                    const newZ = Math.cos(localAngle) * layerRadius - layerRadius;
                    
                    positions.setX(i, newX);
                    positions.setY(i, originalY);
                    positions.setZ(i, newZ);
                } else {
                    // まだ巻き取られていない部分 - 平面のまま
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
    },

    // 逆巻き取り（奥方向）- Three.jsで本格的な巻き戻し
    paperUnroll: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // まず現在のページをキャプチャしてブロッカーとして表示
        const currentIframe = current.querySelector('iframe');
        let blockerCanvas = document.createElement('canvas');
        blockerCanvas.width = width;
        blockerCanvas.height = height;
        const blockerCtx = blockerCanvas.getContext('2d');
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const tempCanvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                blockerCtx.drawImage(tempCanvas, 0, 0);
            }
        } catch (e) {
            blockerCtx.fillStyle = '#ffffff';
            blockerCtx.fillRect(0, 0, width, height);
        }
        
        // ブロッカーをblocksContainerに配置
        blockerCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 100;';
        blocksContainer.appendChild(blockerCanvas);
        blocksContainer.style.opacity = '1';
        gsap.set(current, { opacity: 0 });

        // 次のiframeキャプチャ（ブロッカーの裏で）
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const nextIframe = next.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = nextIframe.contentDocument || nextIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
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

        gsap.set(next, { opacity: 0 });
        
        // ブロッカーを削除
        blockerCanvas.remove();

        // Three.jsセットアップ
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
        renderer.setSize(width, height);
        blocksContainer.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = 'position: absolute; top: 0; left: 0;';

        // テクスチャ
        const texture = new THREE.CanvasTexture(capturedImage);
        texture.needsUpdate = true;

        // 平面のサイズ
        const aspect = width / height;
        const planeWidth = 5 * aspect;
        const planeHeight = 5;

        // 高解像度メッシュ
        const segments = 150;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // 巻き戻しパラメータ
        const rollRadius = 0.25;
        let rollProgress = 1.0;
        const rollSpeed = 0.008;
        let isAnimating = true;

        // 初期状態：完全に巻かれた状態（右端に集める）
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        const initialRadius = rollRadius + 0.15;
        for (let i = 0; i < positions.count; i++) {
            const originalX = (uvs.getX(i) - 0.5) * planeWidth;
            const originalY = (uvs.getY(i) - 0.5) * planeHeight;
            const distFromRoll = planeWidth / 2 - originalX;
            const circumference = 2 * Math.PI * initialRadius;
            const angle = (distFromRoll / circumference) * 2 * Math.PI;
            const wraps = Math.floor(angle / (2 * Math.PI));
            const localAngle = angle % (2 * Math.PI);
            const layerRadius = initialRadius + wraps * 0.02;
            
            const newX = planeWidth / 2 + Math.sin(localAngle) * layerRadius + 0.1;
            const newZ = Math.cos(localAngle) * layerRadius - layerRadius;
            
            positions.setX(i, newX);
            positions.setY(i, originalY);
            positions.setZ(i, newZ);
        }
        positions.needsUpdate = true;

        function animate() {
            if (!isAnimating) return;

            rollProgress -= rollSpeed;
            
            // 巻き戻し位置（右から左へ展開）
            const rollX = planeWidth / 2 - (1 - rollProgress) * planeWidth;
            const currentRadius = rollRadius + rollProgress * 0.15;
            
            for (let i = 0; i < positions.count; i++) {
                const originalX = (uvs.getX(i) - 0.5) * planeWidth;
                const originalY = (uvs.getY(i) - 0.5) * planeHeight;
                
                if (originalX > rollX) {
                    // まだ巻かれている部分（右側）
                    const distFromRoll = originalX - rollX;
                    const circumference = 2 * Math.PI * currentRadius;
                    const angle = (distFromRoll / circumference) * 2 * Math.PI;
                    
                    const wraps = Math.floor(angle / (2 * Math.PI));
                    const localAngle = angle % (2 * Math.PI);
                    const layerRadius = currentRadius + wraps * 0.02;
                    
                    const newX = rollX + Math.sin(localAngle) * layerRadius + 0.1;
                    const newZ = Math.cos(localAngle) * layerRadius - layerRadius;
                    
                    positions.setX(i, newX);
                    positions.setY(i, originalY);
                    positions.setZ(i, newZ);
                } else {
                    // 展開された部分（左側）
                    positions.setX(i, originalX);
                    positions.setY(i, originalY);
                    positions.setZ(i, 0);
                }
            }
            
            positions.needsUpdate = true;
            geometry.computeVertexNormals();

            renderer.render(scene, camera);

            if (rollProgress > -0.15) {
                requestAnimationFrame(animate);
            } else {
                isAnimating = false;
                
                gsap.to(blocksContainer, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        gsap.set(next, { opacity: 1 });
                        geometry.dispose();
                        material.dispose();
                        texture.dispose();
                        renderer.dispose();
                        blocksContainer.innerHTML = '';
                        blocksContainer.style.opacity = '1';
                        // currentを非表示のままにしてnextを表示
                        finishAnimation(current);
                    }
                });
            }
        }

        requestAnimationFrame(animate);
    },

    // 逆巻き取り（手前方向）- 手前に向かって巻き戻し
    paperUnrollFront: async (current, next, container) => {
        const blocksContainer = document.getElementById('blocksContainer');
        blocksContainer.innerHTML = '';
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // まず現在のページをキャプチャしてブロッカーとして表示
        const currentIframe = current.querySelector('iframe');
        let blockerCanvas = document.createElement('canvas');
        blockerCanvas.width = width;
        blockerCanvas.height = height;
        const blockerCtx = blockerCanvas.getContext('2d');
        
        try {
            const iframeDoc = currentIframe.contentDocument || currentIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const tempCanvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                blockerCtx.drawImage(tempCanvas, 0, 0);
            }
        } catch (e) {
            blockerCtx.fillStyle = '#ffffff';
            blockerCtx.fillRect(0, 0, width, height);
        }
        
        // ブロッカーをblocksContainerに配置
        blockerCanvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 100;';
        blocksContainer.appendChild(blockerCanvas);
        blocksContainer.style.opacity = '1';
        gsap.set(current, { opacity: 0 });

        // 次のiframeキャプチャ（ブロッカーの裏で）
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const nextIframe = next.querySelector('iframe');
        let capturedImage = null;
        
        try {
            const iframeDoc = nextIframe.contentDocument || nextIframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
                const canvas = await html2canvas(iframeDoc.documentElement, {
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
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

        gsap.set(next, { opacity: 0 });
        
        // ブロッカーを削除
        blockerCanvas.remove();

        // Three.jsセットアップ
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
        renderer.setSize(width, height);
        blocksContainer.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = 'position: absolute; top: 0; left: 0;';

        // テクスチャ
        const texture = new THREE.CanvasTexture(capturedImage);
        texture.needsUpdate = true;

        // 平面のサイズ
        const aspect = width / height;
        const planeWidth = 5 * aspect;
        const planeHeight = 5;

        // 高解像度メッシュ
        const segments = 150;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // 巻き戻しパラメータ
        const rollRadius = 0.25;
        let rollProgress = 1.0;
        const rollSpeed = 0.008;
        let isAnimating = true;

        // 初期状態：完全に巻かれた状態（右端に集める、手前方向）
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        const initialRadius = rollRadius + 0.15;
        for (let i = 0; i < positions.count; i++) {
            const originalX = (uvs.getX(i) - 0.5) * planeWidth;
            const originalY = (uvs.getY(i) - 0.5) * planeHeight;
            const distFromRoll = planeWidth / 2 - originalX;
            const circumference = 2 * Math.PI * initialRadius;
            const angle = (distFromRoll / circumference) * 2 * Math.PI;
            const wraps = Math.floor(angle / (2 * Math.PI));
            const localAngle = angle % (2 * Math.PI);
            const layerRadius = initialRadius + wraps * 0.02;
            
            // 手前方向に巻く
            const newX = planeWidth / 2 + Math.sin(localAngle) * layerRadius + 0.1;
            const newZ = -Math.cos(localAngle) * layerRadius + layerRadius;
            
            positions.setX(i, newX);
            positions.setY(i, originalY);
            positions.setZ(i, newZ);
        }
        positions.needsUpdate = true;

        function animate() {
            if (!isAnimating) return;

            rollProgress -= rollSpeed;
            
            // 巻き戻し位置（右から左へ展開）
            const rollX = planeWidth / 2 - (1 - rollProgress) * planeWidth;
            const currentRadius = rollRadius + rollProgress * 0.15;
            
            for (let i = 0; i < positions.count; i++) {
                const originalX = (uvs.getX(i) - 0.5) * planeWidth;
                const originalY = (uvs.getY(i) - 0.5) * planeHeight;
                
                if (originalX > rollX) {
                    // まだ巻かれている部分（右側）- 手前方向
                    const distFromRoll = originalX - rollX;
                    const circumference = 2 * Math.PI * currentRadius;
                    const angle = (distFromRoll / circumference) * 2 * Math.PI;
                    
                    const wraps = Math.floor(angle / (2 * Math.PI));
                    const localAngle = angle % (2 * Math.PI);
                    const layerRadius = currentRadius + wraps * 0.02;
                    
                    const newX = rollX + Math.sin(localAngle) * layerRadius + 0.1;
                    const newZ = -Math.cos(localAngle) * layerRadius + layerRadius;
                    
                    positions.setX(i, newX);
                    positions.setY(i, originalY);
                    positions.setZ(i, newZ);
                } else {
                    // 展開された部分（左側）
                    positions.setX(i, originalX);
                    positions.setY(i, originalY);
                    positions.setZ(i, 0);
                }
            }
            
            positions.needsUpdate = true;
            geometry.computeVertexNormals();

            renderer.render(scene, camera);

            if (rollProgress > -0.15) {
                requestAnimationFrame(animate);
            } else {
                isAnimating = false;
                
                gsap.to(blocksContainer, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        gsap.set(next, { opacity: 1 });
                        geometry.dispose();
                        material.dispose();
                        texture.dispose();
                        renderer.dispose();
                        blocksContainer.innerHTML = '';
                        blocksContainer.style.opacity = '1';
                        // currentを非表示のままにしてnextを表示
                        finishAnimation(current);
                    }
                });
            }
        }

        requestAnimationFrame(animate);
    },

    // 紙巻き取り（手前方向）- 手前に向かって巻く
    paperRollFront: async (current, next, container) => {
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
                    width: width,
                    height: height,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
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
        // MeshBasicMaterialでライティングの影響を受けず明るく表示
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
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
};

// エフェクト定義
const effects3DDefinitions = {
    'flip': { name: 'フリップY', category: '3d' },
    'flipX': { name: 'フリップX', category: '3d' },
    'cube': { name: 'キューブ', category: '3d' },
    'fold': { name: 'フォールド', category: '3d' },
    'paperRoll': { name: '📜 巻き取り(奥)', category: '3d' },
    'paperRollFront': { name: '📜 巻き取り(手前)', category: '3d' },
    'paperUnroll': { name: '📃 巻き戻し(奥)', category: '3d' },
    'paperUnrollFront': { name: '📃 巻き戻し(手前)', category: '3d' }
};
