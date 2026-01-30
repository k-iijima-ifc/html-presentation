/**
 * 風車エフェクト
 * 風車のように回転してページ切り替え
 */
function effect_windmill(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { rotation: -180, scale: 0.5, opacity: 0, transformOrigin: 'top left' });
    gsap.timeline()
        .to(current, { rotation: 180, scale: 0, opacity: 0, transformOrigin: 'bottom right', duration: 0.7, ease: "power2.in" })
        .to(next, { rotation: 0, scale: 1, opacity: 1, transformOrigin: 'center center', duration: 0.7, ease: "power2.out", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1, transformOrigin: 'center center' }) }, "-=0.3");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('windmill', effect_windmill, { name: '風車', category: 'rotate' });
}
