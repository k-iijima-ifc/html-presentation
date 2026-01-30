// モーフエフェクト
const morphEffect = {
    morph: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { borderRadius: '50%', scale: 0, opacity: 1 });
        gsap.timeline()
            .to(current, { borderRadius: '50%', scale: 0.5, duration: 0.4, ease: "power2.in" })
            .to(current, { scale: 0, opacity: 0, duration: 0.2 })
            .to(next, { scale: 0.5, duration: 0.2 }, "-=0.2")
            .to(next, { scale: 1, borderRadius: '0%', duration: 0.4, ease: "power2.out", onComplete: () => finishAnimation(current, { borderRadius: '0%', scale: 1 }) });
    }
};

const morphEffectDefinition = {
    'morph': { name: 'モーフ', category: 'special' }
};
