/**
 * ブラインドエフェクト
 * ブラインドが閉じて開くようにページ切り替え
 */
function effect_blinds(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { clipPath: 'inset(0 0 100% 0)', opacity: 1 });
    const tl = gsap.timeline();
    for (let i = 0; i <= 10; i++) {
        tl.to(current, { clipPath: `inset(0 0 ${i * 10}% 0)`, duration: 0.05 });
    }
    for (let i = 10; i >= 0; i--) {
        tl.to(next, { clipPath: `inset(${i * 10}% 0 0 0)`, duration: 0.05 });
    }
    tl.call(() => finishAnimation(current, { clipPath: 'inset(0 0 0% 0)' }));
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('blinds', effect_blinds, { name: 'ブラインド', category: 'mask' });
}
