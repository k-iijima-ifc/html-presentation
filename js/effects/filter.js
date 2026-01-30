// フィルター系エフェクト
const filterEffects = {
    blur: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0, filter: 'blur(30px)' });
        gsap.timeline()
            .to(current, { opacity: 0, filter: 'blur(30px)', duration: 0.5, ease: "power2.inOut" })
            .to(next, { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: "power2.inOut", onComplete: () => finishAnimation(current, { filter: 'blur(0px)' }) }, "-=0.3");
    },

    pixelate: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0, filter: 'blur(20px) contrast(5)' });
        gsap.timeline()
            .to(current, { filter: 'blur(20px) contrast(5)', duration: 0.3 })
            .to(current, { opacity: 0, duration: 0.2 })
            .to(next, { opacity: 1, filter: 'blur(0px) contrast(1)', duration: 0.5, ease: "power2.out", onComplete: () => finishAnimation(current, { filter: 'none' }) });
    },

    flash: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });
        gsap.timeline()
            .to(current, { filter: 'brightness(3)', duration: 0.2 })
            .to(current, { opacity: 0, duration: 0.1 })
            .set(current, { filter: 'brightness(1)' })
            .set(next, { filter: 'brightness(3)' })
            .to(next, { opacity: 1, duration: 0.1 })
            .to(next, { filter: 'brightness(1)', duration: 0.3, onComplete: () => finishAnimation(current) });
    }
};

// エフェクト定義
const filterEffectDefinitions = {
    'blur': { name: 'ブラー', category: 'filter' },
    'pixelate': { name: 'ピクセル', category: 'filter' },
    'flash': { name: 'フラッシュ', category: 'filter' }
};
