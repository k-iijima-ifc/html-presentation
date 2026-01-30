// フォールドエフェクト
const foldEffect = {
    fold: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationY: -90, transformOrigin: 'left center', opacity: 1 });
        gsap.timeline()
            .to(current, { rotationY: 90, transformOrigin: 'right center', duration: 0.7, ease: "power2.in" })
            .to(next, { rotationY: 0, duration: 0.7, ease: "power2.out", onComplete: () => { finishAnimation(current, { rotationY: 0, transformOrigin: 'center center' }); container.classList.remove('flip-container'); }}, "-=0.2");
    }
};

const foldEffectDefinition = {
    'fold': { name: 'フォールド', category: '3d' }
};
