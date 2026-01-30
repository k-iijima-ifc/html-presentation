/**
 * 新聞紙エフェクト
 * 新聞のように回転しながらページ切り替え
 */
function effect_newspaper(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { rotation: 720, scale: 0, opacity: 0 });
    gsap.timeline()
        .to(current, { rotation: -720, scale: 0, opacity: 0, duration: 0.8, ease: "power2.in" })
        .to(next, { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power2.out", onComplete: () => finishAnimation(current, { rotation: 0, scale: 1 }) }, "-=0.4");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('newspaper', effect_newspaper, { name: '新聞紙', category: 'special' });
}
