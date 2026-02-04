/**
 * IFORCOMエフェクト
 * 怖しく光りながら切り替わる
 */
function effect_iforcom(current, next, container) {
    const overlay = document.getElementById('iforcomOverlay');
    const text = document.getElementById('iforcomText');
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });

    const tl = gsap.timeline();

    tl.to(overlay, { opacity: 1, duration: 0.3 })
      .to(text, { scale: 1.2, duration: 0.2, ease: "power2.out" })
      .call(() => {
          current.classList.add('iforcom-mask-active');
          text.style.animation = 'neonPulse 0.3s ease-in-out infinite';
      })
      .to(text, {
          x: gsap.utils.random(-20, 20), y: gsap.utils.random(-10, 10),
          skewX: gsap.utils.random(-10, 10), duration: 0.1, repeat: 8, yoyo: true
      })
      .to(current, { filter: 'hue-rotate(180deg) saturate(3) brightness(1.5)', duration: 0.2 }, "-=0.8")
      .to(text, { scale: 3, opacity: 0, filter: 'blur(30px)', duration: 0.4, ease: "power2.in" })
      .to(current, { opacity: 0, duration: 0.2 }, "-=0.3")
      .call(() => {
          current.classList.remove('iforcom-mask-active');
          gsap.set(current, { filter: 'none' });
      })
      .set(text, { scale: 0, opacity: 1, filter: 'blur(0px)' })
      .set(next, { opacity: 1 })
      .call(() => next.classList.add('iforcom-mask-active'))
      .to(text, { scale: 1, duration: 0.3, ease: "back.out(2)" })
      .to(text, { scale: 15, opacity: 0, duration: 0.5, ease: "power3.in" })
      .call(() => {
          next.classList.remove('iforcom-mask-active');
          text.style.animation = 'none';
      }, null, "-=0.2")
      .to(overlay, { opacity: 0, duration: 0.2 })
      .call(() => {
          gsap.set(text, { scale: 1, x: 0, y: 0, skewX: 0, filter: 'none' });
          finishAnimation(current, { filter: 'none' });
      });
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('iforcom', effect_iforcom, { name: 'IFORCOM', category: 'iforcom' });
}
