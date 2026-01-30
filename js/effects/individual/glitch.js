// グリッチエフェクト
const glitchEffect = {
    glitch: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        const tl = gsap.timeline();
        for (let i = 0; i < 8; i++) {
            tl.to(current, { x: gsap.utils.random(-15, 15), y: gsap.utils.random(-8, 8), skewX: gsap.utils.random(-10, 10), filter: `hue-rotate(${gsap.utils.random(0, 360)}deg) saturate(${gsap.utils.random(1, 3)})`, duration: 0.04 });
        }
        tl.to(current, { opacity: 0, duration: 0.1 }).set(current, { x: 0, y: 0, skewX: 0, filter: 'none' });
        for (let i = 0; i < 8; i++) {
            tl.to(next, { opacity: gsap.utils.random(0.3, 1), x: gsap.utils.random(-15, 15), y: gsap.utils.random(-8, 8), skewX: gsap.utils.random(-10, 10), filter: `hue-rotate(${gsap.utils.random(0, 360)}deg)`, duration: 0.04 });
        }
        tl.to(next, { opacity: 1, x: 0, y: 0, skewX: 0, filter: 'none', duration: 0.1, onComplete: () => finishAnimation(current, { x: 0, y: 0, skewX: 0, filter: 'none' }) });
    }
};

const glitchEffectDefinition = {
    'glitch': { name: 'グリッチ', category: 'special' }
};
