/**
 * 個別エフェクトインデックス
 * すべての個別エフェクトファイルを読み込み、effectRegistryに登録する
 */

// エフェクトレジストリ
const effectRegistry = {
    effects: {},
    
    register: function(name, fn, options = {}) {
        this.effects[name] = {
            fn: fn,
            name: options.name || name,
            category: options.category || 'other'
        };
    },
    
    get: function(name) {
        return this.effects[name]?.fn;
    },
    
    getAll: function() {
        return this.effects;
    },
    
    list: function() {
        return Object.keys(this.effects);
    }
};

// グローバルに公開
window.effectRegistry = effectRegistry;
