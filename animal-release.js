/**
 * ============================================================================
 * 祈个福 - 灵宠放生页面逻辑
 * ============================================================================
 * 功能模块：
 *   1. 灵宠数据配置系统
 *   2. 页面初始化与状态管理（localStorage 持久化）
 *   3. 放生（购买）灵宠功能
 *   4. 灵宠池塘渲染与游动动画
 *   5. 灵宠详情卡片与喂养系统
 *   6. 许愿与宝石动画效果
 *   7. 导航功能与弹窗系统
 *   8. 收益计算与寿命管理
 *   9. 气泡动画与音效控制
 * ============================================================================
 */

/* ============================================================================
 * 模块 1：灵宠配置数据
 * ========================================================================== */
const PET_CONFIG = {
    koi: {
        name: '锦鲤',
        icon: '🐟',
        price: 500,
        income: 0.5,
        lifespan: 750,
        description: '寓意吉祥，好运连连'
    },
    dragonfish: {
        name: '金龙鱼',
        icon: '🐠',
        price: 500,
        income: 0.5,
        lifespan: 750,
        description: '财富象征，财源广进'
    },
    turtle: {
        name: '金乌龟',
        icon: '🐢',
        price: 2000,
        income: 2,
        lifespan: 750,
        description: '长寿吉祥，稳中求进'
    },
    frog: {
        name: '金蟾蜍',
        icon: '🐸',
        price: 2000,
        income: 2,
        lifespan: 750,
        description: '招财进宝，富贵自来'
    },
    whitedragon: {
        name: '小白龙',
        icon: '🐉',
        price: 5000,
        income: 5,
        lifespan: 750,
        description: '龙族后裔，尊贵无比'
    },
    golddragon: {
        name: '小金龙',
        icon: '🐲',
        price: 5000,
        income: 5,
        lifespan: 750,
        description: '金龙护体，福泽绵长'
    }
};

/* ============================================================================
 * 模块 2：全局状态管理
 * ========================================================================== */
const AnimalState = {
    // 用户信息
    user: {
        isLoggedIn: false,
        name: '游客',
        huanxi: 0,
        foguang: 0
    },
    // 已拥有的灵宠列表
    pets: [],
    // 是否已经领取过首只免费锦鲤
    hasFreeKoi: false,
    // 今日喂养统计
    todayFeedCount: 0,
    todayFeedDate: null,
    // 上一次喂养时间戳（用于冷却判断）
    lastFeedTime: null,
    // 喂养冷却时间：6小时
    feedCooldown: 6 * 60 * 60 * 1000,
    // 每日喂养上限
    dailyFeedLimit: 2,
    // 音效开关
    soundEnabled: true,
    // 今日收益数据
    todayIncome: 0
};

/* ============================================================================
 * 模块 3：工具函数与辅助方法
 * ========================================================================== */

/**
 * 安全获取 DOM 元素
 * @param {string} id - 元素 ID
 * @returns {HTMLElement|null}
 */
function $(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`[animal-release] 元素未找到: #${id}`);
    }
    return el;
}

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 检查并重置每日喂养次数
 */
function resetDailyFeedIfNeeded() {
    const today = getTodayDate();
    if (AnimalState.todayFeedDate !== today) {
        AnimalState.todayFeedDate = today;
        AnimalState.todayFeedCount = 0;
    }
}

/* ============================================================================
 * 模块 4：飘字特效
 * ========================================================================== */

/**
 * 显示飘字特效
 * @param {string} text - 飘字文本
 * @param {HTMLElement} element - 定位参考元素
 */
function showFloatingText(text, element) {
    if (!text) return;

    let x, y;
    if (element && element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
    } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }

    const floatText = document.createElement('div');
    floatText.className = 'floating-text';
    floatText.textContent = text;
    floatText.style.left = x + 'px';
    floatText.style.top = y + 'px';

    document.body.appendChild(floatText);

    setTimeout(() => {
        if (floatText.parentNode) {
            floatText.parentNode.removeChild(floatText);
        }
    }, 2000);
}

/* ============================================================================
 * 模块 5：气泡动画系统
 * ========================================================================== */

