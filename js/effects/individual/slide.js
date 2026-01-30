/**
 * スライドエフェクト
 * 横方向にスライドしてページ切り替え
 */
function effect_slide(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { xPercent: 100, opacity: 1 });
    gsap.timeline()
        .to(current, { xPercent: -100, duration: 0.8, ease: "power3.inOut" })
        .to(next, { xPercent: 0, duration: 0.8, ease: "power3.inOut", onComplete: () => finishAnimation(current, { xPercent: 0 }) }, "-=0.8");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('slide', effect_slide, { name: 'スライド', category: 'basic' });
}
