/**
 * 雨・波紋エフェクト（WebGLシェーダ）- PixiJS 8.x対応版
 * ぽつぽつ降る雨粒 → 波紋の屈折で画面が揺らぎながら遷移
 */
import { Application, Sprite, Texture, Filter, GlProgram, Graphics } from 'pixi.js';

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

    // PixiJS 8.x: 非同期初期化
    const app = new Application();
    await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    blocksContainer.appendChild(app.canvas);
    app.canvas.style.cssText = 'position:absolute;top:0;left:0;z-index:10;';

    // Texture.from はロード済みリソースから作成
    const texture = Texture.from(capturedCanvas);
    const sprite = new Sprite(texture);
    sprite.width = width;
    sprite.height = height;

    // PixiJS 8.x: フラグメントシェーダ (WebGL)
    const rippleFragment = `
        precision mediump float;
        in vec2 vTextureCoord;
        out vec4 finalColor;
        uniform sampler2D uTexture;
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
            finalColor = texture(uTexture, uv);
        }
    `;

    // PixiJS 8.x: GlProgram + Filter
    const glProgram = GlProgram.from({
        fragment: rippleFragment,
        vertex: `
            in vec2 aPosition;
            out vec2 vTextureCoord;
            uniform vec4 uInputSize;
            uniform vec4 uOutputFrame;
            uniform vec4 uOutputTexture;

            vec4 filterVertexPosition(void) {
                vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
                return vec4(position, 0.0, 1.0);
            }

            vec2 filterTextureCoord(void) {
                return aPosition * (uOutputFrame.zw * uInputSize.zw);
            }

            void main(void) {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
            }
        `
    });

    const rippleFilter = new Filter({
        glProgram,
        resources: {
            rippleUniforms: {
                uResolution: { value: [width, height], type: 'vec2<f32>' },
                uTime: { value: 0, type: 'f32' },
                uStrength: { value: 0, type: 'f32' },
                uRippleCount: { value: 0, type: 'i32' },
                uRipples: { value: new Float32Array(20 * 4), type: 'vec4<f32>', size: 20 }
            }
        }
    });

    sprite.filters = [rippleFilter];
    app.stage.addChild(sprite);

    // 雨描画用 Graphics (PixiJS 8.x API)
    const rainLayer = new Graphics();
    app.stage.addChild(rainLayer);

    // 水滴スプライト
    const dropletSprite = new Sprite(texture);
    dropletSprite.width = width;
    dropletSprite.height = height;

    // 水滴用シェーダ
    const dropletFragment = `
        precision mediump float;
        in vec2 vTextureCoord;
        out vec4 finalColor;
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform int uDropletCount;
        uniform vec4 uDroplets[60];
        uniform vec4 uDropletShape[60];

        mat2 rotate2D(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = vTextureCoord;
            vec2 pos = uv * uResolution;
            vec4 baseColor = texture(uTexture, uv);
            vec4 resultColor = vec4(0.0);
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
                diff = rotate2D(-rotation) * diff;
                
                float bulge = tailLen > 0.0 ? 0.0 : 0.15;
                float yBulge = 1.0 + bulge * smoothstep(-radius, radius * 0.5, diff.y);
                
                vec2 scaled = diff / vec2(aspectX * yBulge, aspectY);
                float dist = length(scaled);

                float tailFactor = 0.0;
                if (tailLen > 0.0 && diff.y < 0.0) {
                    float tailProgress = -diff.y / (tailLen * radius);
                    if (tailProgress < 1.0) {
                        float tailWidth = radius * aspectX * (1.0 - tailProgress * 0.7);
                        if (abs(diff.x) < tailWidth) {
                            tailFactor = (1.0 - tailProgress) * (1.0 - abs(diff.x) / tailWidth);
                        }
                    }
                }

                if (dist > radius && tailFactor < 0.01) continue;

                float t = min(dist / radius, 1.0);
                float curve = sqrt(max(0.0, 1.0 - t * t));

                if (tailFactor > 0.01) {
                    t = 1.0 - tailFactor * 0.5;
                    curve = tailFactor * 0.3;
                }

                vec2 lensOffset = -diff * curve * 0.5 / radius;
                vec2 sampleUV = uv + lensOffset * (radius / uResolution.y) * 1.8;
                sampleUV = clamp(sampleUV, vec2(0.0), vec2(1.0));

                vec4 refractedColor = texture(uTexture, sampleUV);

                vec2 hlOffset = rotate2D(rotation) * vec2(-radius * 0.3, -radius * 0.35);
                vec2 hlPos = center + hlOffset;
                float hlDist = length(pos - hlPos) / (radius * 0.28);
                float highlight = pow(max(0.0, 1.0 - hlDist), 5.0) * 0.95;

                vec2 hl2Offset = rotate2D(rotation) * vec2(radius * 0.15, radius * 0.2);
                vec2 hl2Pos = center + hl2Offset;
                float hl2Dist = length(pos - hl2Pos) / (radius * 0.12);
                float highlight2 = pow(max(0.0, 1.0 - hl2Dist), 6.0) * 0.35;

                vec3 dropColor = refractedColor.rgb;
                dropColor += highlight + highlight2;

                float alpha = (0.65 + curve * 0.3) * dropAlpha;
                alpha *= smoothstep(1.0, 0.7, t);

                resultColor.rgb += dropColor * alpha;
                totalAlpha += alpha;
            }

            if (totalAlpha > 0.001) {
                resultColor.rgb /= totalAlpha;
                resultColor.a = min(1.0, totalAlpha);
                finalColor = mix(baseColor, resultColor, resultColor.a);
            } else {
                discard;
            }
        }
    `;

    const dropletGlProgram = GlProgram.from({
        fragment: dropletFragment,
        vertex: `
            in vec2 aPosition;
            out vec2 vTextureCoord;
            uniform vec4 uInputSize;
            uniform vec4 uOutputFrame;
            uniform vec4 uOutputTexture;

            vec4 filterVertexPosition(void) {
                vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
                return vec4(position, 0.0, 1.0);
            }

            vec2 filterTextureCoord(void) {
                return aPosition * (uOutputFrame.zw * uInputSize.zw);
            }

            void main(void) {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
            }
        `
    });

    const dropletFilter = new Filter({
        glProgram: dropletGlProgram,
        resources: {
            dropletUniforms: {
                uResolution: { value: [width, height], type: 'vec2<f32>' },
                uDropletCount: { value: 0, type: 'i32' },
                uDroplets: { value: new Float32Array(60 * 4), type: 'vec4<f32>', size: 60 },
                uDropletShape: { value: new Float32Array(60 * 4), type: 'vec4<f32>', size: 60 }
            }
        }
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
        const sizeRand = Math.random();
        let radius;
        if (sizeRand < 0.6) {
            radius = 2 + Math.random() * 6;
        } else if (sizeRand < 0.9) {
            radius = 8 + Math.random() * 12;
        } else {
            radius = 20 + Math.random() * 18;
        }

        const shapeType = Math.random();
        let aspectX, aspectY, rotation, tailLen;

        if (shapeType < 0.25) {
            aspectX = 0.9 + Math.random() * 0.2;
            aspectY = 0.85 + Math.random() * 0.2;
            rotation = (Math.random() - 0.5) * 0.3;
            tailLen = 0;
        } else if (shapeType < 0.45) {
            aspectX = 1.2 + Math.random() * 0.5;
            aspectY = 0.65 + Math.random() * 0.25;
            rotation = (Math.random() - 0.5) * 0.4;
            tailLen = 0;
        } else if (shapeType < 0.65) {
            aspectX = 0.7 + Math.random() * 0.25;
            aspectY = 1.15 + Math.random() * 0.35;
            rotation = (Math.random() - 0.5) * 0.2;
            tailLen = 0;
        } else {
            aspectX = 0.85 + Math.random() * 0.25;
            aspectY = 0.9 + Math.random() * 0.2;
            rotation = (Math.random() - 0.5) * 0.15;
            tailLen = 1.0 + Math.random() * 2.0;
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

    // PixiJS 8.x: Ticker callback receives ticker object
    app.ticker.add((ticker) => {
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

        // Update ripple uniforms
        const rippleUniforms = rippleFilter.resources.rippleUniforms.uniforms;
        const rippleArray = rippleUniforms.uRipples;
        for (let i = 0; i < 20; i++) {
            rippleArray[i * 4] = 0;
            rippleArray[i * 4 + 1] = 0;
            rippleArray[i * 4 + 2] = 0;
            rippleArray[i * 4 + 3] = 0;
        }

        let activeCount = 0;
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            const age = (now - r.start) / 1000;
            if (age > 2.0) {
                ripples.splice(i, 1);
                continue;
            }
            rippleArray[activeCount * 4] = r.x;
            rippleArray[activeCount * 4 + 1] = r.y;
            rippleArray[activeCount * 4 + 2] = age;
            rippleArray[activeCount * 4 + 3] = 1.0;
            activeCount++;
            if (activeCount >= 20) break;
        }

        rippleUniforms.uTime = elapsed / 1000;
        rippleUniforms.uStrength = 0.6 + progress * 1.05;
        rippleUniforms.uRippleCount = activeCount;

        // PixiJS 8.x Graphics API
        rainLayer.clear();
        for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            rainLayer.moveTo(d.x, d.y);
            rainLayer.lineTo(d.x + d.len * 0.1, d.y + d.len);
        }
        rainLayer.stroke({ width: 2.6, color: 0xe8f4ff, alpha: 0.75 });

        // Spawn droplets
        if (elapsed > nextDropletTime && dropletData.length < maxDroplets) {
            createDroplet();
            nextDropletTime = elapsed + 40 + Math.random() * 80;
        }

        // Update droplet uniforms
        const dropletUniforms = dropletFilter.resources.dropletUniforms.uniforms;
        const dropletsArray = dropletUniforms.uDroplets;
        const shapeArray = dropletUniforms.uDropletShape;
        for (let i = 0; i < dropletData.length; i++) {
            const d = dropletData[i];
            if (d.alpha < d.targetAlpha) {
                d.alpha = Math.min(d.targetAlpha, d.alpha + 0.02);
            }
            dropletsArray[i * 4] = d.x;
            dropletsArray[i * 4 + 1] = d.y;
            dropletsArray[i * 4 + 2] = d.radius;
            dropletsArray[i * 4 + 3] = d.alpha;
            shapeArray[i * 4] = d.aspectX;
            shapeArray[i * 4 + 1] = d.aspectY;
            shapeArray[i * 4 + 2] = d.rotation;
            shapeArray[i * 4 + 3] = d.tailLen;
        }
        dropletUniforms.uDropletCount = dropletData.length;

        if (progress >= 1) {
            app.ticker.stop();
            gsap.set(next, { opacity: 1 });
            app.destroy(true, { children: true, texture: false });
            blocksContainer.innerHTML = '';
            gsap.set(current, { opacity: 1 });
            if (typeof finishAnimation === 'function') {
                finishAnimation(current);
            }
        }
    });
}

// ES Modules: グローバルにエクスポート＆登録
window.effect_rainRipple = effect_rainRipple;

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('rainRipple', effect_rainRipple, {
        name: 'レイン・波紋',
        category: 'special',
        description: '雨粒と波紋で画面が揺らぎながら遷移するエフェクト'
    });
}
