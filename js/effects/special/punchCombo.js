/**
 * パンチコンボエフェクト
 * 連続パンチで画面を破壊
 */
function effect_punchCombo(current, next) {
    next.classList.remove('hidden');
    gsap.set(next, { opacity: 0, scale: 0.9 });
    
    const tl = gsap.timeline();
    
    // 連続パンチ
    for (let i = 0; i < 5; i++) {
        const direction = i % 2 === 0 ? 1 : -1;
        tl.to(current, { 
            x: direction * (15 + i * 5), 
            y: (Math.random() - 0.5) * 20, 
            rotation: direction * (3 + i * 2),
            filter: `blur(${i}px)`,
            duration: 0.06 
        });
    }
    
    // 最後の一撃
    tl.to(current, { 
        x: 0, 
        rotation: 0, 
        scale: 1.1, 
        duration: 0.1 
    })
    .to(current, { 
        y: -window.innerHeight, 
        rotation: 720, 
        scale: 0, 
        opacity: 0, 
        duration: 0.5, 
        ease: "power3.in" 
    })
    .to(next, { 
        opacity: 1, 
        scale: 1, 
        duration: 0.5, 
        ease: "elastic.out(1, 0.5)",
        onComplete: () => finishAnimation(current, { x: 0, y: 0, rotation: 0, scale: 1, filter: 'none' }) 
    }, "-=0.3");
}

if (typeof effectRegistry !== 'undefined') {
    effectRegistry.register('punchCombo', effect_punchCombo, { name: 'コンボ', category: 'special' });
}