/**
 * 初始化气泡效果
 * 每2秒随机位置创建一个气泡，6秒后自动消失
 */
function initBubbles() {
    const container = $('bubblesContainer');
    if (!container) return;

    // 初始创建几个气泡作为装饰
    for (let i = 0; i < 5; i++) {
        createBubble(container);
    }

    // 每 2 秒创建一个新气泡
    setInterval(() => {
        createBubble(container);
    }, 2000);
}

/**
 * 创建单个气泡
 */
function createBubble(container) {
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // 随机大小 (10-25px)
    const size = Math.random() * 15 + 10;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';

    // 随机水平位置
    bubble.style.left = Math.random() * 100 + '%';

    // 随机初始位置（从不同高度升起）
    bubble.style.bottom = '-' + (Math.random() * 20) + 'px';

    // 随机动画时长 (3-6秒)
    bubble.style.animationDuration = (Math.random() * 3 + 3) + 's';

    // 随机透明度
    bubble.style.opacity = (Math.random() * 0.4 + 0.3).toString();

    container.appendChild(bubble);

    // 6 秒后移除
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
    }, 6000);
}

/* ============================================================================
 * 模块 6：宝石许愿动画
 * ========================================================================== */

/**
 * 添加宝石下落动画
 */
function addGemAnimation() {
    const palaceBg = $('dragonPalaceBg');
    if (!palaceBg) return;

    const gem = document.createElement('div');
    gem.className = 'gem';

    // 随机水平位置 (10%-90%)
    const left = Math.random() * 80 + 10;
    gem.style.left = left + '%';
    gem.style.top = '60%';

    palaceBg.appendChild(gem);

    // 2 秒后移除
    setTimeout(() => {
        if (gem.parentNode) {
            gem.parentNode.removeChild(gem);
        }
    }, 2000);
}

/* ============================================================================
 * 模块 7：灵宠放生（购买）系统
 * ========================================================================== */

/**
 * 打开放生选择弹窗
 */
function openReleaseModal() {
    // 先刷新卡片状态
    updatePetSelectionUI();
    openModal('releaseModal');
}

/**
 * 更新灵宠选择卡片的显示状态
 * - 已拥有：显示"已拥有"标签
 * - 首只锦鲤：显示"免费领养"标签
 */
function updatePetSelectionUI() {
    const cards = document.querySelectorAll('.pet-select-card');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const petType = card.dataset.pet;
        if (!petType || !PET_CONFIG[petType]) return;

        const config = PET_CONFIG[petType];
        const priceDiv = card.querySelector('.pet-select-price');
        const descDiv = card.querySelector('.pet-select-desc');

        // 移除之前的免费标签
        const existingFreeTag = card.querySelector('.free-tag');
        if (existingFreeTag) {
            existingFreeTag.parentNode.removeChild(existingFreeTag);
        }

        // 判断是否已拥有
        const isOwned = AnimalState.pets.some(pet => pet.type === petType);

        if (isOwned) {
            // 已拥有
            card.classList.add('owned');
            if (priceDiv) {
                priceDiv.textContent = '✅ 已拥有';
                priceDiv.style.color = '#32CD32';
            }
        } else {
            // 未拥有
            card.classList.remove('owned');
            if (priceDiv) {
                // 首只锦鲤免费
                if (petType === 'koi' && !AnimalState.hasFreeKoi) {
                    priceDiv.textContent = '🎁 免费领养';
                    priceDiv.style.color = '#32CD32';

                    // 添加免费标签
                    const freeTag = document.createElement('div');
                    freeTag.className = 'free-tag';
                    freeTag.textContent = '免费';
                    card.insertBefore(freeTag, descDiv);
                } else {
                    priceDiv.textContent = `💎 ${config.price}`;
                    priceDiv.style.color = '#FF6347';
                }
            }
        }
    });
}

/**
 * 初始化灵宠卡片点击事件
 */
function initPetSelection() {
    const cards = document.querySelectorAll('.pet-select-card');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const petType = card.dataset.pet;
            if (!petType || !PET_CONFIG[petType]) return;

            handlePetPurchase(petType);
        });
    });
}

/**
 * 处理灵宠购买逻辑
 */
