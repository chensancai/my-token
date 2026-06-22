/**
 * 祈个福 - 超度追思页面逻辑
 * 功能：场景选择、照片上传、上香、点灯、供奉、跪拜、追思语、AI对话
 */

// ============ 全局状态管理 ============
const RemembranceState = {
    scene: null,           // 当前场景：wanfo（万佛朝宗）、flower（鲜花围绕）、ai（音容宛在）
    photo: null,           // 先人照片（base64）
    offerings: {
        incense: null,     // 香炉状态 {type, startTime, duration}
        lamp: null,        // 灯状态 {type, color, name, startTime, duration}
        leftVase: false,   // 左花瓶
        rightVase: false,  // 右花瓶
        fruit: false,      // 果盘
        dessert: false,    // 点心盘
        tea: false,        // 茶杯
        chicken: false,    // 烧鸡
        pig: false         // 烤乳猪
    },
    user: {
        name: '思念者',     // 用户昵称
        level: 'Lv.1 思念', // 用户等级
        huanxi: 200,        // 欢喜值（默认200供体验）
        foguang: 0          // 佛光值
    },
    actions: {
        kneelCount: 0,      // 今日跪拜次数
        lastKneelDate: null, // 上次跪拜日期
        chatCount: 0,        // 今日AI对话次数
        lastChatDate: null   // 上次对话日期
    },
    soundEnabled: true
};

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', function () {
    console.log('追思超度页面初始化...');

    // 加载保存的状态
    loadState();

    // 每日次数重置
    resetDailyCounts();

    // 初始化场景选择
    initSceneSelection();

    // 初始化照片上传
    initPhotoUpload();

    // 初始化所有事件监听
    initEventListeners();

    // 如果已有场景，则显示主页面
    if (RemembranceState.scene) {
        document.getElementById('sceneSelectCard').classList.add('hidden');
        document.getElementById('remembranceScene').style.display = 'block';
        applySceneStyle(RemembranceState.scene);
    }

    // 更新UI
    updateUI();
});

// ============ 场景选择系统 ============
function initSceneSelection() {
    document.querySelectorAll('.scene-card').forEach(card => {
        card.addEventListener('click', () => {
            const scene = card.dataset.scene;
            selectScene(scene);
        });
    });
}

function selectScene(scene) {
    RemembranceState.scene = scene;

    // 隐藏选择卡片
    document.getElementById('sceneSelectCard').classList.add('hidden');

    // 显示主场景
    document.getElementById('remembranceScene').style.display = 'block';

    // 应用场景样式
    applySceneStyle(scene);

    // 保存状态
    saveState();
}

function applySceneStyle(scene) {
    const backgroundLayer = document.getElementById('backgroundLayer');
    if (!backgroundLayer) return;
    backgroundLayer.className = '';
    backgroundLayer.classList.add('bg-' + scene);
}

// ============ 照片上传功能 ============
function initPhotoUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const photoInput = document.getElementById('photoInput');
    const deceasedPhoto = document.getElementById('deceasedPhoto');

    // 点击上传按钮触发 file input
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }

    // file input 变化处理
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadPhoto(file);
            }
        });
    }

    // 点击已有照片时的发光动画
    if (deceasedPhoto) {
        deceasedPhoto.addEventListener('click', handlePhotoClick);
    }
}

function uploadPhoto(file) {
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('请上传 jpg/png/gif/webp 格式的图片');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        RemembranceState.photo = imageData;

        // 显示照片
        const deceasedImage = document.getElementById('deceasedImage');
        const uploadHint = document.getElementById('uploadHint');
        const photoContainer = document.getElementById('deceasedPhoto');

        if (deceasedImage) {
            deceasedImage.src = imageData;
            deceasedImage.style.display = 'block';
        }
        if (uploadHint) {
            uploadHint.style.display = 'none';
        }
        if (photoContainer) {
            photoContainer.classList.add('has-photo');
        }

        // 保存状态
        saveState();
    };
    reader.readAsDataURL(file);
}

function handlePhotoClick() {
    if (!RemembranceState.photo) return;
    const photo = document.getElementById('deceasedPhoto');
    if (!photo) return;
    photo.classList.add('active');
    setTimeout(() => photo.classList.remove('active'), 1000);
    playSound('photo');
}

