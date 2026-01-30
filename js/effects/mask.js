// マスク・クリップ系エフェクト
const maskEffects = {
    curtain: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'inset(0 50% 0 50%)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'inset(0 50% 0 50%)', duration: 0.6, ease: "power2.inOut" })
            .to(next, { clipPath: 'inset(0 0% 0 0%)', duration: 0.6, ease: "power2.inOut", onComplete: () => finishAnimation(current, { clipPath: 'inset(0 0% 0 0%)' }) }, "-=0.3");
    },

    iris: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'circle(0% at 50% 50%)', duration: 0.6, ease: "power2.in" })
            .to(next, { clipPath: 'circle(75% at 50% 50%)', duration: 0.6, ease: "power2.out", onComplete: () => finishAnimation(current, { clipPath: 'circle(75% at 50% 50%)' }) }, "-=0.2");
    },

    wipe: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'inset(0 0 0 100%)', duration: 0.8, ease: "power2.inOut" })
            .to(next, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: "power2.inOut", onComplete: () => finishAnimation(current, { clipPath: 'inset(0 0% 0 0%)' }) }, "-=0.8");
    },

    diamond: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', opacity: 1 });
        gsap.timeline()
            .to(current, { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', duration: 0.5, ease: "power2.in" })
            .to(next, { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', duration: 0.5, ease: "power2.out" })
            .to(next, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.3, ease: "power2.out", onComplete: () => finishAnimation(current, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }) });
    },

    blinds: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { clipPath: 'inset(0 0 100% 0)', opacity: 1 });
        const tl = gsap.timeline();
        // ブラインドが閉じる効果
        for (let i = 0; i <= 10; i++) {
            tl.to(current, { clipPath: `inset(0 0 ${i * 10}% 0)`, duration: 0.05 });
        }
        // ブラインドが開く効果
        for (let i = 10; i >= 0; i--) {
            tl.to(next, { clipPath: `inset(${i * 10}% 0 0 0)`, duration: 0.05 });
        }
        tl.call(() => finishAnimation(current, { clipPath: 'inset(0 0 0% 0)' }));
    }
};

// エフェクト定義
const maskEffectDefinitions = {
    'curtain': { name: 'カーテン', category: 'mask' },
    'iris': { name: 'アイリス', category: 'mask' },
    'wipe': { name: 'ワイプ', category: 'mask' },
    'diamond': { name: 'ダイヤモンド', category: 'mask' },
    'blinds': { name: 'ブラインド', category: 'mask' }
};
