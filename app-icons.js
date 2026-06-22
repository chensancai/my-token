/**
 * 应用图标配置 (app-icons.js)
 * 其他页面引入此文件即可使用自定义图标
 */

(function(global) {
    'use strict';
    
    var ICON_STORAGE_KEY = 'pray_icons_v1';
    
    // 默认图标
    var DEFAULT_ICONS = {
        flower: '🌸',      // 供花
        lamp: '🪔',        // 供灯
        incense: '🪬',     // 供香
        fruit: '🍇',       // 供果
        dessert: '🥮',     // 糕点
        tea: '🍵',         // 供茶
        candle: '🕯️',      // 蜡烛按钮
        fish: '🐟',        // 放生按钮
        bell: '🔔',        // 钟声按钮
        avatar: '🙏',      // 默认头像
        finger: '👆',       // 引导手指
        blessing: '🙏'     // 祈福图标
    };
    
    // 默认文本
    var DEFAULT_TEXTS = {
        bannerText: '功德无量|福泽后代|善念感召|诸事顺遂|万事如意',
        welcomeText: '愿您今日平安喜乐'
    };
    
    // 缓存
    var _cache = null;
    
    /**
     * 获取图标（自动加载）
     */
    function getIcon(name) {
        var icons = getAll();
        return icons[name] || DEFAULT_ICONS[name] || '?';
    }
    
    /**
     * 获取所有配置
     */
    function getAll() {
        if (_cache) return _cache;
        
        try {
            var saved = localStorage.getItem(ICON_STORAGE_KEY);
            if (saved) {
                _cache = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS, JSON.parse(saved));
            } else {
                _cache = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS);
            }
        } catch (e) {
            _cache = Object.assign({}, DEFAULT_ICONS, DEFAULT_TEXTS);
        }
        
        return _cache;
    }
    
    /**
     * 刷新缓存
     */
    function refresh() {
        _cache = null;
        return getAll();
    }
    
    // 挂载到全局
    global.AppIcons = {
        get: getIcon,
        getAll: getAll,
        refresh: refresh,
        defaults: DEFAULT_ICONS
    };
    
})(typeof window !== 'undefined' ? window : this);
