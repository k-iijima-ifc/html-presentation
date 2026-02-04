/**
 * エフェクトレジストリ
 * 全エフェクトを一元管理するシステム
 * 
 * @example
 * // エフェクトの登録
 * effectRegistry.register('myEffect', myEffectFunction, { 
 *     name: '表示名', 
 *     category: 'basic' 
 * });
 * 
 * // エフェクトの取得
 * const fn = effectRegistry.get('fade');
 * 
 * // 全エフェクト一覧
 * const all = effectRegistry.getAll();
 */
const effectRegistry = {
    effects: {},
    
    /**
     * エフェクトを登録
     * @param {string} name - エフェクトID
     * @param {Function} fn - エフェクト関数 (current, next, container) => void
     * @param {Object} options - オプション
     * @param {string} options.name - 表示名
     * @param {string} options.category - カテゴリ
     */
    register: function(name, fn, options = {}) {
        this.effects[name] = {
            fn: fn,
            name: options.name || name,
            category: options.category || 'other'
        };
    },
    
    /**
     * エフェクト関数を取得
     * @param {string} name - エフェクトID
     * @returns {Function|undefined}
     */
    get: function(name) {
        return this.effects[name]?.fn;
    },
    
    /**
     * 全エフェクト情報を取得
     * @returns {Object}
     */
    getAll: function() {
        return this.effects;
    },
    
    /**
     * エフェクトID一覧を取得
     * @returns {string[]}
     */
    list: function() {
        return Object.keys(this.effects);
    }
};

// グローバルに公開
window.effectRegistry = effectRegistry;

// iframeキャプチャ（親/子メッセージフォールバック対応）
async function captureIframeCanvas(iframe, width, height) {
    if (!iframe) return null;

    const tryDirectCapture = async () => {
        if (typeof html2canvas === 'undefined') return null;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body) return null;
        return await html2canvas(doc.documentElement, {
            width,
            height,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
        });
    };

    try {
        const directCanvas = await tryDirectCapture();
        if (directCanvas) return directCanvas;
    } catch (e) {}

    const dataUrl = await requestIframeCapture(iframe, width, height);
    if (!dataUrl) return null;

    const img = new Image();
    img.src = dataUrl;
    if (img.decode) {
        try { await img.decode(); } catch (e) {}
    } else {
        await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

function requestIframeCapture(iframe, width, height) {
    return new Promise(resolve => {
        const targetWindow = iframe.contentWindow;
        if (!targetWindow) {
            resolve(null);
            return;
        }

        const requestId = `cap_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        let settled = false;

        const cleanup = () => {
            if (settled) return;
            settled = true;
            window.removeEventListener('message', onMessage);
        };

        const onMessage = (event) => {
            if (event.source !== targetWindow) return;
            const data = event.data;
            if (!data || data.type !== 'CAPTURE_RESPONSE' || data.id !== requestId) return;
            cleanup();
            resolve(data.dataUrl || null);
        };

        window.addEventListener('message', onMessage);
        targetWindow.postMessage({
            type: 'CAPTURE_REQUEST',
            id: requestId,
            width,
            height
        }, '*');

        setTimeout(() => {
            cleanup();
            resolve(null);
        }, 1500);
    });
}

window.captureIframeCanvas = captureIframeCanvas;
