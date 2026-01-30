/**
 * エフェクト統合ファイル
 * 
 * 個別のエフェクトファイルを読み込み、全エフェクトを統合します。
 * 各エフェクトは individual/ フォルダに1ファイル1エフェクトで配置されています。
 */

// 全エフェクト定義を結合
const effectDefinitions = {
    // 基本エフェクト
    ...fadeEffectDefinition,
    ...slideEffectDefinition,
    ...slideUpEffectDefinition,
    ...zoomEffectDefinition,
    ...zoomOutEffectDefinition,
    
    // 3Dエフェクト
    ...flipEffectDefinition,
    ...flipXEffectDefinition,
    ...cubeEffectDefinition,
    ...foldEffectDefinition,
    
    // 回転エフェクト
    ...rotateEffectDefinition,
    ...spiralEffectDefinition,
    ...windmillEffectDefinition,
    
    // 物理エフェクト
    ...bounceEffectDefinition,
    ...elasticEffectDefinition,
    ...swingEffectDefinition,
    
    // マスクエフェクト
    ...curtainEffectDefinition,
    ...irisEffectDefinition,
    ...wipeEffectDefinition,
    ...diamondEffectDefinition,
    ...blindsEffectDefinition,
    
    // フィルターエフェクト
    ...blurEffectDefinition,
    ...pixelateEffectDefinition,
    ...flashEffectDefinition,
    
    // スペシャルエフェクト
    ...glitchEffectDefinition,
    ...matrixEffectDefinition,
    ...shatterEffectDefinition,
    ...morphEffectDefinition,
    ...newspaperEffectDefinition
};

// 全エフェクト関数を結合
const effects = {
    // 基本エフェクト
    ...fadeEffect,
    ...slideEffect,
    ...slideUpEffect,
    ...zoomEffect,
    ...zoomOutEffect,
    
    // 3Dエフェクト
    ...flipEffect,
    ...flipXEffect,
    ...cubeEffect,
    ...foldEffect,
    
    // 回転エフェクト
    ...rotateEffect,
    ...spiralEffect,
    ...windmillEffect,
    
    // 物理エフェクト
    ...bounceEffect,
    ...elasticEffect,
    ...swingEffect,
    
    // マスクエフェクト
    ...curtainEffect,
    ...irisEffect,
    ...wipeEffect,
    ...diamondEffect,
    ...blindsEffect,
    
    // フィルターエフェクト
    ...blurEffect,
    ...pixelateEffect,
    ...flashEffect,
    
    // スペシャルエフェクト
    ...glitchEffect,
    ...matrixEffect,
    ...shatterEffect,
    ...morphEffect,
    ...newspaperEffect
};

// エフェクトグループ定義（UIでのカテゴリ表示用）
const effectGroups = {
    '基本': ['fade', 'slide', 'slideUp', 'zoom', 'zoomOut'],
    '3D': ['flip', 'flipX', 'cube', 'fold'],
    '回転': ['rotate', 'spiral', 'windmill'],
    '物理': ['bounce', 'elastic', 'swing'],
    'マスク': ['curtain', 'iris', 'wipe', 'diamond', 'blinds'],
    'フィルター': ['blur', 'pixelate', 'flash'],
    'スペシャル': ['glitch', 'matrix', 'shatter', 'morph', 'newspaper']
};

console.log('Effects loaded:', Object.keys(effects).length, 'effects');