// ============ 事件监听初始化 ============
function initEventListeners() {
    // --- 酥油灯点击 ---
    const leftLamp = document.getElementById('leftButterLamp');
    const rightLamp = document.getElementById('rightButterLamp');
    if (leftLamp) leftLamp.addEventListener('click', openLampModal);
    if (rightLamp) rightLamp.addEventListener('click', openLampModal);

    // --- 香炉点击 ---
    const incenseBurner = document.getElementById('incenseBurner');
    if (incenseBurner) incenseBurner.addEventListener('click', openIncenseModal);

    // --- 供品点击 ---
    bindOffering('leftVase', 'vase', 'left');
    bindOffering('rightVase', 'vase', 'right');
    bindOffering('fruitPlate', 'fruit');
    bindOffering('dessertPlate', 'dessert');
    bindOffering('teacup', 'tea');
    bindOffering('chickenOffering', 'chicken');
    bindOffering('pigOffering', 'pig');

    // --- 跪拜垫 ---
    const prayerMat = document.getElementById('prayerMat');
    if (prayerMat) prayerMat.addEventListener('click', handleKneel);

    // --- 功能按钮跳转 ---
    const prayerBtn = document.getElementById('prayerBtn');
    const fishBtn = document.getElementById('fishBtn');
    const shakeBtn = document.getElementById('shakeBtn');
    if (prayerBtn) prayerBtn.addEventListener('click', () => window.location.href = 'index.html');
    if (fishBtn) fishBtn.addEventListener('click', () => window.location.href = 'animal-release.html');
    if (shakeBtn) shakeBtn.addEventListener('click', () => window.location.href = 'index.html#shake');

    // --- 用户信息 ---
    const userInfoBtn = document.getElementById('userInfoBtn');
    if (userInfoBtn) userInfoBtn.addEventListener('click', () => {
        alert(`🙏 ${RemembranceState.user.name}\n等级：${RemembranceState.user.level}\n欢喜：${RemembranceState.user.huanxi}\n佛光：${RemembranceState.user.foguang}`);
    });

    // --- AI对话按钮 ---
    const askBtn = document.getElementById('askBtn');
    if (askBtn) askBtn.addEventListener('click', openAIChatModal);

    // --- 追思语发送 ---
    const sendWishBtn = document.getElementById('sendWishBtn');
    const wishInput = document.getElementById('wishInput');
    if (sendWishBtn) sendWishBtn.addEventListener('click', sendRemembranceMessage);
    if (wishInput) {
        wishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendRemembranceMessage();
        });
    }

    // --- 音效开关 ---
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) soundToggle.addEventListener('click', toggleSound);

    // --- 音乐控制 ---
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

    // --- 弹窗关闭 ---
    initModalClose();

    // --- 灯选择 ---
    initLampSelection();

    // --- 香选择 ---
    initIncenseSelection();

    // --- AI对话 ---
    initAIChat();
}

function bindOffering(id, type, position) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', () => handleOffering(type, position));
    }
}

// ============ 上香功能 ============
function openIncenseModal() {
    openModal('incenseModal');
}

function initIncenseSelection() {
    const options = document.querySelectorAll('[data-incense]');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const incenseType = opt.dataset.incense;
            selectIncense(incenseType);
        });
    });
}

