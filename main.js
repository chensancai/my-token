/**
 * 祈个福 - 主交互逻辑
 * 功能：导航跳转、上香、点灯、供奉、跪拜、求签、许愿、问佛
 */

// ============ 全局状态管理 ============
const AppState = {
    user: {
        isLoggedIn: true,         // 默认已登录（游客模式）
        name: '善男信女',          // 用户名
        level: 'Lv.1 信众',        // 等级
        huanxi: 100,              // 欢喜余额（默认100供体验）
        foguang: 0,               // 佛光值
        merit: 0                   // 功德等级
    },
    scene: {
        currentBuddha: 'sakyamuni',
        isNight: false,
        weather: 'clear'
    },
    offerings: {
        incense: null,    // 香炉状态 {type, startTime, duration}
        lamp: null,       // 灯状态 {color, startTime, duration, type}
        leftVase: false,  // 左花瓶
        rightVase: false, // 右花瓶
        fruit: false,     // 果盘
        dessert: false,   // 点心
        tea: false        // 茶水
    },
    actions: {
        kneelCount: 0,    // 今日跪拜次数
        shakeCount: 0,    // 今日求签次数
        lastWishTime: 0,  // 上次许愿时间
        lastKneelDate: null, // 上次跪拜日期
        lastShakeDate: null  // 上次求签日期
    },
    soundEnabled: true,
    isFirstVisit: true
};

// ============ 签文库 ============
const fortunes = [
    {签: '第一签', 吉凶: '大吉', 内容: '天地交泰万物通', 释义: '婚姻成就功名全，讼事和谐病自痊，若问营谋应得意之星高照，利路亨通。'},
    {签: '第二签', 吉凶: '中吉', 内容: '春风得意马蹄疾', 释义: '求名求利正当时，贵人接引自南离，谋事一成无阻碍，枯木逢春发旧枝。'},
    {签: '第三签', 吉凶: '小吉', 内容: '花开有好望来多', 释义: '行人喜庆病回春，蚕丝收成五谷丰，婚姻有约宜早定，是非口舌不相逢。'},
    {签: '第四签', 吉凶: '平吉', 内容: '心闲犹恐未闲忙', 释义: '目下虽见表章程，久后应须理旧盟，若问行人归未去，月光还似旧年时。'},
    {签: '第五签', 吉凶: '小凶', 内容: '近来有人送物来', 释义: '近来音信未绸缪，枯木生花不再秋，云中飞去空中老，枯木逢春莫望收。'},
    {签: '第六签', 吉凶: '中凶', 内容: '风吹浪浪可行船', 释义: '求名求利莫强求，营谋动作费踌躇，若还安分依天命，等到时来事事成。'},
    {签: '第七签', 吉凶: '大凶', 内容: '目前时运未逢亨', 释义: '枯木生花再发旧枝，莫为不足怨相思，进退由来皆有命，劝君守旧待明时。'},
    {签: '第八签', 吉凶: '上吉', 内容: '一路春风到百川', 释义: '一阳来复事悠然，过了难关便是天，进进退退多反复，终能成就利名缘。'},
    {签: '第九签', 吉凶: '上上签', 内容: '佛祖灵签第一灵', 释义: '巍巍金身高万寻，护国祚民显威灵，福国佑民万万载，善男信女得称心。'},
    {签: '第十签', 吉凶: '中平', 内容: '闲云野鹤本无忧', 释义: '清闲无事不须忙，鹤引云归入帝乡，待到来年花开日，百鸟齐鸣贺寿长。'}
];

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('祈个福应用初始化...');

    // 检测时间设置背景
    checkTimeAndSetBackground();

    // 初始化弹屏滚动
    initBannerScrolling();

    // 初始化所有事件监听
    initEventListeners();

    // 检查首次访问
    checkFirstVisit();

    // 加载用户状态
    loadUserState();

    // 每日次数重置
    resetDailyCounts();

    // 更新UI
    updateUI();
});

// ============ 背景切换 ============
function checkTimeAndSetBackground() {
    const hour = new Date().getHours();
    const backgroundLayer = document.getElementById('backgroundLayer');

    if (hour < 6 || hour >= 18) {
        // 夜晚场景
        AppState.scene.isNight = true;
        backgroundLayer.className = 'temple-interior bg-night';
    } else {
        // 白天场景
        AppState.scene.isNight = false;
        backgroundLayer.className = 'temple-interior';
    }
}

// ============ 弹屏滚动初始化 ============
function initBannerScrolling() {
    const bannerContent = document.getElementById('bannerContent');
    const sampleWishes = [
        '🙏 善男信女：愿家人平安健康',
        '🙏 李某某：祈愿事业蒸蒸日上',
        '🙏 张某某：祈求姻缘早日到来',
        '🙏 王某某：希望孩子学业进步',
        '🙏 陈某某：祈福父母身体健康',
        '🙏 刘某某：许愿心想事成万事如意'
    ];

    // 复制内容实现无缝滚动
    let content = '';
    for (let i = 0; i < 3; i++) {
        content += sampleWishes.map(wish =>
            `<div class="banner-item">${wish}</div>`
        ).join('');
    }
    bannerContent.innerHTML = content;
}

