/**
 * パンチエフェクト
 * 画面を殴って吹き飛ばす
 */
function effect_punch(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0, scale: 0.8 });
    
    const tl = gsap.timeline();
    
    // 殴られる前の溜め
    tl.to(current, { x: 20, duration: 0.1 })
      // 殴られた瞬間
      .to(current, { 
          x: -100, 
          rotation: -15, 
          scale: 0.9, 
          filter: 'blur(3px)', 
          duration: 0.08 
      })
      // 吹き飛ぶ
      .to(current, { 
          x: -window.innerWidth, 
          rotation: -45, 
          opacity: 0, 
          duration: 0.3, 
          ease: "power2.in" 
      })
      // 次のページ登場
      .to(next, { 
          opacity: 1, 
          scale: 1, 
          duration: 0.4, 
          ease: "back.out(1.5)",
          onComplete: () => finishAnimation(current, { x: 0, rotation: 0, scale: 1, filter: 'none' }) 
      }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('punch', effect_punch, { name: 'パンチ', category: 'special' });
}