function handlePetPurchase(petType) {
    const config = PET_CONFIG[petType];
    if (!config) return;

    // 检查是否已拥有
    const isOwned = AnimalState.pets.some(pet => pet.type === petType);
    if (isOwned) {
        alert(`您已拥有${config.name}！`);
        return;
    }

    // 判断是否为免费锦鲤
    const isFreeKoi = petType === 'koi' && !AnimalState.hasFreeKoi;
    const actualPrice = isFreeKoi ? 0 : config.price;

    // 检查欢喜余额
    if (AnimalState.user.huanxi < actualPrice) {
        alert(`欢喜余额不足！需要 💎${actualPrice}`);
        return;
    }

    // 确认对话框
    const confirmMsg = isFreeKoi
        ? `确认免费领养${config.icon} ${config.name}？`
        : `确认花费 💎${actualPrice} 放生${config.icon} ${config.name}？`;

    if (!confirm(confirmMsg)) return;

    // 扣除欢喜
    AnimalState.user.huanxi -= actualPrice;

    // 标记已领取免费锦鲤
    if (isFreeKoi) {
        AnimalState.hasFreeKoi = true;
    }

    // 创建新灵宠
    const newPet = {
        id: Date.now(),
        type: petType,
        name: config.name,
        icon: config.icon,
        price: config.price,
        income: config.income,
        lifespan: config.lifespan,
        buyTime: Date.now(),
        lastFeedTime: null,
        lifespanRemaining: config.lifespan,
        totalFeedReward: 0
    };

    AnimalState.pets.push(newPet);

    // 关闭弹窗
    closeModal('releaseModal');

    // 播放音效
    playSound('release');

    // 显示飘字提示
    const releaseBtn = $('releaseBtn');
    showFloatingText(`+${config.icon} ${config.name}`, releaseBtn);

    // 添加宝石动画
    addGemAnimation();

    // 重新渲染灵宠池塘
    renderPets();

    // 刷新 UI 数据
    updateUI();

    // 刷新选择卡片
    updatePetSelectionUI();

    // 保存状态
    saveState();
}

/* ============================================================================
 * 模块 8：灵宠池塘渲染
 * ========================================================================== */

/**
 * 渲染池塘中所有已拥有的灵宠
 * 每个灵宠会随机出现在池塘中并具有游动动画
 */