// ============ 添加愿望到弹屏 ============
function addToBanner(wish) {
    const bannerContent = document.getElementById('bannerContent');
    const userName = AppState.user.name || '匿名信众';
    const newItem = document.createElement('div');
    newItem.className = 'banner-item';
    newItem.textContent = `🙏 ${userName}：${wish}`;

    // 插入到第一个位置
    bannerContent.insertBefore(newItem, bannerContent.firstChild);
}

// ============ 事件监听初始化 ============
function initEventListeners() {
    // --- 导航跳转 ---
    document.getElementById('remembranceBtn').addEventListener('click', () => {
        window.location.href = 'remembrance.html';
    });

    document.getElementById('shakeBtn').addEventListener('click', openShakeModal);

    document.getElementById('fishBtn').addEventListener('click', () => {
        window.location.href = 'pages/animal-release.html';
    });

    // --- 用户信息（预留跳转个人中心）---
    document.getElementById('userInfoBtn').addEventListener('click', () => {
        alert(`🙏 ${AppState.user.name}\n等级：Lv.${Math.floor(AppState.user.foguang / 100) + 1} 信众\n欢喜：${AppState.user.huanxi}\n佛光：${AppState.user.foguang}`);
        // 预留：window.location.href = 'pages/profile.html';
    });

    // --- 问佛对话 ---
    document.getElementById('askBuddhaBtn').addEventListener('click', openChatModal);

    // --- 上香（点击香炉）---
    document.getElementById('incenseBurner').addEventListener('click', openIncenseModal);

    // --- 点灯（点击莲花灯）---
    document.getElementById('leftLamp').addEventListener('click', openLampModal);
    document.getElementById('rightLamp').addEventListener('click', openLampModal);

    // --- 供奉（点击各供品）---
    document.getElementById('leftVase').addEventListener('click', () => handleOffering('vase', 'left'));
    document.getElementById('rightVase').addEventListener('click', () => handleOffering('vase', 'right'));
    document.getElementById('fruitPlate').addEventListener('click', () => handleOffering('fruit'));
    document.getElementById('dessertPlate').addEventListener('click', () => handleOffering('dessert'));
    document.getElementById('teacup').addEventListener('click', () => handleOffering('tea'));

    // --- 佛身点击（浴佛）---
    document.getElementById('buddhaStatue').addEventListener('click', handleBuddhaTouch);

    // --- 跪拜 ---
    document.getElementById('prayerMat').addEventListener('click', handleKneel);

    // --- 许愿发送 ---
    document.getElementById('sendWishBtn').addEventListener('click', sendWish);
    document.getElementById('wishInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendWish();
    });

    // --- 音效开关 ---
    document.getElementById('soundToggle').addEventListener('click', toggleSound);

    // --- 弹窗关闭 ---
    initModalClose();

    // --- 上香选择 ---
    initIncenseSelection();

    // --- 点灯选择 ---
    initLampSelection();

    // --- 求签 ---
    initShakeFunction();

    // --- 充值 ---
    initRecharge();
}

