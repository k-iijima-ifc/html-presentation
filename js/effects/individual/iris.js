/**
 * アイリスエフェクト
 * 円形に開いてページ切り替え
 */
function effect_iris(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 });
    gsap.timeline()
        .to(current, { clipPath: 'circle(0% at 50% 50%)', duration: 0.6, ease: "power2.in" })
        .to(next, { clipPath: 'circle(75% at 50% 50%)', duration: 0.6, ease: "power2.out", onComplete: () => finishAnimation(current, { clipPath: 'circle(75% at 50% 50%)' }) }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('iris', effect_iris, { name: 'アイリス', category: 'mask' });
}
