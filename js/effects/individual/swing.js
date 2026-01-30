/**
 * スウィングエフェクト
 * 振り子のように揺れてページ切り替え
 */
function effect_swing(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { rotation: -15, transformOrigin: 'top center', opacity: 0 });
    gsap.timeline()
        .to(current, { rotation: 15, opacity: 0, transformOrigin: 'top center', duration: 0.4, ease: "power2.in" })
        .to(next, { rotation: 0, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", onComplete: () => finishAnimation(current, { rotation: 0, transformOrigin: 'center center' }) }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('swing', effect_swing, { name: 'スウィング', category: 'physics' });
}
