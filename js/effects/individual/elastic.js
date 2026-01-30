// エラスティックエフェクト
const elasticEffect = {
    elastic: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 0, opacity: 1 });
        gsap.timeline()
            .to(current, { scale: 0, opacity: 0, duration: 0.4, ease: "power2.in" })
            .to(next, { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.3)", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.2");
    }
};

const elasticEffectDefinition = {
    'elastic': { name: 'エラスティック', category: 'physics' }
};
