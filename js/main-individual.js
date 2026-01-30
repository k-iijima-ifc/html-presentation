/**
 * メインスクリプト（個別版）
 * effectRegistryからエフェクトを取得して実行
 */

let currentPage = 0;
const totalPages = 4;
let isAnimating = false;

const container = document.getElementById('iframeContainer');
const effectSelect = document.getElementById('effectSelect');

// finishAnimation関数（グローバル）
function finishAnimation(current, resetProps = {}) {
    current.classList.add('hidden');
    gsap.set(current, { opacity: 1, ...resetProps });
    isAnimating = false;
    updatePageIndicator();
}

// ページインジケータ更新
function updatePageIndicator() {
    document.querySelectorAll('.page-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPage);
    });
}

// エフェクトセレクタを構築
function buildEffectSelector() {
    const effects = effectRegistry.getAll();
    const categories = {};
    
    // カテゴリ別にグループ化
    Object.entries(effects).forEach(([key, effect]) => {
        const category = effect.category || 'other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ key, name: effect.name });
    });
    
    // カテゴリ順序
    const categoryOrder = ['basic', '3d', 'rotate', 'physics', 'mask', 'filter', 'special'];
    const categoryNames = {
        'basic': '🎯 基本エフェクト',
        '3d': '🎲 3Dエフェクト',
        'rotate': '🔄 回転エフェクト',
        'physics': '⚡ 物理エフェクト',
        'mask': '🎭 マスクエフェクト',
        'filter': '🌈 フィルターエフェクト',
        'special': '✨ スペシャルエフェクト',
        'other': '📦 その他'
    };
    
    effectSelect.innerHTML = '';
    
    categoryOrder.forEach(category => {
        if (categories[category] && categories[category].length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryNames[category] || category;
            
            categories[category].forEach(effect => {
                const option = document.createElement('option');
                option.value = effect.key;
                option.textContent = effect.name;
                optgroup.appendChild(option);
            });
            
            effectSelect.appendChild(optgroup);
        }
    });
    
    // その他
    if (categories['other'] && categories['other'].length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryNames['other'];
        
        categories['other'].forEach(effect => {
            const option = document.createElement('option');
            option.value = effect.key;
            option.textContent = effect.name;
            optgroup.appendChild(option);
        });
        
        effectSelect.appendChild(optgroup);
    }
}

// エフェクト実行
async function runEffect(direction = 1) {
    if (isAnimating) return;
    isAnimating = true;
    
    const effectName = effectSelect.value;
    const effectFn = effectRegistry.get(effectName);
    
    if (!effectFn) {
        console.error(`Effect "${effectName}" not found`);
        isAnimating = false;
        return;
    }
    
    const current = document.getElementById(`page${currentPage}`);
    const nextPage = (currentPage + direction + totalPages) % totalPages;
    const next = document.getElementById(`page${nextPage}`);
    
    currentPage = nextPage;
    
    // エフェクト名を元に関数を呼び出し
    try {
        await effectFn(current, next, container);
    } catch (e) {
        console.error(`Effect "${effectName}" error:`, e);
        // エラー時はフォールバック
        next.classList.remove('hidden');
        gsap.set(next, { opacity: 1 });
        finishAnimation(current);
    }
}

// イベントリスナー
document.getElementById('nextBtn').addEventListener('click', () => runEffect(1));
document.getElementById('prevBtn').addEventListener('click', () => runEffect(-1));

document.querySelectorAll('.page-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        if (isAnimating) return;
        const targetPage = parseInt(dot.dataset.page);
        if (targetPage === currentPage) return;
        
        const direction = targetPage > currentPage ? 1 : -1;
        currentPage = (targetPage - direction + totalPages) % totalPages;
        runEffect(direction);
    });
});

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        runEffect(1);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        runEffect(-1);
    }
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    buildEffectSelector();
    updatePageIndicator();
    console.log(`個別版エフェクトデモ起動: ${effectRegistry.list().length} 件のエフェクトが読み込まれました`);
});
