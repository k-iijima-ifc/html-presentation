// ワイプエフェクト
const wipeEffect = {
    wipe: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'inset(0 0 0 100%)', duration: 0.8, ease: "power2.inOut" })
            .to(next, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: "power2.inOut", onComplete: () => finishAnimation(current, { clipPath: 'inset(0 0% 0 0%)' }) }, "-=0.8");
    }
};

const wipeEffectDefinition = {
    'wipe': { name: 'ワイプ', category: 'mask' }
};
