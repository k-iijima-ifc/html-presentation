// 回転エフェクト
const rotateEffect = {
    rotate: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { rotation: 180, scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { rotation: -180, scale: 0, opacity: 0, duration: 0.6, ease: "power2.in" })
            .to(next, { rotation: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.4)", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1 }) }, "-=0.3");
    }
};

const rotateEffectDefinition = {
    'rotate': { name: '回転', category: 'rotate' }
};
