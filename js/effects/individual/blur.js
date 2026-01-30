// ブラーエフェクト
const blurEffect = {
    blur: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0, filter: 'blur(30px)' });
        gsap.timeline()
            .to(current, { opacity: 0, filter: 'blur(30px)', duration: 0.5, ease: "power2.inOut" })
            .to(next, { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: "power2.inOut", onComplete: () => finishAnimation(current, { filter: 'blur(0px)' }) }, "-=0.3");
    }
};

const blurEffectDefinition = {
    'blur': { name: 'ブラー', category: 'filter' }
};
