// バウンスエフェクト
const bounceEffect = {
    bounce: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { yPercent: -100, opacity: 1 });
        gsap.timeline()
            .to(current, { yPercent: 100, duration: 0.5, ease: "power2.in" })
            .to(next, { yPercent: 0, duration: 0.8, ease: "bounce.out", onComplete: () => finishAnimation(current, { yPercent: 0 }) }, "-=0.3");
    }
};

const bounceEffectDefinition = {
    'bounce': { name: 'バウンス', category: 'physics' }
};
