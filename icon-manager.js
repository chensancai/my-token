/**
 * 图标管理器 (icon-manager.js)
 * 用于读取和管理自定义图标配置
 */

(function(global) {
    'use strict';
    
    var ICON_STORAGE_KEY = 'pray_icons_v1';
    
    // 默认图标配置
    var DEFAULT_ICONS = {
        flower: '🌸',
        lamp: '🪔',
        incense: '🪬',
        fruit: '🍇',
        dessert: '🥮',
        tea: '🍵',
        candle: '🕯️',
        fish: '🐟',
        bell: '🔔',
        avatar: '🙏',
        finger: '👆',
        blessing: '🙏'
    };
    
    // 默认文本配置
    var DEFAULT_TEXTS = {
        bannerText: '功德无量|福泽后代|善念感召|诸事顺遂|万事如意',
        welcomeText: '愿您今日平安喜乐'
    };
    
    // 缓存
    var cachedIcons = null;
    
    /**
     * 获取所有图标配置
     */
    function getIcons() {
        if (cachedIcons) {
            return cachedIcons;
        }
        
        try {
            var saved = localStorage.getItem(ICON_STORAGE_KEY);
            if (saved) {
                cachedIcons = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS, JSON.parse(saved));
            } else {
                cachedIcons = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS);
            }
        } catch (e) {
            cachedIcons = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS);
        }
        
        return cachedIcons;
    }
    
    /**
     * 获取单个图标
     * @param {string} name - 图标名称
     * @returns {string} - 图标emoji
     */
    function getIcon(name) {
        var icons = getIcons();
        return icons[name] || DEFAULT_ICONS[name] || '?';
    }
    
    /**
     * 获取祝福语文本数组
     * @returns {string[]} - 祝福语文本数组
     */
    function getBannerTexts() {
        var icons = getIcons();
        var text = icons.bannerText || DEFAULT_TEXTS.bannerText;
        return text.split('|').filter(function(t) { return t.trim(); });
    }
    
    /**
     * 获取每日欢迎语
     * @returns {string} - 欢迎语文本
     */
    function getWelcomeText() {
        var icons = getIcons();
        return icons.welcomeText || DEFAULT_TEXTS.welcomeText;
    }
    
    /**
     * 清除缓存（保存后调用）
     */
    function clearCache() {
        cachedIcons = null;
    }
    
    /**
     * 刷新图标配置
     */
    function refresh() {
        cachedIcons = null;
        return getIcons();
    }
    
    // 导出
    var IconManager = {
        getIcons: getIcons,
        getIcon: getIcon,
        getBannerTexts: getBannerTexts,
        getWelcomeText: getWelcomeText,
        clearCache: clearCache,
        refresh: refresh,
        DEFAULT_ICONS: DEFAULT_ICONS,
        DEFAULT_TEXTS: DEFAULT_TEXTS
    };
    
    global.IconManager = IconManager;
    
})(typeof window !== 'undefined' ? window : this);