// ============ 弹窗关闭初始化 ============
function initModalClose() {
    // 各个弹窗的关闭按钮
    document.getElementById('closeIncenseModal').addEventListener('click', () => closeModal('incenseModal'));
    document.getElementById('closeLampModal').addEventListener('click', () => closeModal('lampModal'));
    document.getElementById('closeOfferingModal').addEventListener('click', () => closeModal('offeringModal'));
    document.getElementById('closeShakeModal').addEventListener('click', () => closeModal('shakeModal'));
    document.getElementById('closeChatModal').addEventListener('click', () => closeModal('chatModal'));
    document.getElementById('closeRechargeModal').addEventListener('click', () => closeModal('rechargeModal'));

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ============ 弹窗开闭 ============
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// ============ 上香弹窗 ============
function openIncenseModal() {
    openModal('incenseModal');
}

// ============ 上香选择初始化 ============
function initIncenseSelection() {
    document.querySelectorAll('[data-incense]').forEach(btn => {
        btn.addEventListener('click', () => {
            const incenseType = btn.dataset.incense;
            selectIncense(incenseType);
        });
    });
}

// ============ 选择香烛 ============
function selectIncense(type) {
    let cost = 0;
    let foguang = 0;

    switch(type) {
        case '3':
            foguang = 10;
            break;
        case '6':
            foguang = 20;
            break;
        case '9':
            foguang = 30;
            break;
        case 'premium':
            cost = 50;
            if (AppState.user.huanxi < cost) {
                alert(`头香需要 ${cost} 欢喜，欢喜不足，请先充值`);
                closeModal('incenseModal');
                openModal('rechargeModal');
                return;
            }
            foguang = 100;
            break;
    }

    // 扣除欢喜
    if (cost > 0) {
        AppState.user.huanxi -= cost;
    }

    // 增加佛光
    AppState.user.foguang += foguang;

    // 更新香炉状态
    AppState.offerings.incense = {
        type: type,
        startTime: Date.now(),
        duration: 30 * 60 * 1000 // 30分钟
    };

    // 关闭弹窗
    closeModal('incenseModal');

    // 播放上香动画
    playIncenseAnimation();

    // 显示飘字
    showFloatingText(`+${foguang} 佛光`, document.getElementById('incenseBurner'));

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('incense');
}

// ============ 上香动画 ============
function playIncenseAnimation() {
    const incenseBurner = document.getElementById('incenseBurnerState');
    incenseBurner.classList.add('has-incense');

    // 根据类型显示不同数量的香
    const type = AppState.offerings.incense.type;
    let count = type === 'premium' ? 9 : (parseInt(type) || 3);

    // 清除旧香
    const oldIncense = incenseBurner.querySelectorAll('.incense-stick');
    oldIncense.forEach(el => el.remove());

    // 添加新香
    for (let i = 0; i < Math.min(count, 5); i++) {
        const incense = document.createElement('div');
        incense.className = 'incense-stick';
        incense.style.cssText = `
            position: absolute;
            top: -25px;
            left: ${35 + i * 5}%;
            transform: translateX(-50%) rotate(${(i - 2) * 3}deg);
            width: 2px;
            height: 22px;
            background: linear-gradient(180deg, #FF6347 0%, #FF6347 10%, #8B4513 10%, #8B4513 100%);
            border-radius: 2px;
        `;
        incenseBurner.appendChild(incense);
    }

    // 显示倒计时
    updateIncenseCountdown();
}

// ============ 香炉倒计时更新 ============
function updateIncenseCountdown() {
    const countdown = document.getElementById('incenseCountdown');

    if (!AppState.offerings.incense) {
        countdown.style.display = 'none';
        return;
    }

    countdown.style.display = 'block';

    const update = () => {
        if (!AppState.offerings.incense) {
            countdown.style.display = 'none';
            return;
        }

        const elapsed = Date.now() - AppState.offerings.incense.startTime;
        const remaining = AppState.offerings.incense.duration - elapsed;

        if (remaining <= 0) {
            countdown.style.display = 'none';
            // 自动熄灭
            AppState.offerings.incense = null;
            updateIncenseUI();
            saveUserState();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        countdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        requestAnimationFrame(update);
    };

    update();
}

// ============ 香炉UI更新 ============
function updateIncenseUI() {
    const incenseBurner = document.getElementById('incenseBurnerState');

    if (AppState.offerings.incense) {
        playIncenseAnimation();
    } else {
        incenseBurner.classList.remove('has-incense');
        const sticks = incenseBurner.querySelectorAll('.incense-stick');
        sticks.forEach(el => el.remove());
    }
}

// ============ 点灯弹窗 ============
function openLampModal() {
    openModal('lampModal');
}

// ============ 点灯选择初始化 ============
function initLampSelection() {
    document.querySelectorAll('.lamp-option').forEach(lamp => {
        lamp.addEventListener('click', () => {
            const lampType = lamp.dataset.lamp;
            selectLamp(lampType);
        });
    });

    // 长明灯（HTML中是带样式的独立块）
    const eternalBtn = document.querySelector('.modal-content [style*="VIP"]');
    if (eternalBtn) {
        eternalBtn.addEventListener('click', () => selectLamp('eternal'));
    }
}

// ============ 点灯选择 ============
function selectLamp(type) {
    const costs = {
        wealth: 10,
        career: 10,
        love: 10,
        health: 10,
        study: 10,
        eternal: 100
    };

    const names = {
        wealth: '财福灯',
        career: '事业灯',
        love: '姻缘灯',
        health: '安康灯',
        study: '学业灯',
        eternal: '长明灯'
    };

    const colors = {
        wealth: '#FFD700',
        career: '#9370DB',
        love: '#FF69B4',
        health: '#FFD700',
        study: '#87CEEB',
        eternal: '#FFA500'
    };

    const cost = costs[type] || 10;

    if (AppState.user.huanxi < cost) {
        alert(`点灯需要 ${cost} 欢喜，欢喜不足`);
        showChargeHint();
        return;
    }

    // 扣除欢喜
    AppState.user.huanxi -= cost;

    // 更新灯状态
    AppState.offerings.lamp = {
        type: type,
        color: colors[type] || '#FFD700',
        name: names[type] || '祈福灯',
        startTime: Date.now(),
        duration: type === 'eternal' ? 365 * 24 * 60 * 60 * 1000 : 3 * 24 * 60 * 60 * 1000
    };

    // 增加佛光
    const foguang = type === 'eternal' ? 200 : 30;
    AppState.user.foguang += foguang;

    // 关闭弹窗
    closeModal('lampModal');

    // 播放点灯动画
    playLampAnimation(type);

    // 显示飘字
    showFloatingText(`+${foguang} 佛光`, document.getElementById('leftLamp'));

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('lamp');
}

// ============ 点灯动画 ============
function playLampAnimation(type) {
    const leftLamp = document.getElementById('leftLampLight');
    const rightLamp = document.getElementById('rightLampLight');

    leftLamp.classList.add('lit');
    rightLamp.classList.add('lit');

    const colors = {
        wealth: '#FF6600',
        career: '#8A2BE2',
        love: '#FF1493',
        health: '#FFD700',
        study: '#4169E1',
        eternal: '#FF4500'
    };

    const flameColor = colors[type] || '#FF6600';

    // 设置火焰颜色
    [leftLamp, rightLamp].forEach(lamp => {
        lamp.style.setProperty('--flame-color', flameColor);
        lamp.style.boxShadow = `0 0 25px ${flameColor}`;
    });

    // 佛身辉光
    const buddhaStatue = document.getElementById('buddhaStatue');
    buddhaStatue.style.boxShadow = `0 0 60px ${AppState.offerings.lamp.color}`;
}

// ============ 供奉处理 ============
function handleOffering(type, position = null) {
    // 检查是否已经供奉过
    if (type === 'vase') {
        if (position === 'left' && AppState.offerings.leftVase) {
            alert('此花瓶已供奉，佛法无量');
            return;
        }
        if (position === 'right' && AppState.offerings.rightVase) {
            alert('此花瓶已供奉，佛法无量');
            return;
        }
    } else if (AppState.offerings[type]) {
        alert('此供品已供奉，佛法无量');
        return;
    }

    // 打开供奉确认弹窗
    openOfferingModal(type, position);
}

// ============ 供奉弹窗打开 ============
function openOfferingModal(type, position) {
    const titles = {
        vase: '🌸 请佛供奉 - 花供',
        fruit: '🍇 请佛供奉 - 果供',
        dessert: '🍮 请佛供奉 - 点心供',
        tea: '🍵 请佛供奉 - 水贡'
    };

    const contents = {
        vase: { icon: '🌸', desc: '鲜花供奉，佛前生辉', cost: 5, reward: 50 },
        fruit: { icon: '🍇', desc: '鲜果供奉，福报绵长', cost: 5, reward: 50 },
        dessert: { icon: '🍮', desc: '精致点心，诚心供奉', cost: 5, reward: 50 },
        tea: { icon: '🍵', desc: '香茶供奉，清净身心', cost: 5, reward: 50 }
    };

    const content = contents[type];

    document.getElementById('offeringTitle').textContent = titles[type];
    document.getElementById('offeringContent').innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 80px; margin-bottom: 20px;">${content.icon}</div>
            <div style="font-size: 18px; color: #8B4513; margin-bottom: 10px;">${content.desc}</div>
            <div style="color: #666; margin-bottom: 20px;">供奉持续7天</div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                <div>
                    <div style="color: #FF6347; font-weight: bold;">消耗</div>
                    <div style="font-size: 24px;">💎 ${content.cost} 欢喜</div>
                </div>
                <div>
                    <div style="color: #32CD32; font-weight: bold;">奖励</div>
                    <div style="font-size: 24px;">✨ ${content.reward} 佛光</div>
                </div>
            </div>
            <div style="color: #999; font-size: 12px; margin-bottom: 15px;">当前欢喜：${AppState.user.huanxi}</div>
            <button onclick="confirmOffering('${type}', '${position}')"
                style="padding: 15px 40px; background: linear-gradient(135deg, #FFD700, #FFA500); border: none; border-radius: 25px; font-size: 16px; cursor: pointer; color: #FFF; font-weight: bold;">
                确认供奉
            </button>
        </div>
    `;

    openModal('offeringModal');
}

// ============ 确认供奉 ============
function confirmOffering(type, position) {
    const costs = { vase: 5, fruit: 5, dessert: 5, tea: 5 };
    const rewards = { vase: 50, fruit: 50, dessert: 50, tea: 50 };
    const cost = costs[type] || 5;

    if (AppState.user.huanxi < cost) {
        alert(`欢喜不足，无法供奉`);
        closeModal('offeringModal');
        openModal('rechargeModal');
        return;
    }

    // 扣除欢喜
    AppState.user.huanxi -= cost;

    // 增加佛光
    AppState.user.foguang += rewards[type] || 50;

    // 更新供品状态
    if (type === 'vase') {
        if (position === 'left' || position === 'null') {
            AppState.offerings.leftVase = true;
        } else if (position === 'right') {
            AppState.offerings.rightVase = true;
        }
    } else {
        AppState.offerings[type] = true;
    }

    // 关闭弹窗
    closeModal('offeringModal');

    // 播放供奉动画
    playOfferingAnimation(type, position);

    // 显示飘字
    showFloatingText(`+${rewards[type]} 佛光`, document.getElementById('buddhaStatue'));

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('offering');
}

// ============ 供奉动画 ============
function playOfferingAnimation(type, position) {
    // 根据类型和位置更新对应元素
    const elements = {};
    if (type === 'vase') {
        if (position === 'left' || position === 'null') {
            elements.vase = 'leftVaseFlowers';
        } else if (position === 'right') {
            elements.vase = 'rightVaseFlowers';
        }
    } else if (type === 'fruit') {
        elements.fruit = 'fruitPlateContent';
    } else if (type === 'dessert') {
        elements.dessert = 'dessertPlateContent';
    } else if (type === 'tea') {
        elements.tea = 'teacupState';
    }

    const elId = elements[type] || Object.values(elements)[0];
    const el = document.getElementById(elId);

    if (el) {
        el.classList.add(`has-${type === 'vase' ? 'flowers' : type}`);

        // 动态内容
        if (type === 'fruit') {
            el.innerHTML = `
                <span class="fruit"></span>
                <span class="fruit"></span>
                <span class="fruit"></span>
            `;
        } else if (type === 'dessert') {
            el.innerHTML = `
                <span class="dessert"></span>
                <span class="dessert"></span>
                <span class="dessert"></span>
            `;
        }
    }

    // 佛衣闪烁金光
    const buddhaStatue = document.getElementById('buddhaStatue');
    buddhaStatue.classList.add('active');
    setTimeout(() => buddhaStatue.classList.remove('active'), 1000);

    // 佛光亮效
    playWishEffect();
}

// ============ 浴佛（点击佛身） ============
function handleBuddhaTouch() {
    if (AppState.user.huanxi < 1) {
        showChargeHint();
        return;
    }

    // 扣除欢喜
    AppState.user.huanxi -= 1;

    // 增加佛光
    AppState.user.foguang += 10;

    // 播放浴佛动画
    const buddhaStatue = document.getElementById('buddhaStatue');
    buddhaStatue.classList.add('active');

    // 佛光亮效
    playWishEffect();

    setTimeout(() => {
        buddhaStatue.classList.remove('active');
    }, 1000);

    // 显示飘字
    showFloatingText('+10 佛光', buddhaStatue);

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('bathing');
}

// ============ 跪拜 ============
function handleKneel() {
    if (AppState.actions.kneelCount >= 3) {
        alert('今日跪拜次数已用完（每日3次），明日再来拜佛吧！');
        return;
    }

    // 播放跪拜动画
    const prayerMat = document.getElementById('prayerMat');
    prayerMat.classList.add('kneeling');
    setTimeout(() => prayerMat.classList.remove('kneeling'), 800);

    // 增加次数
    AppState.actions.kneelCount++;

    // 增加佛光
    AppState.user.foguang += 15;

    // 自动上香效果（如未上香）
    if (!AppState.offerings.incense) {
        AppState.offerings.incense = {
            type: 'auto',
            startTime: Date.now(),
            duration: 10 * 60 * 1000 // 10分钟
        };
        playIncenseAnimation();
    }

    // 佛光亮效
    playWishEffect();

    // 显示飘字
    showFloatingText(`+15 佛光 (${AppState.actions.kneelCount}/3)`, prayerMat);

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('bell');
}

// ============ 求签弹窗 ============
function openShakeModal() {
    // 重置状态
    document.getElementById('shakeAnimation').style.animation = 'none';
    document.getElementById('shakeResult').style.display = 'none';
    document.getElementById('startShake').style.display = 'inline-block';

    openModal('shakeModal');
}

// ============ 求签功能初始化 ============
function initShakeFunction() {
    const startShakeBtn = document.getElementById('startShake');

    startShakeBtn.addEventListener('click', () => {
        if (AppState.actions.shakeCount >= 1) {
            alert('今日求签次数已用完（每日1次），明日再来吧！');
            return;
        }

        if (AppState.user.huanxi < 10) {
            alert('求签需要 10 欢喜');
            closeModal('shakeModal');
            openModal('rechargeModal');
            return;
        }

        performShake();
    });
}

// ============ 执行求签 ============
function performShake() {
    const animation = document.getElementById('shakeAnimation');
    const result = document.getElementById('shakeResult');
    const fortune = document.getElementById('shakeFortune');
    const meaning = document.getElementById('shakeMeaning');
    const startBtn = document.getElementById('startShake');

    // 扣除欢喜
    AppState.user.huanxi -= 10;

    // 增加佛光
    AppState.user.foguang += 20;

    // 增加求签次数
    AppState.actions.shakeCount++;

    // 隐藏按钮
    startBtn.style.display = 'none';

    // 摇晃动画
    animation.style.animation = 'none';
    void animation.offsetWidth; // 触发reflow
    animation.style.animation = 'buddhaFloat 0.3s ease-in-out infinite';
    result.style.display = 'none';

    // 模拟摇签
    setTimeout(() => {
        animation.style.animation = 'none';

        // 随机选择签
        const randomIndex = Math.floor(Math.random() * fortunes.length);
        const selectedFortune = fortunes[randomIndex];

        // 显示结果
        fortune.textContent = `${selectedFortune.签} ${selectedFortune.吉凶}`;
        meaning.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 10px;">${selectedFortune.内容}</div>
            <div style="text-align: left; padding: 15px; background: rgba(255,215,0,0.15); border-radius: 10px; line-height: 1.8; color: #5D4037;">
                ${selectedFortune.释义}
            </div>
        `;

        result.style.display = 'block';

        // 显示飘字
        showFloatingText('+20 佛光', document.getElementById('shakeBtn'));

        // 保存状态
        saveUserState();
        updateUI();

        // 播放音效
        playSound('chanting');
    }, 2000);
}

