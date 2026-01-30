/**
 * iFORCOM i点拡大エフェクト
 * iの丸から新コンテンツが拡大
 */
function effect_iforcomDot(current, next, container) {
    const overlay = document.getElementById('iforcomIdotOverlay');
    const text = document.getElementById('iforcomIdotText');
    const iDot = document.getElementById('iDot');
    const preview = document.getElementById('idotNextPreview');
    
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });

    const containerRect = container.getBoundingClientRect();
    const nextIframe = next.querySelector('iframe');

    const tl = gsap.timeline();

    tl.set(overlay, { opacity: 1 })
      .from(text, { scale: 0.5, opacity: 0, duration: 0.4, ease: "back.out(1.5)" })
      .to(text, { textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #ff00ff', duration: 0.3 })
      .call(() => {
          const dotRect = iDot.getBoundingClientRect();
          const dotX = dotRect.left - containerRect.left + dotRect.width / 2;
          const dotY = dotRect.top - containerRect.top + dotRect.height / 2;
          gsap.set(preview, { left: dotX - 10, top: dotY - 10, width: 20, height: 20, opacity: 0 });
      })
      .to(iDot, { scale: 1.5, boxShadow: '0 0 20px #00ffff, 0 0 60px #ff00ff', duration: 0.2, repeat: 3, yoyo: true })
      .call(() => {
          current.style.webkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dominant-baseline='middle' font-size='120' font-weight='900' fill='white'%3EiFORCOM%3C/text%3E%3C/svg%3E")`;
          current.style.maskImage = current.style.webkitMaskImage;
          current.style.webkitMaskSize = '100% 100%';
          current.style.maskSize = '100% 100%';
      })
      .to(current, { filter: 'brightness(1.3) saturate(1.5)', duration: 0.3 })
      .set(preview, { opacity: 1, background: nextIframe ? `url('${nextIframe.src}') center/cover` : '#667eea' })
      .to(preview, { boxShadow: '0 0 30px #00ffff, 0 0 60px #ff00ff', duration: 0.2 })
      .to(iDot, { scale: 0, opacity: 0, duration: 0.3 })
      .to(text, { opacity: 0, scale: 0.8, filter: 'blur(10px)', duration: 0.4 }, "-=0.3")
      .to(overlay, { opacity: 0, duration: 0.3 }, "-=0.2")
      .to(current, { opacity: 0, duration: 0.3 }, "-=0.3")
      .to(preview, {
          left: containerRect.width / 2, top: containerRect.height / 2,
          xPercent: -50, yPercent: -50,
          width: Math.max(containerRect.width, containerRect.height) * 2,
          height: Math.max(containerRect.width, containerRect.height) * 2,
          duration: 0.8, ease: "power2.inOut"
      }, "-=0.4")
      .call(() => {
          current.style.webkitMaskImage = 'none';
          current.style.maskImage = 'none';
          gsap.set(current, { filter: 'none' });
      })
      .set(next, { opacity: 1 })
      .to(preview, { opacity: 0, duration: 0.3 })
      .call(() => {
          gsap.set(preview, { left: 0, top: 0, width: 20, height: 20, xPercent: 0, yPercent: 0, opacity: 0, background: 'none' });
          gsap.set(text, { scale: 1, opacity: 1, filter: 'none' });
          gsap.set(iDot, { scale: 1, opacity: 1 });
          finishAnimation(current, { filter: 'none' });
      });
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('iforcomDot', effect_iforcomDot, { name: '⭕iFORCOM点', category: 'iforcom' });
}
