// ピクセルエフェクト
const pixelateEffect = {
    pixelate: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0, filter: 'blur(20px) contrast(5)' });
        gsap.timeline()
            .to(current, { filter: 'blur(20px) contrast(5)', duration: 0.3 })
            .to(current, { opacity: 0, duration: 0.2 })
            .to(next, { opacity: 1, filter: 'blur(0px) contrast(1)', duration: 0.5, ease: "power2.out", onComplete: () => finishAnimation(current, { filter: 'none' }) });
    }
};

const pixelateEffectDefinition = {
    'pixelate': { name: 'ピクセル', category: 'filter' }
};
