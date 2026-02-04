/**
 * 雨・波紋エフェクト（WebGLシェーダ）
 * ぽつぽつ降る雨粒 → 波紋の屈折で画面が揺らぎながら遷移
 */
async function effect_rainRipple(current, next, container) {
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const currentIframe = current.querySelector('iframe');
    let capturedCanvas = null;

    try {
        if (typeof window.captureIframeCanvas === 'function') {
            capturedCanvas = await window.captureIframeCanvas(currentIframe, width, height);
        }
    } catch (e) {}

    if (!capturedCanvas) {
        const fallback = document.createElement('canvas');
        fallback.width = width;
        fallback.height = height;
        const fctx = fallback.getContext('2d');
        const gradient = fctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4b79a1');
        gradient.addColorStop(1, '#283e51');
        fctx.fillStyle = gradient;
        fctx.fillRect(0, 0, width, height);
        capturedCanvas = fallback;
    }

    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { opacity: 0 });

    if (!window.PIXI) {
        gsap.to(next, { opacity: 1, duration: 0.6, onComplete: () => finishAnimation(current) });
        return;
    }

    const app = new PIXI.Application({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    blocksContainer.appendChild(app.view);
    app.view.style.cssText = 'position:absolute;top:0;left:0;z-index:10;';

    const texture = PIXI.Texture.from(capturedCanvas);
    const sprite = new PIXI.Sprite(texture);
    sprite.width = width;
    sprite.height = height;

    const fragment = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uStrength;
        uniform int uRippleCount;
        uniform vec4 uRipples[20];

        void main() {
            vec2 pos = vTextureCoord * uResolution;
            vec2 offset = vec2(0.0);

            for (int i = 0; i < 20; i++) {
                if (i >= uRippleCount) break;
                vec4 r = uRipples[i];
                float t = uTime - r.z;
                if (t < 0.0) continue;

                float speed = 260.0;
                float radius = t * speed;
                float dist = distance(pos, r.xy);
                float band = 36.0;
                if (dist > radius - band && dist < radius + band) {
                    float wave = cos((dist - radius) * 0.18) * exp(-t * 1.1);
                    float falloff = 1.0 / (1.0 + dist * 0.02);
                    vec2 dir = normalize(pos - r.xy);
                    offset += dir * wave * r.w * falloff * 22.0 * uStrength;
                }
            }

            vec2 uv = (pos + offset) / uResolution;
            vec4 color = texture2D(uSampler, uv);
            gl_FragColor = color;
        }
    `;

    const filter = new PIXI.Filter(undefined, fragment, {
        uResolution: new PIXI.Point(width, height),
        uTime: 0,
        uStrength: 0,
        uRippleCount: 0,
        uRipples: new Float32Array(20 * 4)
    });

    sprite.filters = [filter];
    app.stage.addChild(sprite);

    const rainLayer = new PIXI.Graphics();
    app.stage.addChild(rainLayer);

    // ガラス面の水滴（単一シェーダで全水滴を処理、リアルレンズ屈折）
    const dropletSprite = new PIXI.Sprite(texture);
    dropletSprite.width = width;
    dropletSprite.height = height;

    // 水滴用フラグメントシェーダ（不規則な形状：楽円、回転、尾付き）
    const dropletFrag = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform vec2 uResolution;
        uniform int uDropletCount;
        uniform vec4 uDroplets[60]; // x, y, radius, alpha
        uniform vec4 uDropletShape[60]; // aspectX, aspectY, rotation, tailLen

        // 回転行列
        mat2 rotate2D(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = vTextureCoord;
            vec2 pos = uv * uResolution;
            vec4 baseColor = texture2D(uSampler, uv);
            vec4 finalColor = vec4(0.0);
            float totalAlpha = 0.0;

            for (int i = 0; i < 60; i++) {
                if (i >= uDropletCount) break;
                vec4 drop = uDroplets[i];
                vec4 shape = uDropletShape[i];
                vec2 center = drop.xy;
                float radius = drop.z;
                float dropAlpha = drop.w;
                float aspectX = shape.x;
                float aspectY = shape.y;
                float rotation = shape.z;
                float tailLen = shape.w;

                vec2 diff = pos - center;
                // 回転を適用
                diff = rotate2D(-rotation) * diff;
                
                // 重力による下部の膨らみ（しずく形状）
                float bulge = shape.w > 0.0 ? 0.0 : 0.15; // 尾付き以外は下が膨らむ
                float yBulge = 1.0 + bulge * smoothstep(-radius, radius * 0.5, diff.y);
                
                // アスペクト比で楽円化
                vec2 scaled = diff / vec2(aspectX * yBulge, aspectY);
                float dist = length(scaled);

                // 尾の形状（上方向に引く）
                float tailFactor = 0.0;
                if (tailLen > 0.0 && diff.y < 0.0) {
                    float tailProgress = -diff.y / (tailLen * radius);
                    if (tailProgress < 1.0) {
                        // 尾は上に行くほど細くなる
                        float tailWidth = radius * aspectX * (1.0 - tailProgress * 0.7);
                        if (abs(diff.x) < tailWidth) {
                            tailFactor = (1.0 - tailProgress) * (1.0 - abs(diff.x) / tailWidth);
                        }
                    }
                }

                if (dist > radius && tailFactor < 0.01) continue;

                float t = min(dist / radius, 1.0);
                float curve = sqrt(max(0.0, 1.0 - t * t));

                // 尾の部分は浅い曲線
                if (tailFactor > 0.01) {
                    t = 1.0 - tailFactor * 0.5;
                    curve = tailFactor * 0.3;
                }

                // レンズ屈折（上下左右反転効果）
                vec2 lensOffset = -diff * curve * 0.5 / radius;
                vec2 sampleUV = uv + lensOffset * (radius / uResolution.y) * 1.8;
                sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));

                vec4 refractedColor = texture2D(uSampler, sampleUV);

                // ハイライト（左上、回転に応じて位置調整）
                vec2 hlOffset = rotate2D(rotation) * vec2(-radius * 0.3, -radius * 0.35);
                vec2 hlPos = center + hlOffset;
                float hlDist = length(pos - hlPos) / (radius * 0.28);
                float highlight = pow(max(0.0, 1.0 - hlDist), 5.0) * 0.95;

                // セカンダリハイライト（小さめ、シャープ）
                vec2 hl2Offset = rotate2D(rotation) * vec2(radius * 0.15, radius * 0.2);
                vec2 hl2Pos = center + hl2Offset;
                float hl2Dist = length(pos - hl2Pos) / (radius * 0.12);
                float highlight2 = pow(max(0.0, 1.0 - hl2Dist), 6.0) * 0.35;

                vec3 dropColor = refractedColor.rgb;
                dropColor += highlight + highlight2;

                // 中心は透明、エッジで少し見える
                float alpha = (0.65 + curve * 0.3) * dropAlpha;
                alpha *= smoothstep(1.0, 0.7, t);

                finalColor.rgb += dropColor * alpha;
                totalAlpha += alpha;
            }

            if (totalAlpha > 0.001) {
                finalColor.rgb /= totalAlpha;
                finalColor.a = min(1.0, totalAlpha);
                gl_FragColor = mix(baseColor, finalColor, finalColor.a);
            } else {
                discard;
            }
        }
    `;

    const dropletFilter = new PIXI.Filter(undefined, dropletFrag, {
        uResolution: [width, height],
        uDropletCount: 0,
        uDroplets: new Float32Array(60 * 4),
        uDropletShape: new Float32Array(60 * 4)
    });
    dropletSprite.filters = [dropletFilter];
    app.stage.addChild(dropletSprite);

    const dropletData = [];
    const maxDroplets = 60;
    let nextDropletTime = 200;

    function createDroplet() {
        if (dropletData.length >= maxDroplets) return;
        const x = Math.random() * width;
        const y = Math.random() * height;
        // 大小様々な水滴（写真のような分布）
        const sizeRand = Math.random();
        let radius;
        if (sizeRand < 0.6) {
            radius = 2 + Math.random() * 6; // 小さい水滴（多め）
        } else if (sizeRand < 0.9) {
            radius = 8 + Math.random() * 12; // 中くらい
        } else {
            radius = 20 + Math.random() * 18; // 大きい水滴（少なめ）
        }

        // 不規則な形状を生成
        const shapeType = Math.random();
        let aspectX, aspectY, rotation, tailLen;

        if (shapeType < 0.25) {
            // ほぼ円形（下が少し膨らむ）
            aspectX = 0.9 + Math.random() * 0.2;
            aspectY = 0.85 + Math.random() * 0.2;
            rotation = (Math.random() - 0.5) * 0.3;
            tailLen = 0;
        } else if (shapeType < 0.45) {
            // 横長楽円（平たく張り付いた）
            aspectX = 1.2 + Math.random() * 0.5;
            aspectY = 0.65 + Math.random() * 0.25;
            rotation = (Math.random() - 0.5) * 0.4;
            tailLen = 0;
        } else if (shapeType < 0.65) {
            // 縦長（重力で引き伸ばされた）
            aspectX = 0.7 + Math.random() * 0.25;
            aspectY = 1.15 + Math.random() * 0.35;
            rotation = (Math.random() - 0.5) * 0.2;
            tailLen = 0;
        } else {
            // しずく形状（上に尾を引く）
            aspectX = 0.85 + Math.random() * 0.25;
            aspectY = 0.9 + Math.random() * 0.2;
            rotation = (Math.random() - 0.5) * 0.15;
            tailLen = 1.0 + Math.random() * 2.0; // 上方向の尾
        }

        dropletData.push({ 
            x, y, radius, 
            alpha: 0, targetAlpha: 0.6 + Math.random() * 0.35,
            aspectX, aspectY, rotation, tailLen
        });
    }

    const ripples = [];
    const drops = [];
    const maxDrops = 42;
    const startTime = performance.now();
    const duration = 3800;

    function spawnDrop() {
        drops.push({
            x: Math.random() * width,
            y: -30 - Math.random() * height * 0.2,
            vy: 5 + Math.random() * 5,
            len: 26 + Math.random() * 18,
            alpha: 0.5 + Math.random() * 0.25
        });
    }

    function spawnRipple(x, y) {
        if (ripples.length >= 20) ripples.shift();
        ripples.push({ x, y, start: performance.now(), strength: 1.0 });
    }

    app.ticker.add(() => {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (drops.length < maxDrops && Math.random() < 0.5) spawnDrop();

        for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i];
            d.y += d.vy;
            if (d.y > height) {
                spawnRipple(d.x, height - 2 - Math.random() * 20);
                drops.splice(i, 1);
            }
        }

        if (Math.random() < 0.45) {
            spawnRipple(Math.random() * width, height * (0.3 + Math.random() * 0.6));
        }

        const rippleUniforms = filter.uniforms.uRipples;
        for (let i = 0; i < 20; i++) {
            rippleUniforms[i * 4] = 0;
            rippleUniforms[i * 4 + 1] = 0;
            rippleUniforms[i * 4 + 2] = 0;
            rippleUniforms[i * 4 + 3] = 0;
        }

        let activeCount = 0;
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            const age = (now - r.start) / 1000;
            if (age > 2.0) {
                ripples.splice(i, 1);
                continue;
            }
            rippleUniforms[activeCount * 4] = r.x;
            rippleUniforms[activeCount * 4 + 1] = r.y;
            rippleUniforms[activeCount * 4 + 2] = age;
            rippleUniforms[activeCount * 4 + 3] = 1.0;
            activeCount++;
            if (activeCount >= 20) break;
        }

        filter.uniforms.uTime = elapsed / 1000;
        filter.uniforms.uStrength = 0.6 + progress * 1.05;
        filter.uniforms.uRippleCount = activeCount;

        rainLayer.clear();
        rainLayer.lineStyle(2.6, 0xe8f4ff, 0.75);
        for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            rainLayer.moveTo(d.x, d.y);
            rainLayer.lineTo(d.x + d.len * 0.1, d.y + d.len);
        }

        // 水滴を徐々にスポーン＆フェードイン
        if (elapsed > nextDropletTime && dropletData.length < maxDroplets) {
            createDroplet();
            nextDropletTime = elapsed + 40 + Math.random() * 80;
        }

        // 水滴のアルファ更新＆uniform配列に書き込み
        const dropletUniforms = dropletFilter.uniforms.uDroplets;
        const shapeUniforms = dropletFilter.uniforms.uDropletShape;
        for (let i = 0; i < dropletData.length; i++) {
            const d = dropletData[i];
            if (d.alpha < d.targetAlpha) {
                d.alpha = Math.min(d.targetAlpha, d.alpha + 0.02);
            }
            dropletUniforms[i * 4] = d.x;
            dropletUniforms[i * 4 + 1] = d.y;
            dropletUniforms[i * 4 + 2] = d.radius;
            dropletUniforms[i * 4 + 3] = d.alpha;
            // 形状パラメータ
            shapeUniforms[i * 4] = d.aspectX;
            shapeUniforms[i * 4 + 1] = d.aspectY;
            shapeUniforms[i * 4 + 2] = d.rotation;
            shapeUniforms[i * 4 + 3] = d.tailLen;
        }
        dropletFilter.uniforms.uDropletCount = dropletData.length;

        if (progress >= 1) {
            app.ticker.stop();
            gsap.set(next, { opacity: 1 });
            app.destroy(true, { children: true, texture: false, baseTexture: false });
            blocksContainer.innerHTML = '';
            gsap.set(current, { opacity: 1 });
            if (typeof finishAnimation === 'function') {
                finishAnimation(current);
            }
        }
    });
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('rainRipple', effect_rainRipple, {
        name: 'レイン・波紋',
        category: 'special',
        description: '雨粒と波紋で画面が揺らぎながら遷移するエフェクト'
    });
}
