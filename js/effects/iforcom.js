// IFORCOMエフェクト
const iforcomEffects = {
    // IFORCOMエフェクト - 怖しく光りながら切り替わる
    iforcom: (current, next, container) => {
        const overlay = document.getElementById('iforcomOverlay');
        const text = document.getElementById('iforcomText');
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        const tl = gsap.timeline();

        // フェーズ1: 現在のコンテンツがIFORCOM形に変形
        tl.to(overlay, { opacity: 1, duration: 0.3 })
          .to(text, { 
              scale: 1.2, 
              duration: 0.2,
              ease: "power2.out" 
          })
          .call(() => {
              current.classList.add('iforcom-mask-active');
              text.style.animation = 'neonPulse 0.3s ease-in-out infinite';
          })
          // フェーズ2: 怖しいネオン点滅とグリッチ
          .to(text, {
              x: gsap.utils.random(-20, 20),
              y: gsap.utils.random(-10, 10),
              skewX: gsap.utils.random(-10, 10),
              duration: 0.1,
              repeat: 8,
              yoyo: true
          })
          .to(current, { 
              filter: 'hue-rotate(180deg) saturate(3) brightness(1.5)',
              duration: 0.2 
          }, "-=0.8")
          // フェーズ3: フラッシュして消える
          .to(text, {
              scale: 3,
              opacity: 0,
              filter: 'blur(30px)',
              duration: 0.4,
              ease: "power2.in"
          })
          .to(current, { opacity: 0, duration: 0.2 }, "-=0.3")
          .call(() => {
              current.classList.remove('iforcom-mask-active');
              gsap.set(current, { filter: 'none' });
          })
          // フェーズ4: 新コンテンツがIFORCOMから出現
          .set(text, { scale: 0, opacity: 1, filter: 'blur(0px)' })
          .set(next, { opacity: 1 })
          .call(() => {
              next.classList.add('iforcom-mask-active');
          })
          .to(text, {
              scale: 1,
              duration: 0.3,
              ease: "back.out(2)"
          })
          // フェーズ5: マスク解除して全体表示
          .to(text, {
              scale: 15,
              opacity: 0,
              duration: 0.5,
              ease: "power3.in"
          })
          .call(() => {
              next.classList.remove('iforcom-mask-active');
              text.style.animation = 'none';
          }, null, "-=0.2")
          .to(overlay, { opacity: 0, duration: 0.2 })
          .call(() => {
              gsap.set(text, { scale: 1, x: 0, y: 0, skewX: 0, filter: 'none' });
              finishAnimation(current, { filter: 'none' });
          });
    },

    // iFORCOM i点拡大エフェクト - iの丸から新コンテンツが拡大
    iforcomDot: (current, next, container) => {
        const overlay = document.getElementById('iforcomIdotOverlay');
        const text = document.getElementById('iforcomIdotText');
        const iDot = document.getElementById('iDot');
        const preview = document.getElementById('idotNextPreview');
        
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 0 });

        // コンテナの位置とサイズを取得
        const containerRect = container.getBoundingClientRect();
        
        // プレビュー用にnextのiframeをクローン
        const nextIframe = next.querySelector('iframe');

        const tl = gsap.timeline();

        // フェーズ1: iFORCOMテキスト表示（先にオーバーレイを表示）
        tl.set(overlay, { opacity: 1 })
          .from(text, { 
              scale: 0.5,
              opacity: 0,
              duration: 0.4,
              ease: "back.out(1.5)"
          })
          .to(text, { 
              textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #ff00ff, 0 0 80px #ff00ff',
              duration: 0.3
          })
          // フェーズ2: i点を強調（脈動）- ここでiDotの実際の位置を取得
          .call(() => {
              // iDotの実際の位置を取得（オーバーレイ表示後）
              const dotRect = iDot.getBoundingClientRect();
              const dotX = dotRect.left - containerRect.left + dotRect.width / 2;
              const dotY = dotRect.top - containerRect.top + dotRect.height / 2;
              const dotSize = 20;
              
              // プレビュー円の初期設定（iDotと同じ位置）
              gsap.set(preview, {
                  left: dotX - dotSize/2,
                  top: dotY - dotSize/2,
                  width: dotSize,
                  height: dotSize,
                  opacity: 0
              });
              
              // 位置をタイムラインで使うために保存
              tl.vars.dotX = dotX;
              tl.vars.dotY = dotY;
          })
          .to(iDot, {
              scale: 1.5,
              boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #ff00ff, 0 0 100px #ff00ff',
              duration: 0.2,
              repeat: 3,
              yoyo: true,
              ease: "power2.inOut"
          })
          // フェーズ3: 現在のコンテンツをiFORCOM形にマスク
          .call(() => {
              current.style.webkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dominant-baseline='middle' font-size='120' font-weight='900' font-family='Arial Black, Impact, sans-serif' fill='white'%3EiFORCOM%3C/text%3E%3C/svg%3E")`;
              current.style.maskImage = current.style.webkitMaskImage;
              current.style.webkitMaskSize = '100% 100%';
              current.style.maskSize = '100% 100%';
              current.style.webkitMaskRepeat = 'no-repeat';
              current.style.maskRepeat = 'no-repeat';
          })
          .to(current, { filter: 'brightness(1.3) saturate(1.5)', duration: 0.3 })
          // フェーズ4: i点の位置に次コンテンツのプレビュー円を表示
          .set(preview, { 
              opacity: 1,
              background: `url('${nextIframe ? nextIframe.src : ''}') center/cover`
          })
          .to(preview, {
              boxShadow: '0 0 30px #00ffff, 0 0 60px #ff00ff, 0 0 100px #00ffff',
              duration: 0.2
          })
          // フェーズ5: プレビュー円が拡大して画面を覆う
          .to(iDot, {
              scale: 0,
              opacity: 0,
              duration: 0.3
          })
          .to(text, {
              opacity: 0,
              scale: 0.8,
              filter: 'blur(10px)',
              duration: 0.4
          }, "-=0.3")
          .to(overlay, { opacity: 0, duration: 0.3 }, "-=0.2")
          .to(current, { opacity: 0, duration: 0.3 }, "-=0.3")
          .to(preview, {
              left: containerRect.width / 2,
              top: containerRect.height / 2,
              xPercent: -50,
              yPercent: -50,
              width: Math.max(containerRect.width, containerRect.height) * 2,
              height: Math.max(containerRect.width, containerRect.height) * 2,
              duration: 0.8,
              ease: "power2.inOut"
          }, "-=0.4")
          // フェーズ6: 新コンテンツを表示してプレビューを消す
          .call(() => {
              current.style.webkitMaskImage = 'none';
              current.style.maskImage = 'none';
              gsap.set(current, { filter: 'none' });
          })
          .set(next, { opacity: 1 })
          .to(preview, { opacity: 0, duration: 0.3 })
          .call(() => {
              // リセット
              gsap.set(preview, { 
                  left: 0, top: 0, width: 20, height: 20, 
                  xPercent: 0, yPercent: 0, opacity: 0, background: 'none'
              });
              gsap.set(text, { scale: 1, opacity: 1, filter: 'none' });
              gsap.set(iDot, { scale: 1, opacity: 1 });
              finishAnimation(current, { filter: 'none' });
          });
    }
};

// エフェクト定義
const iforcomEffectDefinitions = {
    'iforcom': { name: '🔮 IFORCOM', category: 'special' },
    'iforcomDot': { name: '⭕ iFORCOM点', category: 'special' }
};