// ============ 许愿 ============
function sendWish() {
    const input = document.getElementById('wishInput');
    const wishText = input.value.trim();

    if (!wishText) {
        alert('请输入许愿语');
        return;
    }

    if (wishText.length > 50) {
        alert('许愿语过长（限50字）');
        return;
    }

    if (AppState.user.huanxi < 20) {
        alert('许愿需要 20 欢喜');
        openModal('rechargeModal');
        return;
    }

    // 检查冷却期（1分钟，便于体验）
    const now = Date.now();
    const cooldown = 60 * 1000;
    if (now - AppState.actions.lastWishTime < cooldown) {
        const remaining = Math.ceil((cooldown - (now - AppState.actions.lastWishTime)) / 1000);
        alert(`许愿冷却中，还需等待 ${remaining} 秒`);
        return;
    }

    // 扣除欢喜
    AppState.user.huanxi -= 20;

    // 增加佛光
    AppState.user.foguang += 50;

    // 更新最后许愿时间
    AppState.actions.lastWishTime = now;

    // 添加到弹屏
    addToBanner(wishText);

    // 清空输入
    input.value = '';

    // 播放特效
    playWishEffect();

    // 显示飘字
    showFloatingText('+50 佛光', document.getElementById('sendWishBtn'));

    // 保存状态
    saveUserState();
    updateUI();

    // 播放音效
    playSound('prayer');
}

