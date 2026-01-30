// ブラインドエフェクト
const blindsEffect = {
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

const blindsEffectDefinition = {
    'blinds': { name: 'ブラインド', category: 'mask' }
};
