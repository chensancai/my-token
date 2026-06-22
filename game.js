/* ===========================================================
   祈福拜佛 · 游戏核心逻辑
   - 状态管理：功德 / 贡品 / 心愿
   - 交互：礼拜、供奉、许愿、问佛
   - 音效：木鱼 / 钟 / 梵乐（Web Audio API 合成，无需素材文件）
   =========================================================== */

(() => {
  "use strict";

  // ---------- 游戏状态 ----------
  const state = {
    merit: Number(localStorage.getItem("merit") || 0),
    offered: JSON.parse(localStorage.getItem("offered") || "{}"),
    musicOn: true,
  };

  // ---------- DOM 引用 ----------
  const $ = (sel) => document.querySelector(sel);
  const meritValue = $("#meritValue");
  const buddha = $("#buddha");
  const particleLayer = $("#particleLayer");
  const floatingLayer = $("#floatingLayer");

  const wishModal = $("#wishModal");
  const talkModal = $("#talkModal");
  const wishText = $("#wishText");
  const chatArea = $("#chatArea");
  const chatInput = $("#chatInput");

  // ---------- 初始渲染 ----------
  meritValue.textContent = state.merit;

  // 贡品定义
  const OFFERING_MAP = {
    incense: { name: "三炷香", merit: 8, text: "愿以此香火，供养十方诸佛" },
    fruit:   { name: "鲜果",   merit: 6, text: "愿以此甘果，布施一切众生" },
    flower:  { name: "鲜花",   merit: 5, text: "愿以此芬芳，献给佛法僧宝" },
    candle:  { name: "蜡烛",   merit: 7, text: "愿以此光明，驱散无明黑暗" },
    tea:     { name: "清茶",   merit: 5, text: "愿以此甘露，洗涤身心尘垢" },
  };

  // ---------- 音效系统（Web Audio API 合成） ----------
  let audioCtx = null;
  let musicGain = null;
  let musicTimer = null;

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("浏览器不支持音频");
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 木鱼声（短促敲击）
  function playMuyu(pitch = 1.0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(80 * pitch, now + 0.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // 叠加一个木质高频
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(800 * pitch, now);
    osc2.frequency.exponentialRampToValueAtTime(300 * pitch, now + 0.08);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.exponentialRampToValueAtTime(0.15, now + 0.005);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.2);
  }

  // 钟声（悠长低沉）
  function playBell() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 660, 880].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + 2.5);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18 - i * 0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.6);
    });
  }

  // 梵乐背景（缓慢的木鱼节奏 + 低沉持续音）
  function startMusic() {
    const ctx = ensureAudio();
    if (!ctx || !state.musicOn) return;
    stopMusic();

    // 低沉持续音 drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 110;
    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
    drone.connect(droneGain).connect(ctx.destination);
    drone.start();

    const drone2 = ctx.createOscillator();
    const drone2Gain = ctx.createGain();
    drone2.type = "sine";
    drone2.frequency.value = 165;
    drone2Gain.gain.setValueAtTime(0, ctx.currentTime);
    drone2Gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
    drone2.connect(drone2Gain).connect(ctx.destination);
    drone2.start();

    musicGain = { drone, drone2, droneGain, drone2Gain };

    // 每隔约 3 秒轻敲一次木鱼
    let beat = 0;
    musicTimer = setInterval(() => {
      if (!state.musicOn) return;
      beat = (beat + 1) % 4;
      playMuyu(beat === 0 ? 1.1 : 0.9);
    }, 2800);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (musicGain) {
      try {
        const ctx = audioCtx;
        musicGain.droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        musicGain.drone2Gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        setTimeout(() => {
          try { musicGain.drone.stop(); musicGain.drone2.stop(); } catch(e){}
        }, 600);
      } catch (e) {}
      musicGain = null;
    }
  }

  // ---------- 功德更新 ----------
  function addMerit(n) {
    state.merit += n;
    if (state.merit < 0) state.merit = 0;
    meritValue.textContent = state.merit;
    localStorage.setItem("merit", state.merit);
    // 数值跳动效果
    meritValue.style.transform = "scale(1.3)";
    meritValue.style.transition = "transform 0.3s";
    setTimeout(() => { meritValue.style.transform = "scale(1)"; }, 300);
  }

  // ---------- 粒子：烟雾 / 金光 ----------
  function spawnSmoke(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "smoke-particle";
      p.style.left = (x + (Math.random() * 40 - 20)) + "px";
      p.style.top = y + "px";
      const size = 20 + Math.random() * 30;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
      p.style.animationDuration = (4 + Math.random() * 3) + "s";
      particleLayer.appendChild(p);
      setTimeout(() => p.remove(), 7000);
    }
  }

  function spawnGoldParticle(x, y, text) {
    const el = document.createElement("div");
    el.className = "gold-particle";
    el.textContent = text || "+功德";
    el.style.left = x + "px";
    el.style.top = y + "px";
    particleLayer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // 愿望文字飘起
  function spawnWishText(text) {
    const stage = document.querySelector(".stage");
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "wish-text";
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2 + (Math.random() * 200 - 100)) + "px";
    el.style.top  = (rect.top + 280) + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }

  // ---------- 佛光强度动画 ----------
  function triggerHaloBurst() {
    buddha.classList.add("lit");
    setTimeout(() => buddha.classList.remove("lit"), 1800);
  }

  // ---------- 交互：礼拜 ----------
  $("#btnPray").addEventListener("click", () => {
    ensureAudio();
    playMuyu();
    buddha.classList.remove("praying");
    void buddha.offsetWidth;
    buddha.classList.add("praying");
    addMerit(3);
    triggerHaloBurst();
    const rect = buddha.getBoundingClientRect();
    const stageRect = document.querySelector(".stage").getBoundingClientRect();
    spawnGoldParticle(rect.left - stageRect.left + rect.width / 2 - 30, rect.top - stageRect.top + 60, "+3 功德");
    spawnSmoke(rect.left - stageRect.left + rect.width / 2 - 15, rect.top - stageRect.top + 200, 4);
    setTimeout(playMuyu, 900);
    setTimeout(playMuyu, 1800);
  });

  // ---------- 交互：供奉（点击贡品） ----------
  document.querySelectorAll(".offering-item").forEach((item) => {
    item.addEventListener("click", () => {
      ensureAudio();
      const type = item.dataset.type;
      const info = OFFERING_MAP[type];
      if (!info) return;
      item.classList.remove("active");
      void item.offsetWidth;
      item.classList.add("active");
      playBell();
      addMerit(info.merit);
      triggerHaloBurst();
      const rect = item.getBoundingClientRect();
      const stageRect = document.querySelector(".stage").getBoundingClientRect();
      spawnGoldParticle(rect.left - stageRect.left, rect.top - stageRect.top, `+${info.merit} 功德`);
      spawnWishText(info.text);
      spawnSmoke(rect.left - stageRect.left + 20, rect.top - stageRect.top + 40, 5);
      // 记录供奉次数
      state.offered[type] = (state.offered[type] || 0) + 1;
      localStorage.setItem("offered", JSON.stringify(state.offered));
    });
  });

  // ---------- 交互：许愿 ----------
  $("#btnWish").addEventListener("click", () => {
    wishText.value = "";
    wishModal.classList.add("show");
    setTimeout(() => wishText.focus(), 100);
  });
  $("#btnCloseWish").addEventListener("click", () => wishModal.classList.remove("show"));
  $("#btnSubmitWish").addEventListener("click", submitWish);
  wishText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitWish();
  });

  function submitWish() {
    const text = (wishText.value || "").trim();
    if (!text) {
      wishText.placeholder = "请先写下你的心愿…";
      wishText.focus();
      return;
    }
    ensureAudio();
    playBell();
    addMerit(10);
    triggerHaloBurst();
    // 拆分显示（防止超长）
    const pieces = text.length > 18 ? [text.slice(0, Math.ceil(text.length / 2)), text.slice(Math.ceil(text.length / 2))] : [text];
    pieces.forEach((p, i) => {
      setTimeout(() => spawnWishText(p), i * 600);
    });
    spawnWishText("愿 · 满 · 圆");
    wishModal.classList.remove("show");
  }

  // ---------- 交互：问佛 ----------
  const BUDDHA_REPLIES = [
    "一切有为法，如梦幻泡影，如露亦如电，应作如是观。",
    "心生种种法生，心灭种种法灭。一念清净，处处莲花。",
    "莫问前程，但行好事。你若盛开，清风自来。",
    "烦恼即菩提，转识成智。心安，便是归处。",
    "戒、定、慧，三学增上。先净其心，次修其行。",
    "菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。",
    "但自观身行，若正若邪。行有不得，反求诸己。",
    "万法皆空，因果不空。当下一念，即是未来。",
    "慈悲喜舍，四无量心。以爱己之心爱人，便得解脱。",
    "随缘消旧业，更莫造新殃。花开花落，自有其时。",
    "色即是空，空即是色。苦乐顺逆，皆是道场。",
    "但于事上通无事，见色闻声不用聋。行到水穷处，坐看云起时。",
  ];

  function pickReply(userText) {
    // 简单关键词匹配，增强"对话"感
    const t = userText || "";
    const mapping = [
      { keys: ["病", "痛", "健康", "身体"], reply: "身是苦本，心是苦根。调饮食、调睡眠、调心息。身安则道隆。" },
      { keys: ["爱", "情", "恋", "姻缘"], reply: "缘来则聚，缘去则散。不必强求，亦不必强留。珍惜当下，便是深情。" },
      { keys: ["财", "钱", "穷", "富", "生意"], reply: "福报从布施来，富贵从恭敬来。勤修善因，自得善果。" },
      { keys: ["学", "考", "试", "书"], reply: "一分耕耘一分收获。定心读书，莫问前程。功不唐捐。" },
      { keys: ["烦", "恼", "焦虑", "忧", "愁"], reply: "烦恼如风，心若虚空。风来疏竹，风过而竹不留声。" },
      { keys: ["死", "亡", "失", "去"], reply: "生灭无常，是为常态。逝者已矣，生者珍重。念佛回向，愿彼安乐。" },
      { keys: ["佛", "菩萨", "经", "法"], reply: "依法不依人，依义不依语。深入经藏，智慧如海。" },
      { keys: ["工作", "事业", "职", "业"], reply: "敬业乐群，尽心尽力。但问耕耘，不问收获。" },
      { keys: ["家", "父母", "家人", "亲"], reply: "堂上有佛，何须远求。孝养父母，即是供养如来。" },
    ];
    for (const m of mapping) {
      if (m.keys.some((k) => t.includes(k))) return m.reply;
    }
    return BUDDHA_REPLIES[Math.floor(Math.random() * BUDDHA_REPLIES.length)];
  }

  function addChat(text, role = "user") {
    const el = document.createElement("div");
    el.className = "chat-msg " + role;
    el.textContent = text;
    chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  $("#btnTalk").addEventListener("click", () => {
    chatArea.innerHTML = "";
    chatInput.value = "";
    talkModal.classList.add("show");
    setTimeout(() => chatInput.focus(), 100);
    addChat("施主，请说出心中所疑。", "buddha");
  });
  $("#btnCloseTalk").addEventListener("click", () => talkModal.classList.remove("show"));
  $("#btnSendTalk").addEventListener("click", sendTalk);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendTalk();
  });

  function sendTalk() {
    const text = (chatInput.value || "").trim();
    if (!text) return;
    addChat(text, "user");
    chatInput.value = "";
    ensureAudio();
    playMuyu(1.0);
    // "思考"片刻，再作答
    const thinking = document.createElement("div");
    thinking.className = "chat-msg buddha";
    thinking.textContent = "…";
    thinking.style.opacity = "0.6";
    chatArea.appendChild(thinking);
    chatArea.scrollTop = chatArea.scrollHeight;
    setTimeout(() => {
      thinking.remove();
      const reply = pickReply(text);
      // 逐字显示，营造庄严感
      const msgBox = document.createElement("div");
      msgBox.className = "chat-msg buddha";
      chatArea.appendChild(msgBox);
      let i = 0;
      const typeTimer = setInterval(() => {
        msgBox.textContent = reply.slice(0, i + 1);
        chatArea.scrollTop = chatArea.scrollHeight;
        i++;
        if (i >= reply.length) {
          clearInterval(typeTimer);
          addMerit(2);
        }
      }, 90);
    }, 900);
  }

  // ---------- 开关佛乐 ----------
  const btnMusic = $("#btnToggleMusic");
  btnMusic.addEventListener("click", () => {
    state.musicOn = !state.musicOn;
    if (state.musicOn) {
      btnMusic.classList.remove("off");
      startMusic();
    } else {
      btnMusic.classList.add("off");
      stopMusic();
    }
  });

  // ---------- 重置 ----------
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("确定重置功德与供奉记录吗？")) return;
    state.merit = 0;
    state.offered = {};
    localStorage.removeItem("merit");
    localStorage.removeItem("offered");
    meritValue.textContent = 0;
  });

  // ---------- 首次用户交互后启动音频（浏览器策略） ----------
  function firstUserGesture() {
    ensureAudio();
    if (state.musicOn) startMusic();
    document.removeEventListener("click", firstUserGesture);
    document.removeEventListener("keydown", firstUserGesture);
  }
  document.addEventListener("click", firstUserGesture);
  document.addEventListener("keydown", firstUserGesture);

  // ---------- 页面载入后，放一炷常燃的烟 ----------
  function ambientSmoke() {
    const stageRect = document.querySelector(".stage").getBoundingClientRect();
    const centerX = stageRect.width / 2 - 10;
    const baseY = stageRect.height - 200;
    spawnSmoke(centerX, baseY, 2);
    setTimeout(ambientSmoke, 3500 + Math.random() * 2000);
  }
  window.addEventListener("load", () => {
    // 初始延迟启动背景烟雾
    setTimeout(ambientSmoke, 1000);
    // 欢迎语
    setTimeout(() => {
      spawnWishText("南无阿弥陀佛");
    }, 800);
  });

  // 点击遮罩区关闭弹窗
  wishModal.addEventListener("click", (e) => { if (e.target === wishModal) wishModal.classList.remove("show"); });
  talkModal.addEventListener("click", (e) => { if (e.target === talkModal) talkModal.classList.remove("show"); });

})();
