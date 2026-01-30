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
