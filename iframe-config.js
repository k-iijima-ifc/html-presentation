// iframeコンテンツ設定ファイル
// 表示したいサイトをここで管理できます

const iframeContents = [
    // ローカルサンプルページ（同一オリジン - キャプチャ可能）
    {
        name: 'ニュース',
        url: 'samples/page1-news.html',
        icon: '📰'
    },
    {
        name: 'ダッシュボード',
        url: 'samples/page2-dashboard.html',
        icon: '📊'
    },
    {
        name: 'ECサイト',
        url: 'samples/page3-shop.html',
        icon: '🛒'
    },
    {
        name: 'SNS',
        url: 'samples/page4-sns.html',
        icon: '📸'
    }
    // 外部サイト（クロスオリジン - キャプチャ不可、フォールバック使用）
    // {
    //     name: 'Google',
    //     url: 'https://www.google.com/webhp?igu=1',
    //     icon: '🔍'
    // }
];

// 設定をエクスポート（モジュールとして使用する場合）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { iframeContents };
}
