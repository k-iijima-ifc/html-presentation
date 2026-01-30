/**
 * 燃焼エフェクト
 * 燃えるようにページ切り替え
 */
function effect_burn(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0 });
    gsap.set(current, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
    
    const tl = gsap.timeline();
    
    // 炎の色に変化
    tl.to(current, { 
        filter: 'sepia(0.5) saturate(2) brightness(1.2)', 
        duration: 0.4 
    })
    // 下から燃え上がる
    .to(current, { 
        filter: 'sepia(1) saturate(4) brightness(0.6) contrast(1.5)', 
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', 
        duration: 1.2, 
        ease: "power1.in" 
    })
    // 次のページをフェードイン
    .to(next, { 
        opacity: 1, 
        duration: 0.6, 
        ease: "power2.out",
        onComplete: () => {
            gsap.set(current, { filter: 'none', clipPath: 'none' });
            finishAnimation(current);
        }
    }, "-=0.4");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('burn', effect_burn, { name: '燃焼', category: 'special' });
}