// ============ 许愿特效 ============
function playWishEffect() {
    const lightEffect = document.getElementById('buddhaLightEffect');
    lightEffect.classList.add('active');

    // 清除旧动画
    void lightEffect.offsetWidth;

    setTimeout(() => {
        lightEffect.classList.remove('active');
    }, 1500);
}

// ============ 问佛对话弹窗 ============
function openChatModal() {
    openModal('chatModal');
    initChat();
}

// ============ 初始化对话 ============
function initChat() {
    const messages = document.getElementById('chatMessages');
    messages.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #8B4513;">
            <div style="font-size: 50px; margin-bottom: 10px;">🙏</div>
            <div style="font-size: 14px; font-weight: bold;">佛光普照，众生平等</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">请在下方输入您的问题</div>
        </div>
    `;

    // 发送按钮事件（去重）
    const sendBtn = document.getElementById('sendChatBtn');
    const input = document.getElementById('chatInput');

    // 克隆按钮去重监听
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    newSendBtn.addEventListener('click', sendChatMessage);

    // 输入框回车事件
    input.removeEventListener('keypress', handleChatEnter);
    input.addEventListener('keypress', handleChatEnter);
}

function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    addChatMessage(message, 'user');
    input.value = '';

    // 模拟佛祖思考
    setTimeout(() => {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.style.cssText = 'text-align: left; margin-bottom: 15px; color: #8B4513; font-size: 14px;';
        thinkingDiv.innerHTML = `
            <div style="display: inline-flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 30px;">🙏</div>
                <div style="background: #FFF8DC; padding: 10px 15px; border-radius: 15px;">佛祖思考中...</div>
            </div>
        `;
        document.getElementById('chatMessages').appendChild(thinkingDiv);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;

        setTimeout(() => {
            thinkingDiv.remove();
            const response = getBuddhaResponse(message);
            addChatMessage(response, 'buddha');
        }, 1200);
    }, 500);
}

// ============ 添加对话消息 ============
function addChatMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');

    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div style="text-align: right; margin-bottom: 15px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #FFF; padding: 10px 15px; border-radius: 15px; max-width: 80%; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${escapeHtml(text)}
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div style="text-align: left; margin-bottom: 15px;">
                <div style="display: inline-flex; align-items: flex-start; gap: 10px;">
                    <div style="font-size: 30px;">🙏</div>
                    <div style="background: #FFF8DC; color: #5D4037; padding: 10px 15px; border-radius: 15px; max-width: 80%; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #D4AF37;">
                        ${escapeHtml(text)}
                    </div>
                </div>
            </div>
        `;
    }

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// ============ 佛祖回复内容生成 ============
function getBuddhaResponse(question) {
    const q = question.toLowerCase();

    // 关键词分类回复
    if (/健康|病|身体|医|平安/.test(q)) {
        const replies = [
            '身体是修行的根本，放下焦虑，心自安宁。多行善事，福报自来。',
            '病由心生，亦由心去。静心念佛，调养身心，自会渐渐好转。',
            '善哉！身安则道隆。每日静心片刻，身心灵皆得清净。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/钱|财|富|工作|事业|生意|业|投资/.test(q)) {
        const replies = [
            '财富如水，强求不得。踏实做事，广结善缘，财源自会缓缓而来。',
            '施主莫要执着于得失。尽心尽力，结果顺其自然便好。',
            '事业之道在于诚信与坚持。但行好事，莫问前程。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/婚|姻|爱|情|缘|恋|对象/.test(q)) {
        const replies = [
            '姻缘天定，缘分来时自会相见。修身养性，静待花开。',
            '爱是付出，不是索取。真心待人，幸福自会降临。',
            '缘分微妙，不必强求。当下好好生活，对的人自会出现。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/学|考|书|学业|成绩/.test(q)) {
        const replies = [
            '学习是日积月累的事。专注当下，不急不躁，必有所成。',
            '书山有路勤为径，学海无涯苦作舟。勤奋加智慧，必有收获。',
            '不必焦虑结果，专注过程。尽心尽力，便是最好。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/家|父母|家人|亲/.test(q)) {
        const replies = [
            '家和万事兴。善待家人，和睦相处，便是最大的福报。',
            '百善孝为先。孝敬父母，积善之家必有余庆。',
            '家人是最深的缘分。珍惜眼前人，感恩每一天。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/烦|恼|焦虑|压|难|困|苦/.test(q)) {
        const replies = [
            '烦恼如浮云，终将散去。静心观照，本自清净。',
            '一切困难都是暂时的。深呼吸，告诉自己：这也会过去。',
            '苦乐皆是人生。接受当下，便是解脱的开始。',
            '放下执念，心自宽广。凡事往好处想，路会越走越宽。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    if (/死|去|亡|离|失|别/.test(q)) {
        const replies = [
            '生老病死，自然之道。珍惜当下，好好活着，便是对逝者最好的纪念。',
            '离别是人生常态。爱过的人，经历的事，都成为生命的一部分。',
            '生死无常，珍惜现在。把每一天当作礼物来过。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 通用智慧回复
    const generalReplies = [
        '善哉善哉，施主所求，吾已知晓。心诚则灵，福报自至。',
        '一切有为法，如梦幻泡影。放下执着，心自宽广。',
        '施主不必忧虑，一切自有定数。但行好事，莫问前程。',
        '静心念佛，自有福报。因缘际会，皆有定时。',
        '善根深植，福报自来。心存善念，必有所应。',
        '佛法无边，只度有缘人。施主有心，佛必加持。',
        '缘起缘灭，皆是因果。把握当下，便是最好的修行。'
    ];

    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

// ============ 充值提示 ============
function showChargeHint() {
    alert('欢喜余额不足，请先充值！');
    openModal('rechargeModal');
}

// ============ 充值初始化 ============
function initRecharge() {
    document.querySelectorAll('.recharge-option').forEach(option => {
        option.addEventListener('click', () => {
            const amount = parseInt(option.dataset.amount);
            const price = parseInt(option.dataset.price);

            if (confirm(`确认充值 ${amount} 欢喜，支付 ¥${price}？`)) {
                // 模拟支付成功
                AppState.user.huanxi += amount;
                saveUserState();
                updateUI();
                closeModal('rechargeModal');
                alert(`充值成功！获得 ${amount} 欢喜，当前欢喜：${AppState.user.huanxi}`);

                // 播放音效
                playSound('coin');
            }
        });
    });
}

// ============ 音效控制 ============
function toggleSound() {
    AppState.soundEnabled = !AppState.soundEnabled;
    const btn = document.getElementById('soundToggle');
    btn.textContent = AppState.soundEnabled ? '🎵' : '🔇';
}

// ============ 播放音效（预留接口） ============
function playSound(type) {
    if (!AppState.soundEnabled) return;

    // 预留音效接口（可以接入Web Audio API）
    console.log(`♪ 播放音效: ${type}`);
}

// ============ 飘字特效 ============
function showFloatingText(text, element) {
    const container = document.getElementById('floatingTextContainer');
    const rect = element.getBoundingClientRect();

    const floatText = document.createElement('div');
    floatText.className = 'floating-text';
    floatText.textContent = text;
    floatText.style.left = (rect.left + rect.width / 2) + 'px';
    floatText.style.top = rect.top + 'px';

    container.appendChild(floatText);

    setTimeout(() => {
        floatText.remove();
    }, 2000);
}

// ============ 首次访问检查 ============
function checkFirstVisit() {
    const visited = localStorage.getItem('prayer_first_visit');

    if (!visited) {
        AppState.isFirstVisit = true;
        showFirstTimeHint();
        localStorage.setItem('prayer_first_visit', 'true');
    }
}

// ============ 首次引导 ============
function showFirstTimeHint() {
    const hint = document.getElementById('firstTimeHint');
    const incenseBurner = document.getElementById('incenseBurner');
    const rect = incenseBurner.getBoundingClientRect();

    hint.style.display = 'block';
    hint.style.left = (rect.left + rect.width / 2 - 30) + 'px';
    hint.style.top = (rect.top - 60) + 'px';

    // 5秒后自动隐藏
    setTimeout(() => {
        hint.style.display = 'none';
    }, 5000);
}

// ============ 状态加载 ============
function loadUserState() {
    const saved = localStorage.getItem('prayer_user_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            // 合并用户状态（保留默认欢喜值以便首次体验）
            if (state.user) {
                Object.assign(AppState.user, state.user);
            }
            if (state.offerings) {
                Object.assign(AppState.offerings, state.offerings);
            }
            if (state.actions) {
                Object.assign(AppState.actions, state.actions);
            }
            if (state.scene) {
                Object.assign(AppState.scene, state.scene);
            }
        } catch (e) {
            console.error('状态加载失败：', e);
        }
    }
}

// ============ 状态保存 ============
function saveUserState() {
    const state = {
        user: AppState.user,
        offerings: AppState.offerings,
        actions: AppState.actions,
        scene: AppState.scene
    };
    localStorage.setItem('prayer_user_state', JSON.stringify(state));
}

// ============ 每日次数重置 ============
function resetDailyCounts() {
    const today = new Date().toDateString();

    if (AppState.actions.lastKneelDate !== today) {
        AppState.actions.kneelCount = 0;
        AppState.actions.lastKneelDate = today;
    }

    if (AppState.actions.lastShakeDate !== today) {
        AppState.actions.shakeCount = 0;
        AppState.actions.lastShakeDate = today;
    }

    saveUserState();
}

// ============ UI更新 ============
function updateUI() {
    // 更新用户信息
    document.getElementById('userName').textContent = AppState.user.name || '善男信女';
    const level = Math.floor(AppState.user.foguang / 100) + 1;
    document.getElementById('userLevel').textContent = `Lv.${level} 信众 | 欢喜:${AppState.user.huanxi} | 佛光:${AppState.user.foguang}`;

    // 花瓶状态
    if (AppState.offerings.leftVase) {
        document.getElementById('leftVaseFlowers').classList.add('has-flowers');
    }
    if (AppState.offerings.rightVase) {
        document.getElementById('rightVaseFlowers').classList.add('has-flowers');
    }

    // 果盘状态
    if (AppState.offerings.fruit) {
        const fruitEl = document.getElementById('fruitPlateContent');
        fruitEl.classList.add('has-fruit');
        if (!fruitEl.querySelector('.fruit')) {
            fruitEl.innerHTML = '<span class="fruit"></span><span class="fruit"></span><span class="fruit"></span>';
        }
    }

    // 点心状态
    if (AppState.offerings.dessert) {
        const dessertEl = document.getElementById('dessertPlateContent');
        dessertEl.classList.add('has-dessert');
        if (!dessertEl.querySelector('.dessert')) {
            dessertEl.innerHTML = '<span class="dessert"></span><span class="dessert"></span><span class="dessert"></span>';
        }
    }

    // 茶杯状态
    if (AppState.offerings.tea) {
        document.getElementById('teacupState').classList.add('has-tea');
    }

    // 香炉状态
    if (AppState.offerings.incense) {
        // 检查是否过期
        const elapsed = Date.now() - AppState.offerings.incense.startTime;
        if (elapsed >= AppState.offerings.incense.duration) {
            AppState.offerings.incense = null;
            saveUserState();
        } else {
            updateIncenseUI();
        }
    }

    // 灯状态
    if (AppState.offerings.lamp) {
        const elapsed = Date.now() - AppState.offerings.lamp.startTime;
        if (elapsed >= AppState.offerings.lamp.duration) {
            AppState.offerings.lamp = null;
            saveUserState();
        } else {
            playLampAnimation(AppState.offerings.lamp.type);
        }
    }
}

// ============ 工具函数 ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ 导出全局函数供HTML调用 ============
window.AppState = AppState;
window.closeModal = closeModal;
window.openModal = openModal;
window.confirmOffering = confirmOffering;
window.showFloatingText = showFloatingText;
