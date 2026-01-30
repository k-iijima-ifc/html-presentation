// メインスクリプト - 初期化と共通処理
// effectRegistryを使用した個別ファイル読み込み版

// 設定
let currentIndex = 0;
let currentEffect = 'fade';
let isAnimating = false;
let effectDefinitions = {};
let effects = {};

// effectRegistryからエフェクト情報を初期化
function initializeEffects() {
    const allEffects = effectRegistry.getAll();
    for (const [key, value] of Object.entries(allEffects)) {
        effectDefinitions[key] = {
            name: value.name,
            category: value.category
        };
        effects[key] = value.fn;
    }
}

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

    // エフェクトをグループ化（実際に登録されているエフェクトのみ表示）
    const effectGroups = {
        '基本': ['fade', 'slide', 'slideUp', 'zoom', 'zoomOut'],
        '3D': ['flip', 'flipX', 'cube', 'fold', 'paperRoll', 'paperRollFront', 'paperUnroll', 'paperUnrollFront'],
        '回転': ['rotate', 'spiral', 'windmill'],
        '物理': ['bounce', 'elastic', 'swing'],
        'マスク': ['curtain', 'iris', 'wipe', 'diamond', 'blinds'],
        'フィルター': ['blur', 'pixelate', 'flash'],
        'スペシャル': ['glitch', 'matrix', 'shatter', 'morph', 'newspaper', 'elementSwap', 'sandfall', 'underwater', 'burn', 'blackhole', 'punch', 'punchCombo'],
        'IFORCOM': ['iforcom', 'iforcomDot', 'iforcomSweep'],
        '崩壊': ['collapse', 'collapsePhysics']
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
    // effectRegistryからエフェクトを読み込み
    initializeEffects();
    // コンテンツを動的に生成
    initializeContent();
    // GSAP初期設定
    gsap.set('.iframe-wrapper:not(.hidden)', { opacity: 1 });
});
