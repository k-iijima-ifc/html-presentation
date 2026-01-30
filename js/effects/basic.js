// 基本エフェクト
const basicEffects = {
    fade: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.timeline()
            .to(current, { opacity: 0, duration: 0.5, ease: "power2.inOut" })
            .to(next, { opacity: 1, duration: 0.5, ease: "power2.inOut", onComplete: () => finishAnimation(current) }, "-=0.3");
    },

    slide: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { xPercent: 100, opacity: 1 });
        gsap.timeline()
            .to(current, { xPercent: -100, duration: 0.8, ease: "power3.inOut" })
            .to(next, { xPercent: 0, duration: 0.8, ease: "power3.inOut", onComplete: () => finishAnimation(current, { xPercent: 0 }) }, "-=0.8");
    },

    slideUp: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { yPercent: 100, opacity: 1 });
        gsap.timeline()
            .to(current, { yPercent: -100, duration: 0.8, ease: "power3.inOut" })
            .to(next, { yPercent: 0, duration: 0.8, ease: "power3.inOut", onComplete: () => finishAnimation(current, { yPercent: 0 }) }, "-=0.8");
    },

    zoom: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 0, opacity: 0 });
        gsap.timeline()
            .to(current, { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.in" })
            .to(next, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.2");
    },

    zoomOut: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 2, opacity: 0 });
        gsap.timeline()
            .to(current, { scale: 0.5, opacity: 0, duration: 0.5, ease: "power2.in" })
            .to(next, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.3");
    }
};

// エフェクト定義
const basicEffectDefinitions = {
    'fade': { name: 'フェード', category: 'basic' },
    'slide': { name: 'スライド', category: 'basic' },
    'slideUp': { name: 'スライド↑', category: 'basic' },
    'zoom': { name: 'ズーム', category: 'basic' },
    'zoomOut': { name: 'ズームアウト', category: 'basic' }
};
