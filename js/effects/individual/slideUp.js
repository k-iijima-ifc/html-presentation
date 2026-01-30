// スライドアップエフェクト
const slideUpEffect = {
    slideUp: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { yPercent: 100, opacity: 1 });
        gsap.timeline()
            .to(current, { yPercent: -100, duration: 0.8, ease: "power3.inOut" })
            .to(next, { yPercent: 0, duration: 0.8, ease: "power3.inOut", onComplete: () => finishAnimation(current, { yPercent: 0 }) }, "-=0.8");
    }
};

const slideUpEffectDefinition = {
    'slideUp': { name: 'スライド↑', category: 'basic' }
};
