// キューブエフェクト
const cubeEffect = {
    cube: (current, next, container) => {
        container.classList.add('flip-container');
        next.classList.remove('hidden');
        gsap.set(next, { rotationY: -90, x: '50%', transformOrigin: 'left center', opacity: 1 });
        gsap.timeline()
            .to(current, { rotationY: 90, x: '-50%', transformOrigin: 'right center', duration: 0.8, ease: "power2.inOut" })
            .to(next, { rotationY: 0, x: '0%', duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationY: 0, x: 0, transformOrigin: 'center center' }); container.classList.remove('flip-container'); }}, "-=0.8");
    }
};

const cubeEffectDefinition = {
    'cube': { name: 'キューブ', category: '3d' }
};
