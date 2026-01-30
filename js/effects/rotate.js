// 回転系エフェクト
const rotateEffects = {
    rotate: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: 180, scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { rotation: -180, scale: 0, opacity: 0, duration: 0.6, ease: "power2.in" })
            .to(next, { rotation: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.4)", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1 }) }, "-=0.3");
    },

    spiral: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: 720, scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { rotation: -360, scale: 0, opacity: 0, duration: 0.7, ease: "power2.in" })
            .to(next, { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power2.out", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1 }) }, "-=0.4");
    },

    windmill: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: -180, scale: 0.5, opacity: 0, transformOrigin: 'top left' });
        gsap.timeline()
            .to(current, { rotation: 180, scale: 0, opacity: 0, transformOrigin: 'bottom right', duration: 0.7, ease: "power2.in" })
            .to(next, { rotation: 0, scale: 1, opacity: 1, transformOrigin: 'center center', duration: 0.7, ease: "power2.out", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1, transformOrigin: 'center center' }) }, "-=0.3");
    }
};

// エフェクト定義
const rotateEffectDefinitions = {
    'rotate': { name: '回転', category: 'rotate' },
    'spiral': { name: 'スパイラル', category: 'rotate' },
    'windmill': { name: '風車', category: 'rotate' }
};
