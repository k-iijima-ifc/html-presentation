/**
 * フリップYエフェクト
 * Y軸で回転してページ切り替え
 */
function effect_flip(current, next, container) {
    container.classList.add('flip-container');
    next.classList.remove('hidden');
    gsap.set(next, { rotationY: -180, opacity: 1 });
    gsap.timeline()
        .to(current, { rotationY: 180, duration: 0.8, ease: "power2.inOut" })
        .to(next, { rotationY: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => { finishAnimation(current, { rotationY: 0 }); container.classList.remove('flip-container'); }}, "-=0.8");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('flip', effect_flip, { name: 'フリップY', category: '3d' });
}
