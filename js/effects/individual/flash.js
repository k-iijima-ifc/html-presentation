// フラッシュエフェクト
const flashEffect = {
    flash: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.timeline()
            .to(current, { filter: 'brightness(3)', duration: 0.2 })
            .to(current, { opacity: 0, duration: 0.1 })
            .set(current, { filter: 'brightness(1)' })
            .set(next, { filter: 'brightness(3)' })
            .to(next, { opacity: 1, duration: 0.1 })
            .to(next, { filter: 'brightness(1)', duration: 0.3, onComplete: () => finishAnimation(current) });
    }
};

const flashEffectDefinition = {
    'flash': { name: 'フラッシュ', category: 'filter' }
};
