/**
 * 燃焼エフェクト
 * 燃えるようにページ切り替え
 */
function effect_burn(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    
    const tl = gsap.timeline();
    
    tl.to(current, { 
        filter: 'sepia(1) saturate(3) brightness(1.3)', 
        duration: 0.2 
    })
    .to(current, { 
        filter: 'sepia(1) saturate(5) brightness(0.5) contrast(2)', 
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', 
        duration: 0.6, 
        ease: "power2.in" 
    })
    .to(next, { 
        opacity: 1, 
        duration: 0.4, 
        ease: "power2.out",
        onComplete: () => finishAnimation(current, { filter: 'none', clipPath: 'none' }) 
    }, "-=0.2");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('burn', effect_burn, { name: '燃焼', category: 'special' });
}