function renderPets() {
    const pond = $('petPond');
    if (!pond) return;

    // 清空现有灵宠
    pond.innerHTML = '';

    // 如果没有灵宠，显示提示
    if (AnimalState.pets.length === 0) {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255,255,255,0.6);
            font-size: 12px;
            text-align: center;
            pointer-events: none;
        `;
        hint.innerHTML = '🏯<br>点击右侧放生按钮<br>领养您的灵宠';
        pond.appendChild(hint);
        return;
    }

    // 渲染每只灵宠
    AnimalState.pets.forEach((pet) => {
        const petEl = document.createElement('div');
        petEl.className = 'pet';
        petEl.textContent = pet.icon;
        petEl.dataset.petId = pet.id;

        // 随机位置 (left: 20%-80%, top: 30%-70%)
        const left = Math.random() * 60 + 20;
        const top = Math.random() * 40 + 30;
        petEl.style.left = left + '%';
        petEl.style.top = top + '%';

        // 随机动画时长 (8-13秒)
        const duration = Math.random() * 5 + 8;
        petEl.style.animationDuration = duration + 's';
        petEl.style.animationDelay = (Math.random() * 3) + 's';

        // 点击事件：显示详情卡片
        petEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showPetInfo(pet, petEl);
        });

        pond.appendChild(petEl);
    });

    // 更新灵宠总数
    const petCountEl = $('petCount');
    if (petCountEl) {
        petCountEl.textContent = AnimalState.pets.length;
    }
}

/* ============================================================================
 * 模块 9：灵宠详情卡片
 * ========================================================================== */

/**
 * 显示灵宠详情卡片
 * @param {object} pet - 灵宠数据
 * @param {HTMLElement} element - 灵宠元素（用于定位）
 */
function showPetInfo(pet, element) {
    const card = $('petInfoCard');
    if (!card) return;

    // 填充图标与名称
    const iconEl = $('petInfoIcon');
    const nameEl = $('petInfoName');
    if (iconEl) iconEl.textContent = pet.icon;
    if (nameEl) nameEl.textContent = pet.name;

    // 购买价格
    const priceEl = $('petInfoPrice');
    if (priceEl) priceEl.textContent = `💎 ${pet.price}`;

    // 剩余寿命
    const lifeEl = $('petInfoLife');
    if (lifeEl) lifeEl.textContent = `${pet.lifespanRemaining} 天`;

    // 日均收益
    const incomeEl = $('petInfoIncome');
    if (incomeEl) incomeEl.textContent = `${pet.income} 佛光/日`;

    // 上次喂养时间
    const lastFeedEl = $('petInfoLastFeed');
    if (lastFeedEl) {
        if (pet.lastFeedTime) {
            const time = new Date(pet.lastFeedTime);
            const hh = String(time.getHours()).padStart(2, '0');
            const mm = String(time.getMinutes()).padStart(2, '0');
            lastFeedEl.textContent = `${hh}:${mm}`;
        } else {
            lastFeedEl.textContent = '尚未喂养';
        }
    }

    // 保存当前选中的灵宠 ID
    card.dataset.petId = pet.id;

    // 定位卡片到灵宠右侧
    let cardLeft, cardTop;
    if (element && element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        cardLeft = Math.min(rect.right + 10, window.innerWidth - 240);
        cardTop = Math.max(rect.top, 80);
    } else {
        cardLeft = window.innerWidth / 2 - 110;
        cardTop = window.innerHeight / 2 - 100;
    }

    card.style.position = 'fixed';
    card.style.left = cardLeft + 'px';
    card.style.top = cardTop + 'px';

    // 显示卡片
    card.classList.add('active');
}

/**
 * 关闭灵宠详情卡片
 */
function hidePetInfo() {
    const card = $('petInfoCard');
    if (card) {
        card.classList.remove('active');
    }
}

/* ============================================================================
 * 模块 10：喂养系统
 * ========================================================================== */

/**
 * 喂养当前选中的灵宠
 */
function feedSelectedPet() {
    const card = $('petInfoCard');
    if (!card) return;

    const petId = parseInt(card.dataset.petId, 10);
    if (!petId) return;

    // 查找灵宠对象
    const pet = AnimalState.pets.find(p => p.id === petId);
    if (!pet) return;

    // 检查今日喂养次数
    resetDailyFeedIfNeeded();
    if (AnimalState.todayFeedCount >= AnimalState.dailyFeedLimit) {
        alert(`今日喂养次数已用完（${AnimalState.dailyFeedLimit}次/日），请明日再来！`);
        return;
    }

    // 检查喂养冷却时间
    if (AnimalState.lastFeedTime) {
        const elapsed = Date.now() - AnimalState.lastFeedTime;
        if (elapsed < AnimalState.feedCooldown) {
            const remaining = AnimalState.feedCooldown - elapsed;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            let msg = '需要等待';
            if (hours > 0) msg += ` ${hours}小时`;
            if (minutes > 0) msg += ` ${minutes}分钟`;
            msg += ' 后才能再次喂养';
            alert(msg);
            return;
        }
    }

    // 更新灵宠的喂养时间
    pet.lastFeedTime = Date.now();

    // 更新全局统计
    AnimalState.lastFeedTime = Date.now();
    AnimalState.todayFeedCount += 1;

    // 计算佛光收益：灵宠价格 × 0.001
    const reward = pet.price * 0.001;
    AnimalState.user.foguang += reward;
    AnimalState.todayIncome += reward;
    pet.totalFeedReward = (pet.totalFeedReward || 0) + reward;

    // 播放喂养动画
    const petEl = document.querySelector(`.pet[data-pet-id="${petId}"]`);
    if (petEl) {
        petEl.classList.add('feeding');
        setTimeout(() => {
            if (petEl && petEl.classList) {
                petEl.classList.remove('feeding');
            }
        }, 500);
    }

    // 显示飘字
    showFloatingText(`+${reward.toFixed(2)} 佛光`, petEl);

    // 播放音效
    playSound('feed');

    // 关闭详情卡片
    hidePetInfo();

    // 更新 UI
    updateUI();

    // 刷新冷却倒计时显示
    updateFeedCooldownDisplay();

    // 保存状态
    saveState();
}

/**
 * 更新下次可喂养时间的显示
 */
function updateFeedCooldownDisplay() {
    const nextFeedEl = $('nextFeedTime');
    if (!nextFeedEl) return;

    if (!AnimalState.lastFeedTime) {
        nextFeedEl.textContent = '随时可喂';
        return;
    }

    const elapsed = Date.now() - AnimalState.lastFeedTime;
    const remaining = AnimalState.feedCooldown - elapsed;

    if (remaining <= 0) {
        nextFeedEl.textContent = '可以喂养';
    } else {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        if (hours > 0) {
            nextFeedEl.textContent = `${hours}小时${minutes}分后`;
        } else {
            nextFeedEl.textContent = `${minutes}分钟后`;
        }
    }
}

/* ============================================================================
 * 模块 11：许愿系统
 * ========================================================================== */

/**
 * 发送许愿内容
 */
function sendWish() {
    const input = $('wishInput');
    if (!input) return;

    const wishText = input.value.trim();
    if (!wishText) {
        alert('请输入您的愿望');
        return;
    }

    // 添加到弹屏横幅
    addToBanner(wishText);

    // 清空输入框
    input.value = '';

    // 播放宝石动画
    addGemAnimation();

    // 播放音效
    playSound('wish');

    // 显示飘字鼓励
    showFloatingText('🙏 愿望已送达', input);

    // 保存状态
    saveState();
}

/**
 * 添加许愿内容到弹屏横幅
 */
function addToBanner(wish) {
    const bannerContent = $('bannerContent');
    if (!bannerContent) return;

    const userName = AnimalState.user.isLoggedIn ? AnimalState.user.name : '许愿者';

    const newItem = document.createElement('div');
    newItem.className = 'banner-item';
    newItem.textContent = `🐟 ${userName}：${wish}`;

    // 插入到最前面
    bannerContent.insertBefore(newItem, bannerContent.firstChild);

    // 限制最多显示 20 条，避免 DOM 过大
    const items = bannerContent.querySelectorAll('.banner-item');
    if (items.length > 20) {
        for (let i = 20; i < items.length; i++) {
            if (items[i].parentNode) {
                items[i].parentNode.removeChild(items[i]);
            }
        }
    }
}

/* ============================================================================
 * 模块 12：导航与弹窗系统
 * ========================================================================== */

/**
 * 打开通用弹窗
 */
function openModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * 关闭通用弹窗
 */
function closeModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 关闭所有弹窗
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.classList.remove('active'));
}

/**
 * 打开传播天使弹窗
 */
function openAngelModal() {
    // 可在此处动态更新天使弹窗的仪表盘数据
    openModal('angelModal');
}

/**
 * 跳转到祈福首页
 */
function goToPrayerPage() {
    window.location.href = 'index.html';
}

/**
 * 跳转到追思页
 */
function goToRemembrancePage() {
    window.location.href = 'remembrance.html';
}

/**
 * 打开个人中心（预留入口）
 */
function goToProfile() {
    // 暂时显示提示，待后续接入
    alert('个人中心功能开发中，敬请期待！');
}

/* ============================================================================
 * 模块 13：音效控制
 * ========================================================================== */

/**
 * 切换音效开关
 */
function toggleSound() {
    AnimalState.soundEnabled = !AnimalState.soundEnabled;
    const btn = $('soundToggle');
    if (btn) {
        btn.textContent = AnimalState.soundEnabled ? '🎵' : '🔇';
    }
    saveState();
}

/**
 * 播放音效（日志占位，可接入实际音频）
 */
function playSound(type) {
    if (!AnimalState.soundEnabled) return;
    console.log(`[animal-release] 播放音效: ${type}`);
}

/* ============================================================================
 * 模块 14：收益计算与寿命管理
 * ========================================================================== */

/**
 * 计算并更新今日收益统计
 * 同时检查灵宠寿命，到期自动移除
 */
function calculateTodayIncome() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 遍历灵宠更新剩余寿命
    const expiredPets = [];

    AnimalState.pets.forEach(pet => {
        // 计算存活天数
        const ageDays = (now - pet.buyTime) / dayMs;
        pet.lifespanRemaining = Math.max(0, Math.floor(pet.lifespan - ageDays));

        // 标记寿命到期的灵宠
        if (pet.lifespanRemaining <= 0) {
            expiredPets.push(pet.id);
        }
    });

    // 移除寿命到期的灵宠
    if (expiredPets.length > 0) {
        AnimalState.pets = AnimalState.pets.filter(p => !expiredPets.includes(p.id));
        console.log(`[animal-release] 已移除 ${expiredPets.length} 只寿命到期的灵宠`);
        // 重新渲染
        renderPets();
    }

    // 计算今日总收益（已拥有灵宠的日均收益总和）
    let dailyIncomeTotal = 0;
    AnimalState.pets.forEach(pet => {
        dailyIncomeTotal += pet.income;
    });

    // 返回收益数据（供 UI 使用）
    return {
        petCount: AnimalState.pets.length,
        dailyIncome: dailyIncomeTotal,
        todayIncome: AnimalState.todayIncome
    };
}

/**
 * 启动收益计算定时器（每分钟更新一次）
 */
function startIncomeCalculation() {
    // 立即执行一次
    calculateTodayIncome();

    // 每分钟更新
    setInterval(() => {
        calculateTodayIncome();
        // 刷新冷却倒计时
        updateFeedCooldownDisplay();
        // 重置每日喂养
        resetDailyFeedIfNeeded();
        // 更新 UI
        updateUI();
    }, 60 * 1000);
}

/* ============================================================================
 * 模块 15：UI 更新
 * ========================================================================== */

/**
 * 统一更新页面所有数据展示
 */
function updateUI() {
    // 用户信息
    const nameEl = $('userName');
    if (nameEl) nameEl.textContent = AnimalState.user.name;

    // 欢喜余额
    const huanxiEl = $('huanxiValue');
    if (huanxiEl) huanxiEl.textContent = AnimalState.user.huanxi.toFixed(0);

    // 佛光收益
    const foguangEl = $('foguangValue');
    if (foguangEl) foguangEl.textContent = AnimalState.user.foguang.toFixed(2);

    // 今日喂养次数
    const feedCountEl = $('feedCount');
    if (feedCountEl) {
        feedCountEl.textContent = `${AnimalState.todayFeedCount}/${AnimalState.dailyFeedLimit}`;
    }

    // 灵宠总数
    const petCountEl = $('petCount');
    if (petCountEl) petCountEl.textContent = AnimalState.pets.length;

    // 更新冷却时间显示
    updateFeedCooldownDisplay();
}

/* ============================================================================
 * 模块 16：状态持久化
 * ========================================================================== */

/**
 * 保存当前状态到 localStorage
 */
function saveState() {
    try {
        localStorage.setItem('animal_state', JSON.stringify(AnimalState));
    } catch (err) {
        console.warn('[animal-release] 保存状态失败:', err);
    }
}

/**
 * 从 localStorage 恢复状态
 */
function loadState() {
    try {
        const saved = localStorage.getItem('animal_state');
        if (saved) {
            const state = JSON.parse(saved);

            // 安全合并，避免新增字段丢失
            AnimalState.user = Object.assign({}, AnimalState.user, state.user || {});
            AnimalState.pets = Array.isArray(state.pets) ? state.pets : [];
            AnimalState.hasFreeKoi = state.hasFreeKoi === true ? true : false;
            AnimalState.todayFeedCount = typeof state.todayFeedCount === 'number' ? state.todayFeedCount : 0;
            AnimalState.todayFeedDate = state.todayFeedDate || null;
            AnimalState.lastFeedTime = typeof state.lastFeedTime === 'number' ? state.lastFeedTime : null;
            AnimalState.soundEnabled = state.soundEnabled !== false;
            AnimalState.todayIncome = typeof state.todayIncome === 'number' ? state.todayIncome : 0;

            // 检查是否跨天，需要重置每日喂养次数
            resetDailyFeedIfNeeded();

            console.log('[animal-release] 状态已加载:', {
                pets: AnimalState.pets.length,
                huanxi: AnimalState.user.huanxi,
                foguang: AnimalState.user.foguang,
                hasFreeKoi: AnimalState.hasFreeKoi
            });
        }
    } catch (err) {
        console.warn('[animal-release] 加载状态失败:', err);
    }
}

/* ============================================================================
 * 模块 17：事件监听初始化
 * ========================================================================== */

/**
 * 初始化所有事件监听器
 */
function initEventListeners() {
    // 放生按钮
    const releaseBtn = $('releaseBtn');
    if (releaseBtn) {
        releaseBtn.addEventListener('click', openReleaseModal);
    }

    // 传播天使按钮
    const angelBtn = $('angelBtn');
    if (angelBtn) {
        angelBtn.addEventListener('click', openAngelModal);
    }

    // 祈福（首页）按钮
    const prayerBtn = $('prayerBtn');
    if (prayerBtn) {
        prayerBtn.addEventListener('click', goToPrayerPage);
    }

    // 追思按钮
    const remembranceBtn = $('remembranceBtn');
    if (remembranceBtn) {
        remembranceBtn.addEventListener('click', goToRemembrancePage);
    }

    // 用户信息区（预留个人中心入口）
    const userInfoBtn = $('userInfoBtn');
    if (userInfoBtn) {
        userInfoBtn.addEventListener('click', goToProfile);
    }

    // 许愿发送按钮
    const sendWishBtn = $('sendWishBtn');
    if (sendWishBtn) {
        sendWishBtn.addEventListener('click', sendWish);
    }

    // 许愿输入框 Enter 键发送
    const wishInput = $('wishInput');
    if (wishInput) {
        wishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendWish();
        });
    }

    // 音效开关
    const soundToggle = $('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
        // 初始化图标显示
        soundToggle.textContent = AnimalState.soundEnabled ? '🎵' : '🔇';
    }

    // 关闭按钮
    const closeReleaseModal = $('closeReleaseModal');
    if (closeReleaseModal) {
        closeReleaseModal.addEventListener('click', () => closeModal('releaseModal'));
    }

    const closeAngelModal = $('closeAngelModal');
    if (closeAngelModal) {
        closeAngelModal.addEventListener('click', () => closeModal('angelModal'));
    }

    // 点击遮罩关闭弹窗
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 灵宠卡片选择
    initPetSelection();

    // 喂养按钮
    const feedBtn = $('feedBtn');
    if (feedBtn) {
        feedBtn.addEventListener('click', feedSelectedPet);
    }

    // 点击其他区域关闭灵宠详情卡片
    document.addEventListener('click', (e) => {
        const card = $('petInfoCard');
        if (!card) return;

        // 如果卡片是隐藏的，忽略
        if (!card.classList.contains('active')) return;

        // 如果点击的是卡片本身或灵宠元素，不关闭
        const isCardClick = card.contains(e.target);
        const isPetClick = e.target && e.target.classList && e.target.classList.contains('pet');
        const isFeedBtn = e.target && e.target.id === 'feedBtn';

        if (!isCardClick && !isPetClick && !isFeedBtn) {
            hidePetInfo();
        }
    });
}

/* ============================================================================
 * 模块 18：页面主入口
 * ========================================================================== */

/**
 * DOM 加载完成后的主初始化流程
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('[animal-release] 灵宠放生页面初始化...');

    // 1. 加载保存的状态
    loadState();

    // 2. 初始化气泡动画
    initBubbles();

    // 3. 初始化事件监听
    initEventListeners();

    // 4. 渲染已拥有的灵宠到池塘
    renderPets();

    // 5. 更新页面数据显示
    updateUI();

    // 6. 刷新冷却倒计时
    updateFeedCooldownDisplay();

    // 7. 启动收益计算定时器
    startIncomeCalculation();

    // 8. 添加初始演示许愿（可注释掉）
    setTimeout(() => {
        addToBanner('愿家人平安健康，诸事顺遂');
    }, 1000);

    console.log('[animal-release] 初始化完成！');
});
