/**
 * ズームアウトエフェクト
 * 外側から縮小してページ切り替え
 */
function effect_zoomOut(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { scale: 2, opacity: 0 });
    gsap.timeline()
        .to(current, { scale: 0.5, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(next, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.3");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('zoomOut', effect_zoomOut, { name: 'ズームアウト', category: 'basic' });
}
