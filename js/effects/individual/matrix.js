/**
 * マトリックスエフェクト
 * マトリックス風のページ切り替え
 */
function effect_matrix(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0, filter: 'hue-rotate(90deg) saturate(2)' });
    const tl = gsap.timeline();
    tl.to(current, { filter: 'hue-rotate(90deg) saturate(2) brightness(1.5)', duration: 0.2 })
      .to(current, { yPercent: -5, opacity: 0.8, duration: 0.1, repeat: 5, yoyo: true })
      .to(current, { opacity: 0, yPercent: 0, duration: 0.2 })
      .to(next, { opacity: 1, duration: 0.3 })
      .to(next, { filter: 'hue-rotate(0deg) saturate(1)', duration: 0.4, ease: "power2.out", onComplete: () => finishAnimation(current, { filter: 'none', yPercent: 0 }) });
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('matrix', effect_matrix, { name: 'マトリックス', category: 'special' });
}
