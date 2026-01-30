/**
 * フェードエフェクト
 * シンプルな透明度変化によるページ切り替え
 */
function effect_fade(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.timeline()
        .to(current, { opacity: 0, duration: 0.5, ease: "power2.inOut" })
        .to(next, { opacity: 1, duration: 0.5, ease: "power2.inOut", onComplete: () => finishAnimation(current) }, "-=0.3");
}

// エフェクト登録
if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('fade', effect_fade, { name: 'フェード', category: 'basic' });
}
