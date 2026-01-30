// メインスクリプト - 初期化と共通処理

// 設定
let currentIndex = 0;
let currentEffect = 'fade';
let isAnimating = false;

// 全エフェクト定義を結合
const effectDefinitions = {
    ...basicEffectDefinitions,
    ...effects3DDefinitions,
    ...rotateEffectDefinitions,
    ...physicsEffectDefinitions,
    ...maskEffectDefinitions,
    ...filterEffectDefinitions,
    ...specialEffectDefinitions,
    ...iforcomEffectDefinitions,
    ...collapseEffectDefinitions
};

// 全エフェクト関数を結合
const effects = {
    ...basicEffects,
    ...effects3D,
    ...rotateEffects,
    ...physicsEffects,
    ...maskEffects,
    ...filterEffects,
    ...specialEffects,
    ...iforcomEffects,
    ...collapseEffects
};

// 初期化：コンテンツボタンとiframeを動的生成
function initializeContent() {
    const buttonContainer = document.getElementById('contentButtons');
    const iframeContainer = document.getElementById('iframeContainer');
    const effectButtonContainer = document.getElementById('effectButtons');

    // コンテンツボタン生成
    iframeContents.forEach((content, index) => {
        const btn = document.createElement('button');
        btn.className = index === 0 ? 'btn active' : 'btn';
        btn.id = `page-btn-${index}`;
        btn.onclick = () => switchContent(index);
        btn.innerHTML = `<span style="margin-right: 8px;">${content.icon}</span> ${content.name}`;
        buttonContainer.appendChild(btn);

        // iframe wrapper生成
        const wrapper = document.createElement('div');
        wrapper.className = index === 0 ? 'iframe-wrapper' : 'iframe-wrapper hidden';
        wrapper.id = `wrapper-${index}`;

        const iframe = document.createElement('iframe');
        iframe.src = content.url;
        iframe.title = content.name;
        wrapper.appendChild(iframe);

        iframeContainer.appendChild(wrapper);
    });

    // エフェクトをグループ化
    const effectGroups = {
        '基本': ['fade', 'slide', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'push', 'cover', 'reveal', 'swap'],
        '3D': ['flip', 'flipX', 'cube', 'fold', 'paperRoll', 'paperRollFront', 'paperUnroll', 'paperUnrollFront'],
        '回転': ['rotate', 'rotateScale', 'fan', 'windmill', 'flipDoor', 'rotateCorner'],
        '物理': ['bounce', 'elastic', 'spring', 'throw'],
        'マスク': ['wipe', 'wipeDown', 'circle', 'diamond', 'blinds', 'blindsV', 'iris', 'clock', 'wave', 'zigzag', 'hexagon', 'spiral'],
        'フィルター': ['blur', 'pixelate', 'dissolve', 'crossFade', 'flashFade', 'colorShift'],
        'スペシャル': ['glitch', 'matrix', 'shatter', 'morph', 'newspaper', 'elementSwap', 'sandfall', 'underwater', 'burn', 'blackhole', 'punch', 'punchCombo'],
        'IFORCOM': ['iforcom', 'iforcomDot'],
        '崩壊・物理': ['collapse', 'collapsePhysics', 'iforcomSweep', 'iforcomBounce', 'iforcomChaos']
    };

    let isFirst = true;
    for (const [groupName, effectKeys] of Object.entries(effectGroups)) {
        // グループヘッダー
        const groupHeader = document.createElement('div');
        groupHeader.className = 'effect-group-header';
        groupHeader.innerHTML = `▼ ${groupName}`;
        
        const groupContainer = document.createElement('div');
        groupContainer.className = 'effect-group';

        effectKeys.forEach(key => {
            if (!effectDefinitions[key]) return;
            const effect = effectDefinitions[key];
            const btn = document.createElement('button');
            btn.className = isFirst ? 'btn effect-btn active' : 'btn effect-btn';
            btn.id = `btn-${key}`;
            btn.onclick = () => setEffect(key);
            btn.textContent = effect.name;
            groupContainer.appendChild(btn);
            isFirst = false;
        });

        // 折りたたみ機能
        groupHeader.onclick = () => {
            const isHidden = groupContainer.style.display === 'none';
            groupContainer.style.display = isHidden ? 'grid' : 'none';
            groupHeader.innerHTML = isHidden ? `▼ ${groupName}` : `▶ ${groupName}`;
            groupHeader.style.opacity = isHidden ? '1' : '0.7';
        };

        effectButtonContainer.appendChild(groupHeader);
        effectButtonContainer.appendChild(groupContainer);
    }

    // 初期表示コンテンツ名を設定
    document.getElementById('currentContent').textContent = iframeContents[0].name;
}

// エフェクト選択
function setEffect(effect) {
    currentEffect = effect;
    document.getElementById('currentEffect').textContent = effectDefinitions[effect].name;
    
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.effect-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${effect}`).classList.add('active');
}

// コンテンツ切り替え
function switchContent(newIndex) {
    if (isAnimating || newIndex === currentIndex) return;
    isAnimating = true;

    const currentWrapper = document.getElementById(`wrapper-${currentIndex}`);
    const newWrapper = document.getElementById(`wrapper-${newIndex}`);
    const container = document.getElementById('iframeContainer');

    // ページボタンのアクティブ状態を更新
    document.querySelectorAll('.page-list .btn').forEach(btn => btn.classList.remove('active'));
    const pageBtn = document.getElementById(`page-btn-${newIndex}`);
    if (pageBtn) pageBtn.classList.add('active');

    // エフェクト適用
    const effectFunction = effects[currentEffect];
    if (effectFunction) {
        effectFunction(currentWrapper, newWrapper, container);
    } else {
        effects.fade(currentWrapper, newWrapper);
    }

    currentIndex = newIndex;
    document.getElementById('currentContent').textContent = iframeContents[newIndex].name;
}

// アニメーション終了処理
function finishAnimation(current, resetProps = {}) {
    current.classList.add('hidden');
    // hidden状態ではinline styleをクリアしてCSSクラスに任せる
    gsap.set(current, { clearProps: 'opacity,visibility,transform' });
    isAnimating = false;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // コンテンツを動的に生成
    initializeContent();
    // GSAP初期設定
    gsap.set('.iframe-wrapper:not(.hidden)', { opacity: 1 });
});
