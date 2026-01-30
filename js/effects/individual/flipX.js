// フリップXエフェクト
const flipXEffect = {
    flipX: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationX: -180, opacity: 1 });
        gsap.timeline()
            .to(current, { rotationX: 180, duration: 0.8, ease: "power2.inOut" })
            .to(next, { rotationX: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationX: 0 }); container.classList.remove('flip-container'); }}, "-=0.8");
    }
};

const flipXEffectDefinition = {
    'flipX': { name: 'フリップX', category: '3d' }
};