function selectIncense(type) {
    let cost = 0;
    let foguang = 0;
    let name = '';

    switch (type) {
        case '3':
            cost = 5;
            foguang = 10;
            name = '三支清香';
            break;
        case '6':
            cost = 10;
            foguang = 20;
            name = '六支大香';
            break;
        case '9':
            cost = 20;
            foguang = 30;
            name = '九支高香';
            break;
        case 'premium':
            cost = 100;
            foguang = 100;
            name = '头香';
            break;
        default:
            cost = 5;
            foguang = 10;
            name = '清香';
    }

    if (RemembranceState.user.huanxi < cost) {
        alert(`上香需要 ${cost} 欢喜，当前欢喜不足`);
        closeModal('incenseModal');
        return;
    }

    // 扣除欢喜
    RemembranceState.user.huanxi -= cost;

    // 增加佛光
    RemembranceState.user.foguang += foguang;

    // 更新香炉状态
    RemembranceState.offerings.incense = {
        type: type,
        name: name,
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
    saveState();
    updateUI();

    // 播放音效
    playSound('incense');
}

function playIncenseAnimation() {
    const incenseBurner = document.getElementById('incenseBurnerState');
    if (!incenseBurner) return;
    incenseBurner.classList.add('has-incense');

    // 清除旧香
    const oldSticks = incenseBurner.querySelectorAll('.incense-stick');
    oldSticks.forEach(el => el.remove());

    // 根据类型显示不同数量的香
    const type = RemembranceState.offerings.incense.type;
    let count = type === 'premium' ? 9 : parseInt(type) || 3;

    // 添加新香
    for (let i = 0; i < Math.min(count, 5); i++) {
        const incense = document.createElement('div');
        incense.className = 'incense-stick';
        incense.style.cssText = `
            position: absolute;
            top: -25px;
            left: ${30 + i * 10}%;
            transform: translateX(-50%) rotate(${(i - 2) * 3}deg);
            width: 2px;
            height: 25px;
            background: linear-gradient(180deg, #FF6347 0%, #FF6347 15%, #8B4513 15%, #8B4513 100%);
            border-radius: 2px;
        `;
        incenseBurner.appendChild(incense);
    }

    // 显示倒计时
    updateIncenseCountdown();
}

function updateIncenseCountdown() {
    const countdown = document.getElementById('incenseCountdown');
    if (!countdown) return;

    if (!RemembranceState.offerings.incense) {
        countdown.style.display = 'none';
        return;
    }

    countdown.style.display = 'block';

    const update = () => {
        if (!RemembranceState.offerings.incense) {
            countdown.style.display = 'none';
            return;
        }
        const elapsed = Date.now() - RemembranceState.offerings.incense.startTime;
        const remaining = RemembranceState.offerings.incense.duration - elapsed;

        if (remaining <= 0) {
            countdown.style.display = 'none';
            RemembranceState.offerings.incense = null;
            updateIncenseUI();
            saveState();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        countdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        requestAnimationFrame(update);
    };

    update();
}

function updateIncenseUI() {
    const incenseBurner = document.getElementById('incenseBurnerState');
    if (!incenseBurner) return;

    if (RemembranceState.offerings.incense) {
        playIncenseAnimation();
    } else {
        incenseBurner.classList.remove('has-incense');
        const sticks = incenseBurner.querySelectorAll('.incense-stick');
        sticks.forEach(el => el.remove());
    }
}

// ============ 点灯功能 ============
function openLampModal() {
    openModal('lampModal');
}

function initLampSelection() {
    document.querySelectorAll('.lamp-option').forEach(lamp => {
        lamp.addEventListener('click', () => {
            const lampType = lamp.dataset.lamp;
            selectLamp(lampType);
        });
    });
}

function selectLamp(type) {
    const costs = {
        warm: 10,
        peace: 10,
        love: 10,
        health: 10,
        eternal: 100
    };

    const names = {
        warm: '温暖灯',
        peace: '安宁灯',
        love: '思念灯',
        health: '健康灯',
        eternal: '长明灯'
    };

    const colors = {
        warm: '#FFD700',
        peace: '#87CEEB',
        love: '#FF69B4',
        health: '#32CD32',
        eternal: '#FF4500'
    };

    const cost = costs[type] || 10;

    if (RemembranceState.user.huanxi < cost) {
        alert(`点灯需要 ${cost} 欢喜，欢喜不足`);
        return;
    }

    // 扣除欢喜
    RemembranceState.user.huanxi -= cost;

    // 更新灯状态
    RemembranceState.offerings.lamp = {
        type: type,
        color: colors[type] || '#FFD700',
        name: names[type] || '祈福灯',
        startTime: Date.now(),
        duration: type === 'eternal' ? 365 * 24 * 60 * 60 * 1000 : 3 * 24 * 60 * 60 * 1000
    };

    // 增加佛光
    const foguang = type === 'eternal' ? 200 : 30;
    RemembranceState.user.foguang += foguang;

    // 关闭弹窗
    closeModal('lampModal');

    // 播放点灯动画
    playLampAnimation();

    // 显示飘字
    showFloatingText(`+${foguang} 佛光`, document.getElementById('leftButterLamp'));

    // 保存状态
    saveState();
    updateUI();

    // 播放音效
    playSound('lamp');
}

function playLampAnimation() {
    const leftLamp = document.getElementById('leftButterLampLight');
    const rightLamp = document.getElementById('rightButterLampLight');
    if (!leftLamp || !rightLamp) return;

    leftLamp.classList.add('lit');
    rightLamp.classList.add('lit');

    const lampColor = RemembranceState.offerings.lamp.color;
    [leftLamp, rightLamp].forEach(lamp => {
        lamp.style.boxShadow = `0 0 25px ${lampColor}`;
    });

    // 照片边框辉光
    const photoContainer = document.getElementById('deceasedPhoto');
    if (photoContainer) {
        photoContainer.style.boxShadow = `0 0 40px ${lampColor}`;
    }

    // 显示灯的倒计时
    updateLampCountdown();
}

function updateLampCountdown() {
    const countdown = document.getElementById('lampCountdown');
    if (!countdown) return;

    if (!RemembranceState.offerings.lamp) {
        countdown.style.display = 'none';
        return;
    }

    countdown.style.display = 'block';

    const update = () => {
        if (!RemembranceState.offerings.lamp) {
            countdown.style.display = 'none';
            return;
        }
        const elapsed = Date.now() - RemembranceState.offerings.lamp.startTime;
        const remaining = RemembranceState.offerings.lamp.duration - elapsed;

        if (remaining <= 0) {
            countdown.style.display = 'none';
            RemembranceState.offerings.lamp = null;
            const leftLamp = document.getElementById('leftButterLampLight');
            const rightLamp = document.getElementById('rightButterLampLight');
            if (leftLamp) leftLamp.classList.remove('lit');
            if (rightLamp) rightLamp.classList.remove('lit');
            saveState();
            return;
        }

        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        countdown.textContent = `剩余 ${days}天${hours}时`;
        requestAnimationFrame(update);
    };

    update();
}

// ============ 供品供奉功能 ============
function handleOffering(type, position) {
    // 检查是否已经供奉
    if (type === 'vase') {
        if (position === 'left' && RemembranceState.offerings.leftVase) {
            alert('此花瓶已供奉鲜花');
            return;
        }
        if (position === 'right' && RemembranceState.offerings.rightVase) {
            alert('此花瓶已供奉鲜花');
            return;
        }
    } else if (RemembranceState.offerings[type]) {
        const offeringNames = {
            fruit: '果盘',
            dessert: '点心',
            tea: '茶水',
            chicken: '烧鸡',
            pig: '烤乳猪'
        };
        alert(`${offeringNames[type] || '供品'}已供奉`);
        return;
    }

    // 检查欢喜余额
    if (RemembranceState.user.huanxi < 5) {
        alert('供奉需要 5 欢喜，当前欢喜不足');
        return;
    }

    // 打开供奉确认弹窗
    openOfferingModal(type, position);
}

function openOfferingModal(type, position) {
    const offeringInfo = {
        vase: { title: '🌸 供奉鲜花', icon: '🌸', desc: '鲜花供奉，表达思念' },
        fruit: { title: '🍇 供奉果品', icon: '🍇', desc: '新鲜水果供奉' },
        dessert: { title: '🍮 供奉点心', icon: '🍮', desc: '精致点心供奉' },
        tea: { title: '🍵 供奉茶水', icon: '🍵', desc: '香茶一杯奉先人' },
        chicken: { title: '🍗 供奉烧鸡', icon: '🍗', desc: '美味烧鸡供奉' },
        pig: { title: '🐷 供奉烤乳猪', icon: '🐷', desc: '烤乳猪供奉' }
    };

    const info = offeringInfo[type] || { title: '供奉', icon: '🎁', desc: '诚心供奉' };
    const cost = 5;
    const reward = 50;

    document.getElementById('offeringTitle').textContent = info.title;
    document.getElementById('offeringContent').innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 80px; margin-bottom: 20px;">${info.icon}</div>
            <div style="font-size: 18px; color: #8B4513; margin-bottom: 10px;">${info.desc}</div>
            <div style="color: #666; margin-bottom: 20px;">供奉持续7天</div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                <div>
                    <div style="color: #FF6347; font-weight: bold;">消耗</div>
                    <div style="font-size: 24px;">💎 ${cost} 欢喜</div>
                </div>
                <div>
                    <div style="color: #32CD32; font-weight: bold;">奖励</div>
                    <div style="font-size: 24px;">✨ ${reward} 佛光</div>
                </div>
            </div>
            <div style="color: #999; font-size: 12px; margin-bottom: 15px;">当前欢喜：${RemembranceState.user.huanxi}</div>
            <button onclick="confirmOffering('${type}', '${position}')"
                style="padding: 15px 40px; background: linear-gradient(135deg, #FFD700, #FFA500); border: none; border-radius: 25px; font-size: 16px; cursor: pointer; color: #FFF; font-weight: bold;">
                确认供奉
            </button>
        </div>
    `;

    openModal('offeringModal');
}

function confirmOffering(type, position) {
    const cost = 5;
    const reward = 50;

    if (RemembranceState.user.huanxi < cost) {
        alert('欢喜不足，无法供奉');
        closeModal('offeringModal');
        return;
    }

    // 扣除欢喜
    RemembranceState.user.huanxi -= cost;

    // 增加佛光
    RemembranceState.user.foguang += reward;

    // 更新供品状态
    if (type === 'vase') {
        if (position === 'left' || position === 'null') {
            RemembranceState.offerings.leftVase = true;
        } else if (position === 'right') {
            RemembranceState.offerings.rightVase = true;
        } else {
            RemembranceState.offerings.leftVase = true;
        }
    } else {
        RemembranceState.offerings[type] = true;
    }

    // 关闭弹窗
    closeModal('offeringModal');

    // 播放供奉动画
    playOfferingAnimation(type, position);

    // 显示飘字
    showFloatingText(`+${reward} 佛光`, document.getElementById('deceasedPhoto'));

    // 保存状态
    saveState();
    updateUI();

    // 播放音效
    playSound('offering');
}

function playOfferingAnimation(type, position) {
    let targetEl = null;
    let targetClass = '';

    if (type === 'vase') {
        if (position === 'right') {
            targetEl = document.getElementById('rightVaseFlowers');
        } else {
            targetEl = document.getElementById('leftVaseFlowers');
        }
        targetClass = 'has-flowers';
    } else if (type === 'fruit') {
        targetEl = document.getElementById('fruitPlateContent');
        targetClass = 'has-fruit';
    } else if (type === 'dessert') {
        targetEl = document.getElementById('dessertPlateContent');
        targetClass = 'has-dessert';
    } else if (type === 'tea') {
        targetEl = document.getElementById('teacupState');
        targetClass = 'has-tea';
    } else if (type === 'chicken') {
        targetEl = document.getElementById('chickenState');
        targetClass = 'has-offering';
    } else if (type === 'pig') {
        targetEl = document.getElementById('pigState');
        targetClass = 'has-offering';
    }

    if (targetEl) {
        targetEl.classList.add(targetClass);

        // 果盘和点心添加内容
        if (type === 'fruit') {
            targetEl.innerHTML = '<span class="fruit"></span><span class="fruit"></span><span class="fruit"></span>';
        } else if (type === 'dessert') {
            targetEl.innerHTML = '<span class="dessert"></span><span class="dessert"></span><span class="dessert"></span>';
        }
    }

    // 照片边框闪金
    const photo = document.getElementById('deceasedPhoto');
    if (photo) {
        photo.classList.add('active');
        setTimeout(() => photo.classList.remove('active'), 1000);
    }

    // 佛光亮效
    playWishEffect();
}

// ============ 跪拜功能 ============
function handleKneel() {
    if (RemembranceState.actions.kneelCount >= 3) {
        alert('今日跪拜次数已用完（每日3次），明日再来祭拜！');
        return;
    }

    // 播放跪拜动画
    const prayerMat = document.getElementById('prayerMat');
    if (prayerMat) {
        prayerMat.classList.add('kneeling');
        setTimeout(() => prayerMat.classList.remove('kneeling'), 800);
    }

    // 增加次数
    RemembranceState.actions.kneelCount++;

    // 增加佛光
    RemembranceState.user.foguang += 15;

    // 自动上香效果（如未上香）
    if (!RemembranceState.offerings.incense) {
        RemembranceState.offerings.incense = {
            type: 'auto',
            name: '跪拜清香',
            startTime: Date.now(),
            duration: 10 * 60 * 1000
        };
        playIncenseAnimation();
    }

    // 佛光亮效
    playWishEffect();

    // 显示飘字
    if (prayerMat) {
        showFloatingText(`+15 佛光 (${RemembranceState.actions.kneelCount}/3)`, prayerMat);
    }

    // 保存状态
    saveState();
    updateUI();

    // 播放音效
    playSound('bell');
}

// ============ 追思语输入 ============
function sendRemembranceMessage() {
    const input = document.getElementById('wishInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
        alert('请输入追思语');
        return;
    }
    if (text.length > 50) {
        alert('追思语过长（限50字）');
        return;
    }

    // 添加到弹屏
    addToBanner(text);

    // 增加佛光
    RemembranceState.user.foguang += 10;

    // 清空输入
    input.value = '';

    // 播放特效
    playWishEffect();

    // 显示飘字
    const sendBtn = document.getElementById('sendWishBtn');
    if (sendBtn) showFloatingText('+10 佛光', sendBtn);

    // 保存状态
    saveState();
    updateUI();

    // 播放音效
    playSound('prayer');
}

function addToBanner(text) {
    const bannerContent = document.getElementById('bannerContent');
    if (!bannerContent) return;

    const userName = RemembranceState.user.name || '思念者';
    const newItem = document.createElement('div');
    newItem.className = 'banner-item';
    newItem.textContent = `💐 ${userName}：${text}`;
    bannerContent.insertBefore(newItem, bannerContent.firstChild);

    // 限制弹屏条目数量
    const items = bannerContent.querySelectorAll('.banner-item');
    if (items.length > 20) {
        for (let i = 20; i < items.length; i++) {
            items[i].remove();
        }
    }
}

function playWishEffect() {
    const lightEffect = document.getElementById('buddhaLightEffect');
    if (!lightEffect) return;
    lightEffect.classList.add('active');
    void lightEffect.offsetWidth;
    setTimeout(() => lightEffect.classList.remove('active'), 1500);
}

// ============ AI对话功能 ============
function openAIChatModal() {
    // 检查是否音容宛在场景
    if (RemembranceState.scene !== 'ai') {
        alert('此功能仅在"音容宛在"场景可用，请切换场景后再试');
        return;
    }

    // 检查是否上传照片
    if (!RemembranceState.photo) {
        alert('请先上传先人照片后再与先人对话');
        return;
    }

    // 检查今日对话次数
    if (RemembranceState.actions.chatCount >= 10) {
        alert('今日AI对话次数已用完（每日10次），明日再来！');
        return;
    }

    // 检查欢喜余额
    if (RemembranceState.user.huanxi < 1) {
        alert('AI对话需要 1 欢喜，当前欢喜不足');
        return;
    }

    openModal('aiChatModal');
    initAIConversation();
}

function initAIConversation() {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    messages.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #8B4513;">
            <div style="font-size: 40px; margin-bottom: 10px;">👤</div>
            <div style="font-size: 14px;">与先人对话中...（今日剩余 ${10 - RemembranceState.actions.chatCount} 次）</div>
        </div>
    `;
}

function initAIChat() {
    const sendBtn = document.getElementById('sendChatBtn');
    const input = document.getElementById('chatInput');

    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // 检查欢喜余额
    if (RemembranceState.user.huanxi < 1) {
        alert('AI对话需要 1 欢喜，当前欢喜不足');
        return;
    }

    // 检查今日剩余次数
    if (RemembranceState.actions.chatCount >= 10) {
        alert('今日AI对话次数已用完');
        return;
    }

    // 扣除欢喜
    RemembranceState.user.huanxi -= 1;

    // 增加对话次数
    RemembranceState.actions.chatCount++;

    // 增加佛光
    RemembranceState.user.foguang += 5;

    // 添加用户消息
    addChatMessage(message, 'user');
    input.value = '';

    // 显示思考动画
    setTimeout(() => {
        const messages = document.getElementById('chatMessages');
        if (!messages) return;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'thinking-' + Date.now();
        thinkingDiv.style.cssText = 'text-align: left; margin-bottom: 15px;';
        thinkingDiv.innerHTML = `
            <div style="display: inline-flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 30px;">👤</div>
                <div style="background: #FFF8DC; color: #5D4037; padding: 10px 15px; border-radius: 15px;">先人回忆中...</div>
            </div>
        `;
        messages.appendChild(thinkingDiv);
        messages.scrollTop = messages.scrollHeight;

        // AI头像动画
        const aiAvatar = document.getElementById('aiAvatar');
        if (aiAvatar) {
            aiAvatar.classList.add('ai-speaking');
            setTimeout(() => aiAvatar.classList.remove('ai-speaking'), 2500);
        }

        // 模拟先人回复
        setTimeout(() => {
            thinkingDiv.remove();
            const response = getDeceasedResponse(message);
            addChatMessage(response, 'deceased');
        }, 2000);
    }, 500);

    // 保存状态
    saveState();
    updateUI();
}

function addChatMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

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
                    <div style="font-size: 30px;">👤</div>
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

function getDeceasedResponse(message) {
    const q = message.toLowerCase();

    // 健康相关
    if (/身体|健康|病|医|平安/.test(q)) {
        const replies = [
            '孩子，我在这里很好，不必挂念。你要好好照顾自己的身体，健康才是最大的福气。',
            '看到你们平安健康，我便安心了。记得按时吃饭，不要太劳累。',
            '身体是一切的根本，你要保重。我会在那边保佑你们全家平安健康。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 思念相关
    if (/想|念|思念|怀念|梦|见/.test(q)) {
        const replies = [
            '孩子，我也想念你们。但不必太悲伤，我始终在你们身边，看着你们幸福生活。',
            '你梦到我了吗？我很好，只是换了一个地方陪伴你们。',
            '思念是最美好的情感，我感受到了。你们的爱，是我最大的慰藉。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 工作事业
    if (/工作|事业|钱|财|生意|老板|累|加班/.test(q)) {
        const replies = [
            '工作辛苦，要注意休息。钱是赚不完的，健康才是最重要的。',
            '尽力就好，不必太过执着。只要你们平平安安，我就很欣慰了。',
            '踏实做事，认真做人。不求大富大贵，但愿问心无愧。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 家庭婚姻
    if (/结婚|婚|姻|恋|爱|对象|家|家人|父母/.test(q)) {
        const replies = [
            '家和万事兴。善待家人，和睦相处，便是最大的幸福。',
            '爱情是缘分，婚姻是经营。珍惜眼前人，用心去爱。',
            '家人是最深的缘分。无论贫富，相守相依便是最大的福报。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 孩子/子女
    if (/孩子|儿女|宝宝|儿子|女儿|孙|孙辈/.test(q)) {
        const replies = [
            '孩子是上天赐予的礼物，要好好培养，也要让他们自由成长。',
            '让孩子们健康快乐地长大，便是对我最好的告慰。',
            '儿孙自有儿孙福，不必过度操劳。教导他们正直善良就够了。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 烦恼/压力
    if (/烦|恼|焦虑|压|难|困|苦|累|愁|伤心|难过/.test(q)) {
        const replies = [
            '孩子，别太难过。一切困难都是暂时的，放宽心，慢慢都会好起来的。',
            '烦恼如浮云，终将散去。深呼吸，告诉自己：这也会过去。',
            '人生哪能一帆风顺？苦乐皆是经历。放下执念，心自宽广。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 节日/生日
    if (/生日|节日快乐|过年|新年|春节|清明|中元|祭/.test(q)) {
        const replies = [
            '谢谢你还记得我。你们幸福快乐，便是给我最好的礼物。',
            '每逢佳节倍思亲。我也想念你们，但不必悲伤，笑着面对每一天。',
            '节日是团聚的日子。你们开开心心在一起，我在天上也很欢喜。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 感谢/感恩
    if (/谢谢|感谢|感恩|辛苦|养育|教养/.test(q)) {
        const replies = [
            '不用谢我。能成为你们的亲人，是我此生最大的福气。',
            '养育你们是我最开心的事。看到你们长大成人，我感到无比骄傲。',
            '孩子，谢谢你的心意。能被你们记在心里，我已心满意足。'
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 通用温暖回复
    const generalReplies = [
        '孩子，我在这里很好。你们也要好好生活，不必挂念。',
        '看到你说这些，我很欣慰。你长大了，成熟了。',
        '我在另一个世界，依然守护着你们。愿你们平安喜乐。',
        '谢谢你来看我。你的思念，我感受到了。',
        '人生如旅，我只是先一步到站。你们继续好好走下去。',
        '活着的人要好好活着。这也是我对你们的期望。',
        '爱你，我的孩子。永远爱你。'
    ];

    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

// ============ 音效控制 ============
function toggleSound() {
    RemembranceState.soundEnabled = !RemembranceState.soundEnabled;
    const btn = document.getElementById('soundToggle');
    if (btn) btn.textContent = RemembranceState.soundEnabled ? '🎵' : '🔇';
    saveState();
}

function playSound(type) {
    if (!RemembranceState.soundEnabled) return;
    console.log(`♪ 播放音效: ${type}`);
}

// ============ 音乐控制 ============
function toggleMusic() {
    const btn = document.getElementById('musicBtn');
    if (!btn) return;
    btn.classList.toggle('playing');
    if (btn.classList.contains('playing')) {
        btn.textContent = '🎵';
    } else {
        btn.textContent = '🎶';
    }
}

// ============ 弹窗系统 ============
function initModalClose() {
    // 关闭按钮
    const closeButtons = {
        'closeLampModal': 'lampModal',
        'closeOfferingModal': 'offeringModal',
        'closeAiChatModal': 'aiChatModal',
        'closeIncenseModal': 'incenseModal'
    };

    Object.keys(closeButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => closeModal(closeButtons[btnId]));
        }
    });

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// ============ 飘字特效 ============
function showFloatingText(text, element) {
    if (!element) return;

    // 创建全局飘字容器（如不存在）
    let container = document.getElementById('floatingTextContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'floatingTextContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 3000;
        `;
        document.body.appendChild(container);
    }

    const rect = element.getBoundingClientRect();

    const floatText = document.createElement('div');
    floatText.className = 'floating-text';
    floatText.textContent = text;
    floatText.style.cssText = `
        position: absolute;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        transform: translateX(-50%);
        color: #FFD700;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.5);
        pointer-events: none;
        animation: floatUp 2s ease-out forwards;
        white-space: nowrap;
    `;

    container.appendChild(floatText);

    setTimeout(() => {
        floatText.remove();
    }, 2000);
}

// ============ 状态保存与加载 ============
function saveState() {
    try {
        localStorage.setItem('remembrance_state', JSON.stringify(RemembranceState));
    } catch (e) {
        console.warn('保存状态失败（可能是 localStorage 已满）:', e);
    }
}

function loadState() {
    const saved = localStorage.getItem('remembrance_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            // 合并状态
            if (state.scene) RemembranceState.scene = state.scene;
            if (state.photo) RemembranceState.photo = state.photo;
            if (state.offerings) Object.assign(RemembranceState.offerings, state.offerings);
            if (state.user) Object.assign(RemembranceState.user, state.user);
            if (state.actions) Object.assign(RemembranceState.actions, state.actions);
            if (typeof state.soundEnabled === 'boolean') RemembranceState.soundEnabled = state.soundEnabled;

            // 如果有照片，恢复显示
            if (RemembranceState.photo) {
                const deceasedImage = document.getElementById('deceasedImage');
                const uploadHint = document.getElementById('uploadHint');
                const photoContainer = document.getElementById('deceasedPhoto');
                if (deceasedImage) {
                    deceasedImage.src = RemembranceState.photo;
                    deceasedImage.style.display = 'block';
                }
                if (uploadHint) uploadHint.style.display = 'none';
                if (photoContainer) photoContainer.classList.add('has-photo');
            }
        } catch (e) {
            console.error('状态加载失败：', e);
        }
    }
}

// ============ 每日次数重置 ============
function resetDailyCounts() {
    const today = new Date().toDateString();

    if (RemembranceState.actions.lastKneelDate !== today) {
        RemembranceState.actions.kneelCount = 0;
        RemembranceState.actions.lastKneelDate = today;
    }

    if (RemembranceState.actions.lastChatDate !== today) {
        RemembranceState.actions.chatCount = 0;
        RemembranceState.actions.lastChatDate = today;
    }

    saveState();
}

// ============ UI更新 ============
function updateUI() {
    // 更新用户信息
    const userNameEl = document.getElementById('userName');
    const userLevelEl = document.getElementById('userLevel');
    if (userNameEl) userNameEl.textContent = RemembranceState.user.name;
    if (userLevelEl) {
        const level = Math.floor(RemembranceState.user.foguang / 100) + 1;
        userLevelEl.textContent = `Lv.${level} | 欢喜:${RemembranceState.user.huanxi} | 佛光:${RemembranceState.user.foguang}`;
    }

    // 更新花瓶状态
    if (RemembranceState.offerings.leftVase) {
        const el = document.getElementById('leftVaseFlowers');
        if (el) el.classList.add('has-flowers');
    }
    if (RemembranceState.offerings.rightVase) {
        const el = document.getElementById('rightVaseFlowers');
        if (el) el.classList.add('has-flowers');
    }

    // 果盘
    if (RemembranceState.offerings.fruit) {
        const el = document.getElementById('fruitPlateContent');
        if (el) {
            el.classList.add('has-fruit');
            if (!el.querySelector('.fruit')) {
                el.innerHTML = '<span class="fruit"></span><span class="fruit"></span><span class="fruit"></span>';
            }
        }
    }

    // 点心
    if (RemembranceState.offerings.dessert) {
        const el = document.getElementById('dessertPlateContent');
        if (el) {
            el.classList.add('has-dessert');
            if (!el.querySelector('.dessert')) {
                el.innerHTML = '<span class="dessert"></span><span class="dessert"></span><span class="dessert"></span>';
            }
        }
    }

    // 茶杯
    if (RemembranceState.offerings.tea) {
        const el = document.getElementById('teacupState');
        if (el) el.classList.add('has-tea');
    }

    // 烧鸡
    if (RemembranceState.offerings.chicken) {
        const el = document.getElementById('chickenState');
        if (el) el.classList.add('has-offering');
    }

    // 烤乳猪
    if (RemembranceState.offerings.pig) {
        const el = document.getElementById('pigState');
        if (el) el.classList.add('has-offering');
    }

    // 香炉
    if (RemembranceState.offerings.incense) {
        const elapsed = Date.now() - RemembranceState.offerings.incense.startTime;
        if (elapsed >= RemembranceState.offerings.incense.duration) {
            RemembranceState.offerings.incense = null;
            saveState();
        } else {
            updateIncenseUI();
        }
    }

    // 酥油灯
    if (RemembranceState.offerings.lamp) {
        const elapsed = Date.now() - RemembranceState.offerings.lamp.startTime;
        if (elapsed >= RemembranceState.offerings.lamp.duration) {
            RemembranceState.offerings.lamp = null;
            saveState();
        } else {
            playLampAnimation();
        }
    }

    // 更新音效按钮
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.textContent = RemembranceState.soundEnabled ? '🎵' : '🔇';
    }
}

// ============ 工具函数 ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ 导出全局函数供HTML调用 ============
window.RemembranceState = RemembranceState;
window.confirmOffering = confirmOffering;
window.closeModal = closeModal;
window.openModal = openModal;
window.showFloatingText = showFloatingText;
