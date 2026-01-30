// 物理系エフェクト
const physicsEffects = {
    bounce: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { yPercent: -100, opacity: 1 });
        gsap.timeline()
            .to(current, { yPercent: 100, duration: 0.5, ease: "power2.in" })
            .to(next, { yPercent: 0, duration: 0.8, ease: "bounce.out", onComplete: () => finishAnimation(current, { yPercent: 0 }) }, "-=0.3");
    },

    elastic: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 0, opacity: 1 });
        gsap.timeline()
            .to(current, { scale: 0, opacity: 0, duration: 0.4, ease: "power2.in" })
            .to(next, { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.3)", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.2");
    },

    swing: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: -15, transformOrigin: 'top center', opacity: 0 });
        gsap.timeline()
            .to(current, { rotation: 15, opacity: 0, transformOrigin: 'top center', duration: 0.4, ease: "power2.in" })
            .to(next, { rotation: 0, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", onComplete: () => finishAnimation(current, { rotation: 0, transformOrigin: 'center center' }) }, "-=0.2");
    }
};

// エフェクト定義
const physicsEffectDefinitions = {
    'bounce': { name: 'バウンス', category: 'physics' },
    'elastic': { name: 'エラスティック', category: 'physics' },
    'swing': { name: 'スウィング', category: 'physics' }
};
