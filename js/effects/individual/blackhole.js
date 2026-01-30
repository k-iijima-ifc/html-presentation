/**
 * ブラックホールエフェクト
 * ブラックホールに吸い込まれるようにページ切り替え
 */
function effect_blackhole(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0, scale: 0 });
    
    const tl = gsap.timeline();
    
    tl.to(current, { 
        scale: 0, 
        rotation: 720, 
        filter: 'blur(20px) brightness(0.5)', 
        duration: 0.8, 
        ease: "power3.in" 
    })
    .set(current, { opacity: 0, filter: 'none', rotation: 0, scale: 1 })
    .to(next, { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        ease: "back.out(1.5)",
        onComplete: () => finishAnimation(current) 
    }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('blackhole', effect_blackhole, { name: 'ブラックホール', category: 'special' });
}
