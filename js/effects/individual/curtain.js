// カーテンエフェクト
const curtainEffect = {
    curtain: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'inset(0 50% 0 50%)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'inset(0 50% 0 50%)', duration: 0.6, ease: "power2.inOut" })
            .to(next, { clipPath: 'inset(0 0% 0 0%)', duration: 0.6, ease: "power2.inOut", onComplete: () => finishAnimation(current, { clipPath: 'inset(0 0% 0 0%)' }) }, "-=0.3");
    }
};

const curtainEffectDefinition = {
    'curtain': { name: 'カーテン', category: 'mask' }
};
