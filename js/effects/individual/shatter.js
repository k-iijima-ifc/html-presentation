// シャッターエフェクト
const shatterEffect = {
    shatter: (current, next) => {
        next.classList.remove('hidden');
        gsap.set(next, { scale: 1.2, opacity: 0 });
        const tl = gsap.timeline();
        tl.to(current, { scale: 1.1, duration: 0.1 })
          .to(current, { clipPath: 'polygon(0% 0%, 30% 0%, 25% 100%, 0% 100%)', duration: 0.1 })
          .to(current, { x: -100, rotation: -10, opacity: 0, duration: 0.3, ease: "power2.in" })
          .set(current, { clipPath: 'none', x: 0, rotation: 0 })
          .to(next, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)", onComplete: () => finishAnimation(current, { scale: 1, clipPath: 'none' }) }, "-=0.2");
    }
};

const shatterEffectDefinition = {
    'shatter': { name: 'シャッター', category: 'special' }
};
