/**
 * ダイヤモンドエフェクト
 * ダイヤ形に開いてページ切り替え
 */
function effect_diamond(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', opacity: 1 });
    gsap.timeline()
        .to(current, { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', duration: 0.5, ease: "power2.in" })
        .to(next, { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', duration: 0.5, ease: "power2.out" })
        .to(next, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.3, ease: "power2.out", onComplete: () => finishAnimation(current, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }) });
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('diamond', effect_diamond, { name: 'ダイヤモンド', category: 'mask' });
}
