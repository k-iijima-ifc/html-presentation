/**
 * メインスクリプト
 * iframeエフェクト切り替えデモのコア処理
 * 
 * 依存: effectRegistry (js/effects/index.js)
 *       iframeContents (iframe-config.js)
 *       GSAP (外部ライブラリ)
 */

// 状態管理
let currentIndex = 0;      // 現在表示中のコンテンツインデックス
let currentEffect = 'fade'; // 現在選択中のエフェクト
let isAnimating = false;   // アニメーション中フラグ
let effectDefinitions = {}; // エフェクト定義（名前・カテゴリ）
let effects = {};          // エフェクト関数マップ

/**
 * ES Modulesエフェクトの読み込みを待機
 * ES Modulesは非同期で読み込まれるため、window.effect_xxx が定義されるまで待つ
 */
async function waitForESModuleEffects() {
    const esModuleEffects = ['effect_paperRoll', 'effect_paperRollFront', 'effect_rainRipple'];
    const maxWait = 5000; // 最大5秒待機
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
        const allLoaded = esModuleEffects.every(name => typeof window[name] === 'function');
        if (allLoaded) return true;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // タイムアウト時は利用可能なものだけで続行
    console.warn('Some ES Module effects did not load in time');
    return false;
}

/**
 * effectRegistryからエフェクト情報を読み込み
 */
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
        btn.textContent = content.name;
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
        '3D': ['flip', 'flipX', 'cube', 'fold', 'paperRoll', 'paperRollFront'],
        '回転': ['rotate', 'spiral', 'windmill'],
        '物理': ['bounce', 'elastic', 'swing'],
        'マスク': ['curtain', 'iris', 'wipe', 'diamond', 'blinds'],
        'フィルター': ['blur', 'pixelate', 'flash'],
        'スペシャル': ['glitch', 'matrix', 'shatter', 'morph', 'newspaper', 'elementSwap', 'sandfall', 'underwater', 'burn', 'blackhole', 'rainRipple', 'snow', 'punch', 'punchCombo'],
        'スプライト': ['sprite1', 'sprite2'],
        '崩壊': ['collapse', 'collapsePhysics'],
        'IFORCOM': ['iforcom', 'iforcomDot', 'iforcomSweep', 'iforcomChain']
    };

    const groupKeyMap = {
        '基本': 'basic',
        '3D': '3d',
        '回転': 'rotate',
        '物理': 'physics',
        'マスク': 'mask',
        'フィルター': 'filter',
        'スペシャル': 'special',
        'スプライト': 'sprite',
        '崩壊': 'collapse',
        'IFORCOM': 'iforcom'
    };

    let isFirst = true;
    for (const [groupName, effectKeys] of Object.entries(effectGroups)) {
        // グループヘッダー
        const groupHeader = document.createElement('div');
        groupHeader.className = 'effect-group-header';
        groupHeader.innerHTML = `▼ ${groupName}`;
        const groupKey = groupKeyMap[groupName] || 'other';
        groupHeader.dataset.group = groupKey;
        
        const groupContainer = document.createElement('div');
        groupContainer.className = 'effect-group';
        groupContainer.dataset.group = groupKey;

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
    document.querySelectorAll('.page-tabs .btn').forEach(btn => btn.classList.remove('active'));
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
document.addEventListener('DOMContentLoaded', async () => {
    // ES Modulesエフェクトの読み込みを待機
    await waitForESModuleEffects();
    // effectRegistryからエフェクトを読み込み
    initializeEffects();
    // コンテンツを動的に生成
    initializeContent();
    // GSAP初期設定
    gsap.set('.iframe-wrapper:not(.hidden)', { opacity: 1 });
});
