// ズームエフェクト
const zoomEffect = {
    zoom: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.in" })
            .to(next, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.2");
    }
};

const zoomEffectDefinition = {
    'zoom': { name: 'ズーム', category: 'basic' }
};
