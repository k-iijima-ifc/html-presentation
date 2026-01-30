/**
 * エラスティックエフェクト
 * ゴムのように弾性変形してページ切り替え
 */
function effect_elastic(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { scale: 0, opacity: 1 });
    gsap.timeline()
        .to(current, { scale: 0, opacity: 0, duration: 0.4, ease: "power2.in" })
        .to(next, { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.3)", onComplete: () => finishAnimation(current, { scale: 1 }) }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('elastic', effect_elastic, { name: 'エラスティック', category: 'physics' });
}
