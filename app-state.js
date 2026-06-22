/* =====================================================================
 * 「祈个福」全局状态管理 (app-state.js)
 * ---------------------------------------------------------------------
 * 作用范围：
 *   1) 维护全局 GlobalState（用户 / 资产 / 设置 / 每日计数 / 管理配置）
 *   2) 通过 localStorage 持久化（key: global_pray_state_v2）
 *   3) 提供统一的飘字、充值、音效、页面跳转、每日欢迎、翻牌奖励
 * 适用页面：index.html / remembrance.html / animal-release.html 等
 * ===================================================================== */

(function (global) {
    'use strict';

    /* -------------------- 1. 常量与默认状态 -------------------- */

    // localStorage 键名
    var STORAGE_KEY = 'global_pray_state_v2';

    // 默认状态对象（首次进入或读取失败时使用）
    var DEFAULT_STATE = {
        user: {
            name: '游客',
            id: '',
            avatar: '🙏',
            isRegistered: false,
            level: 1
        },
        assets: {
            huaxi: 100,        // 欢喜余额（货币）
            foguang: 0,        // 佛光值
            merit: 0,          // 功德等级
            meritProgress: 0   // 功德进度（0~100）
        },
        settings: {
            soundEnabled: true,
            notifEnabled: true
        },
        daily: {
            lastDate: '',      // YYYY-MM-DD
            worshipCount: 0,   // 拜佛次数
            askCount: 0,       // 求签次数
            dialogCount: 0     // 对话次数
        },
        admin: {
            isSuperAdmin: false,
            isAdmin: false,
            config: {}
        }
    };

    // 全局运行时状态对象（由 loadState 初始化）
    var GlobalState = null;

    // 音效音频对象（延迟创建，避免首次交互前被浏览器拦截）
    var _soundMap = {
        bell: null,    // 钟声
        chant: null,   // 咒音
        click: null    // 点击音
    };

    /* -------------------- 2. 基础工具函数 -------------------- */

    // 深拷贝（仅支持 JSON 可序列化的数据）
    function _deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // 合并默认值：target 缺失的字段/子字段用 def 补齐
    function _mergeDeep(target, def) {
        for (var key in def) {
            if (!def.hasOwnProperty(key)) continue;
            if (typeof def[key] === 'object' && def[key] !== null && !Array.isArray(def[key])) {
                if (typeof target[key] !== 'object' || target[key] === null) {
                    target[key] = {};
                }
                _mergeDeep(target[key], def[key]);
            } else {
                if (target[key] === undefined) {
                    target[key] = def[key];
                }
            }
        }
        return target;
    }

    // 获取今日日期字符串：YYYY-MM-DD
    function _todayString() {
        var d = new Date();
        var y = d.getFullYear();
        var m = (d.getMonth() + 1).toString().padStart(2, '0');
        var day = d.getDate().toString().padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    /* -------------------- 3. 状态读写 -------------------- */

    /**
     * 从 localStorage 读取全局状态
     * 若不存在或解析失败，则基于 DEFAULT_STATE 返回新对象
     */
    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                GlobalState = _deepClone(DEFAULT_STATE);
            } else {
                var parsed = JSON.parse(raw);
                // 将已有的数据与默认结构合并，避免字段缺失
                GlobalState = _mergeDeep(parsed || {}, _deepClone(DEFAULT_STATE));
            }
        } catch (e) {
            GlobalState = _deepClone(DEFAULT_STATE);
        }
        // 补齐用户 ID（首次进入时生成一个简易随机 ID）
        if (!GlobalState.user.id) {
            GlobalState.user.id = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        }
        return GlobalState;
    }

    /**
     * 将当前 GlobalState 写入 localStorage
     */
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(GlobalState));
            return true;
        } catch (e) {
            return false;
        }
    }

    /* -------------------- 4. 佛光 / 欢喜 / 功德 -------------------- */

    // 获取佛光值
    function getFoguang() {
        return GlobalState.assets.foguang | 0;
    }
    // 设置佛光值
    function setFoguang(val) {
        GlobalState.assets.foguang = Math.max(0, val | 0);
        saveState();
        return GlobalState.assets.foguang;
    }
    // 增加佛光值（可为负数）
    function addFoguang(n) {
        GlobalState.assets.foguang = Math.max(0, (GlobalState.assets.foguang | 0) + (n | 0));
        saveState();
        return GlobalState.assets.foguang;
    }

    // 获取欢喜余额
    function getHuaxi() {
        return GlobalState.assets.huaxi | 0;
    }
    // 设置欢喜余额
    function setHuaxi(val) {
        GlobalState.assets.huaxi = Math.max(0, val | 0);
        saveState();
        return GlobalState.assets.huaxi;
    }
    // 增加欢喜余额（可为负数）
    function addHuaxi(n) {
        GlobalState.assets.huaxi = Math.max(0, (GlobalState.assets.huaxi | 0) + (n | 0));
        saveState();
        return GlobalState.assets.huaxi;
    }
    // 消耗欢喜；余额不足时返回 false 并不扣减
    function spendHuaxi(n) {
        n = n | 0;
        if (n <= 0) return true;
        if ((GlobalState.assets.huaxi | 0) < n) return false;
        GlobalState.assets.huaxi = (GlobalState.assets.huaxi | 0) - n;
        saveState();
        return true;
    }

    // 增长功德（每积累 100 点进度自动升一级）
    function addMeritProgress(n) {
        n = n | 0;
        GlobalState.assets.meritProgress = (GlobalState.assets.meritProgress | 0) + n;
        while (GlobalState.assets.meritProgress >= 100) {
            GlobalState.assets.meritProgress -= 100;
            GlobalState.assets.merit = (GlobalState.assets.merit | 0) + 1;
        }
        saveState();
        return { merit: GlobalState.assets.merit, meritProgress: GlobalState.assets.meritProgress };
    }

    /* -------------------- 5. 每日计数与跨日重置 -------------------- */

    /**
     * 检查是否跨日，若是则重置每日计数并更新 lastDate
     * 返回：true 表示发生了重置，false 表示仍是同一天
     */
    function checkDailyReset() {
        var today = _todayString();
        if (GlobalState.daily.lastDate !== today) {
            GlobalState.daily.lastDate = today;
            GlobalState.daily.worshipCount = 0;
            GlobalState.daily.askCount = 0;
            GlobalState.daily.dialogCount = 0;
            saveState();
            return true;
        }
        return false;
    }

    // 记录一次拜佛（自动先调用跨日检查）
    function incWorship() {
        checkDailyReset();
        GlobalState.daily.worshipCount = (GlobalState.daily.worshipCount | 0) + 1;
        saveState();
        return GlobalState.daily.worshipCount;
    }
    // 记录一次求签
    function incAsk() {
        checkDailyReset();
        GlobalState.daily.askCount = (GlobalState.daily.askCount | 0) + 1;
        saveState();
        return GlobalState.daily.askCount;
    }
    // 记录一次对话
    function incDialog() {
        checkDailyReset();
        GlobalState.daily.dialogCount = (GlobalState.daily.dialogCount | 0) + 1;
        saveState();
        return GlobalState.daily.dialogCount;
    }

    /* -------------------- 6. 飘字动画 -------------------- */

    /**
     * 在屏幕中央偏上位置显示飘字
     * @param {string} text  文本内容
     * @param {string} color 可选颜色（默认金色 #FFD700）
     */
    function showFloatingText(text, color) {
        if (!text) return;
        var el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;
        el.style.color = color || '#FFD700';
        // 居中并略向上偏移
        el.style.left = '50%';
        el.style.top = '40%';
        el.style.transform = 'translateX(-50%)';
        el.style.position = 'fixed';
        // 加入轻微随机水平偏移，避免多次飘字完全重叠
        var jitter = (Math.random() - 0.5) * 40;
        el.style.marginLeft = jitter + 'px';

        // 确保已有 .floating-text 样式；若未引入 style.css，则兜底写入内联动画
        if (!document.getElementById('_pray_floating_css')) {
            var style = document.createElement('style');
            style.id = '_pray_floating_css';
            style.textContent = [
                '.floating-text {',
                '  font-size: 18px; font-weight: bold;',
                '  text-shadow: 0 0 6px #FF8C00, 0 2px 4px rgba(0,0,0,0.6);',
                '  pointer-events: none; z-index: 9999; white-space: nowrap;',
                '  animation: _prayFloatUp 1.6s ease-out forwards;',
                '}',
                '@keyframes _prayFloatUp {',
                '  0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }',
                '  20% { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }',
                '  100% { transform: translate(-50%, -80px) scale(1); opacity: 0; }',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        }

        document.body.appendChild(el);
        // 动画结束后自动移除
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1700);
    }

    /* -------------------- 7. 充值面板 -------------------- */

    // 充值档位（金额单位：元；欢喜按 1 元 ≈ 1 欢喜 计算，更高档位有赠送）
    var RECHARGE_TIERS = [
        { price: 60,   huaxi: 60,   label: '小善',   highlight: false },
        { price: 200,  huaxi: 220,  label: '中善',   highlight: false },
        { price: 500,  huaxi: 600,  label: '大善',   highlight: true  },
        { price: 1000, huaxi: 1500, label: '功德圆满', highlight: true }
    ];

    /**
     * 显示充值面板
     * @param {number} amount 可选：期望至少获得的欢喜数量（仅用于文案提示）
     */
    function showRechargeModal(amount) {
        // 若已存在弹窗则先移除
        var old = document.getElementById('_pray_recharge_modal');
        if (old) old.parentNode.removeChild(old);

        // 构建遮罩与卡片
        var overlay = document.createElement('div');
        overlay.id = '_pray_recharge_modal';
        overlay.className = 'modal-overlay';
        overlay.style.cssText = [
            'position:fixed; top:0; left:0; right:0; bottom:0;',
            'background:rgba(0,0,0,0.55); z-index:2000;',
            'display:flex; align-items:flex-end; justify-content:center;',
            'opacity:0; transition:opacity .25s ease-out; pointer-events:auto;'
        ].join('');

        var card = document.createElement('div');
        card.style.cssText = [
            'width:100%; max-width:480px;',
            'background:linear-gradient(180deg,#FFF8DC 0%,#F5DEB3 100%);',
            'border-radius:20px 20px 0 0; padding:18px 16px 20px;',
            'box-shadow:0 -6px 20px rgba(139,69,19,0.3);',
            'transform:translateY(100%); transition:transform .3s cubic-bezier(0.22,1,0.36,1);'
        ].join('');

        // 标题 + 关闭按钮
        var header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:2px solid #D4AF37; margin-bottom:14px;';
        var title = document.createElement('div');
        title.textContent = '💰 充值欢喜';
        title.style.cssText = 'font-size:18px; font-weight:bold; color:#8B4513; letter-spacing:2px;';
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'width:30px; height:30px; border-radius:50%; border:none; background:rgba(139,69,19,0.3); color:#FFF; font-size:22px; cursor:pointer;';
        header.appendChild(title);
        header.appendChild(closeBtn);
        card.appendChild(header);

        // 提示文案
        if (amount && amount > 0) {
            var hint = document.createElement('div');
            hint.textContent = '当前欢喜不足 ' + amount + '，请选择充值套餐：';
            hint.style.cssText = 'color:#8B4513; font-size:13px; text-align:center; margin-bottom:14px;';
            card.appendChild(hint);
        }

        // 档位网格
        var grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:16px;';
        RECHARGE_TIERS.forEach(function (tier) {
            var item = document.createElement('div');
            item.style.cssText = [
                'padding:14px 10px; border-radius:12px; text-align:center; cursor:pointer;',
                'border:2px solid ' + (tier.highlight ? '#FF6347' : '#D4AF37') + ';',
                'background:' + (tier.highlight ? 'linear-gradient(135deg,#FFD700,#FFA500)' : '#FFF8DC') + ';',
                'transition:transform .15s;'
            ].join('');
            item.innerHTML = [
                '<div style="font-size:12px; color:#8B4513; font-weight:bold;">' + tier.label + '</div>',
                '<div style="font-size:20px; font-weight:bold; color:' + (tier.highlight ? '#8B0000' : '#8B4513') + '; margin:4px 0;">' + tier.huaxi + '</div>',
                '<div style="font-size:12px; color:#666;">¥' + tier.price + '</div>'
            ].join('');
            item.addEventListener('click', function () {
                _handleRecharge(tier);
                _closeRecharge(overlay);
            });
            grid.appendChild(item);
        });
        card.appendChild(grid);

        // 底部说明 + 取消
        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex; gap:10px;';
        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = '暂不充值';
        cancelBtn.style.cssText = 'flex:1; padding:12px; border-radius:25px; border:none; background:#EEE; color:#8B4513; font-size:14px; font-weight:bold; cursor:pointer;';
        cancelBtn.addEventListener('click', function () { _closeRecharge(overlay); });
        footer.appendChild(cancelBtn);
        card.appendChild(footer);

        // 关闭事件
        closeBtn.addEventListener('click', function () { _closeRecharge(overlay); });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) _closeRecharge(overlay);
        });

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // 触发动画
        setTimeout(function () {
            overlay.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 10);
    }

    // 关闭充值面板
    function _closeRecharge(overlay) {
        if (!overlay) return;
        overlay.style.opacity = '0';
        var card = overlay.querySelector('div');
        if (card) card.style.transform = 'translateY(100%)';
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    }

    // 处理充值成功（此处为前端模拟；真实环境调用后端接口）
    function _handleRecharge(tier) {
        addHuaxi(tier.huaxi);
        playSound('bell');
        showFloatingText('+ ' + tier.huaxi + ' 欢喜 🌸', '#FFD700');
    }

    /* -------------------- 8. 统一音效播放 -------------------- */

    /**
     * 播放音效
     * @param {'bell'|'chant'|'click'} type
     */
    function playSound(type) {
        // 音效开关
        if (!GlobalState.settings.soundEnabled) return;
        // 允许的类型
        if (!_soundMap.hasOwnProperty(type)) return;

        try {
            var audio = _soundMap[type];
            if (!audio) {
                audio = new Audio();
                // 使用简短可播放的 Data URI（静音），避免因资源缺失导致控制台报错
                // 真实接入时，可将 src 替换为对应的音频文件路径
                audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
                audio.volume = 0.6;
                _soundMap[type] = audio;
            }
            // 从头播放
            try { audio.currentTime = 0; } catch (e) {}
            var p = audio.play();
            if (p && typeof p.catch === 'function') {
                p.catch(function () { /* 浏览器可能拒绝无交互时播放，静默 */ });
            }
        } catch (e) {
            // 音频播放失败时，降级为飘字
            showFloatingText('🔔', '#FFD700');
        }
    }

    // 开启 / 关闭音效
    function toggleSound() {
        GlobalState.settings.soundEnabled = !GlobalState.settings.soundEnabled;
        saveState();
        return GlobalState.settings.soundEnabled;
    }
    function setSoundEnabled(flag) {
        GlobalState.settings.soundEnabled = !!flag;
        saveState();
        return GlobalState.settings.soundEnabled;
    }

    /* -------------------- 9. 页面导航 -------------------- */

    // 根目录下各页面相对路径
    var PAGE_PATH = {
        pray:     'index.html',
        remembrance:   'remembrance.html',
        animal: 'animal-release.html',
        angel:  'angel.html',
        profile:'profile.html',
        settings: 'settings.html',
        admin:  'admin.html'
    };

    function _navTo(page) {
        var url = PAGE_PATH[page];
        if (!url) return;
        // 先保存一次，避免用户还有未落地的修改
        saveState();
        window.location.href = url;
    }

    function goPray()          { _navTo('pray'); }
    function goRemembrance()   { _navTo('remembrance'); }
    function goAnimal()        { _navTo('animal'); }
    function goAngel()         { _navTo('angel'); }
    function goProfile()       { _navTo('profile'); }
    function goSettings()      { _navTo('settings'); }
    function goAdmin()         { _navTo('admin'); }

    /* -------------------- 10. 每日欢迎弹窗 -------------------- */

    // 今日节庆文案（可按需扩展；此处为简化版）
    function _todayGreeting() {
        var d = new Date();
        var md = (d.getMonth() + 1) + '-' + d.getDate();
        var map = {
            '1-1':   '🎉 元旦吉祥，新年快乐！',
            '2-14':  '💖 愿有情人终成眷属',
            '4-5':   '🌿 清明安康',
            '5-1':   '🌸 劳动节快乐',
            '6-1':   '🧒 儿童节快乐',
            '8-15':  '🥮 中秋团圆',
            '10-1':  '🎊 国庆快乐',
            '12-25': '🎄 圣诞快乐'
        };
        if (map[md]) return map[md];
        // 平日欢迎语
        var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return '☀️ ' + week[d.getDay()] + '好，愿您今日平安喜乐';
    }

    /**
     * 检查是否为新的一天；若是，则弹出每日欢迎卡片并赠送欢喜奖励
     */
    function checkDailyWelcome() {
        var today = _todayString();
        if (GlobalState.daily.lastDate === today) {
            // 同一天内已显示过，不再弹窗
            return false;
        }

        // 更新日期（避免重复弹窗）
        GlobalState.daily.lastDate = today;
        saveState();

        // 赠送 20 欢喜
        var reward = 20;
        addHuaxi(reward);

        // 弹出欢迎卡片（与充值面板样式一致）
        var old = document.getElementById('_pray_welcome_modal');
        if (old) old.parentNode.removeChild(old);

        var overlay = document.createElement('div');
        overlay.id = '_pray_welcome_modal';
        overlay.style.cssText = [
            'position:fixed; top:0; left:0; right:0; bottom:0;',
            'background:rgba(0,0,0,0.55); z-index:2100;',
            'display:flex; align-items:center; justify-content:center; padding:20px;',
            'opacity:0; transition:opacity .25s ease-out;'
        ].join('');

        var card = document.createElement('div');
        card.style.cssText = [
            'width:100%; max-width:340px;',
            'background:linear-gradient(180deg,#FFF8DC 0%,#FFE4B5 100%);',
            'border-radius:20px; padding:22px 20px; text-align:center;',
            'box-shadow:0 6px 20px rgba(139,69,19,0.35);',
            'transform:scale(0.8); transition:transform .3s cubic-bezier(0.22,1,0.36,1);'
        ].join('');

        card.innerHTML = [
            '<div style="font-size:48px; margin-bottom:6px;">🙏✨🌸</div>',
            '<div style="font-size:18px; font-weight:bold; color:#8B4513; margin-bottom:8px;">每日祝福</div>',
            '<div style="font-size:14px; color:#A0522D; line-height:1.7; margin-bottom:14px;">' + _todayGreeting() + '</div>',
            '<div style="display:inline-block; padding:10px 18px; border-radius:14px; background:linear-gradient(135deg,#FFD700,#FFA500); color:#8B4513; font-weight:bold; font-size:15px;">🎁 + ' + reward + ' 欢喜</div>',
            '<div style="margin-top:16px;"><button id="_pray_welcome_ok" style="padding:10px 28px; border:none; border-radius:25px; background:linear-gradient(135deg,#FF6347,#FF4500); color:#FFF; font-weight:bold; font-size:14px; cursor:pointer; box-shadow:0 4px 10px rgba(255,99,71,0.3);">收下祝福</button></div>'
        ].join('');

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        setTimeout(function () {
            overlay.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 20);

        var closeWelcome = function () {
            overlay.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 280);
            playSound('bell');
            showFloatingText('+ ' + reward + ' 欢喜 🌸', '#FFD700');
        };

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeWelcome();
        });
        // 按钮延迟绑定，确保 DOM 已插入
        setTimeout(function () {
            var btn = document.getElementById('_pray_welcome_ok');
            if (btn) btn.addEventListener('click', closeWelcome);
        }, 0);

        return true;
    }

    /* -------------------- 11. 翻牌奖励发放 -------------------- */

    /**
     * 发放福运翻牌奖励
     * @param {number} prizeValue 奖励数值（数量）
     * @param {'huaxi'|'foguang'|'merit'} prizeType  奖励类型：欢喜/佛光/功德
     */
    function grantFlipReward(prizeValue, prizeType) {
        prizeValue = prizeValue | 0;
        if (prizeValue <= 0) return;

        var text = '';
        var color = '#FFD700';

        switch (prizeType) {
            case 'huaxi':
                addHuaxi(prizeValue);
                text = '💰 +' + prizeValue + ' 欢喜';
                color = '#FF6347';
                break;
            case 'foguang':
                addFoguang(prizeValue);
                text = '🔥 +' + prizeValue + ' 佛光';
                color = '#FFD700';
                break;
            case 'merit':
                var r = addMeritProgress(prizeValue);
                text = '🌿 功德 Lv.' + r.merit + ' (+' + prizeValue + ')';
                color = '#32CD32';
                break;
            default:
                // 默认按欢喜处理
                addHuaxi(prizeValue);
                text = '+ ' + prizeValue + ' 欢喜';
                break;
        }

        playSound('bell');
        showFloatingText(text, color);
    }

    /* -------------------- 12. 用户信息便捷 API -------------------- */

    function updateUser(partial) {
        if (partial && typeof partial === 'object') {
            for (var k in partial) {
                if (partial.hasOwnProperty(k) && GlobalState.user.hasOwnProperty(k)) {
                    GlobalState.user[k] = partial[k];
                }
            }
            saveState();
        }
        return GlobalState.user;
    }

    function getUser() { return GlobalState.user; }
    function getAssets() { return GlobalState.assets; }
    function getSettings() { return GlobalState.settings; }

    /* -------------------- 13. 模块导出 -------------------- */

    var PrayApp = {
        // 常量
        STORAGE_KEY: STORAGE_KEY,
        // 状态读写
        loadState: loadState,
        saveState: saveState,
        getState: function () { return GlobalState; },
        // 佛光
        getFoguang: getFoguang,
        setFoguang: setFoguang,
        addFoguang: addFoguang,
        // 欢喜
        getHuaxi: getHuaxi,
        setHuaxi: setHuaxi,
        addHuaxi: addHuaxi,
        spendHuaxi: spendHuaxi,
        // 功德
        addMeritProgress: addMeritProgress,
        // 每日重置
        checkDailyReset: checkDailyReset,
        incWorship: incWorship,
        incAsk: incAsk,
        incDialog: incDialog,
        // 飘字 / 充值 / 音效
        showFloatingText: showFloatingText,
        showRechargeModal: showRechargeModal,
        playSound: playSound,
        toggleSound: toggleSound,
        setSoundEnabled: setSoundEnabled,
        // 导航
        goPray: goPray,
        goRemembrance: goRemembrance,
        goAnimal: goAnimal,
        goAngel: goAngel,
        goProfile: goProfile,
        goSettings: goSettings,
        goAdmin: goAdmin,
        // 每日欢迎 & 翻牌奖励
        checkDailyWelcome: checkDailyWelcome,
        grantFlipReward: grantFlipReward,
        // 用户信息
        getUser: getUser,
        updateUser: updateUser,
        getAssets: getAssets,
        getSettings: getSettings
    };

    // 同时挂到 window.PrayApp 与 module.exports（便于浏览器与打包工具）
    global.PrayApp = PrayApp;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PrayApp;
    }

    // 页面加载时自动初始化一次（延迟到 DOMContentLoaded 之后）
    function _autoInit() {
        loadState();
        // 确保每日 lastDate 有值，便于后续 checkDailyReset 逻辑
        if (!GlobalState.daily.lastDate) {
            GlobalState.daily.lastDate = _todayString();
            saveState();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoInit);
    } else {
        _autoInit();
    }

})(typeof window !== 'undefined' ? window : this);
