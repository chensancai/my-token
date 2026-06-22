// Node.js script to validate HTML
const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');

// 1. Check all onclick calls
const onclickMatches = [...content.matchAll(/onclick="([^"]+)"/g)];
const calls = new Set();
onclickMatches.forEach(m => {
  const call = m[1];
  const funcMatch = call.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  if (funcMatch) calls.add(funcMatch[1]);
});

console.log('onclick 调用的函数:', [...calls].sort());
console.log('共', onclickMatches.length, '个 onclick\n');

// 2. Check script-defined functions
const scriptMatches = [...content.matchAll(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)];
const defined = new Set(scriptMatches.map(m => m[1]));
console.log('内联脚本定义的函数:', [...defined].sort());
console.log('共', scriptMatches.length, '个函数\n');

// 3. Find missing
const missing = [...calls].filter(f => !defined.has(f));
console.log('缺失的函数:', missing);
console.log();

// 4. Key features check
const checkList = {
  'showSimpleOfferingModal': '贡品图标点击',
  'openChat': '问佛按钮',
  'showOfferingModal': '请佛按钮',
  'doPrayer': '跪拜垫',
  'bathingBuddha': '佛像点击',
  'sendWish': '许愿发送',
  'openModal': '弹窗显示',
  'closeModal': '弹窗关闭',
  'toggleSound': '音效开关',
  'makeWish': '合十许愿',
  'showOrderModal': '订单滚动',
  'closeDialog': '关闭对话',
  'sendDialogMessage': '对话发送',
  'toggleVoice': '语音',
  'goToProfile': '用户跳转'
};

console.log('=== 核心功能检查 ===');
for (const [func, desc] of Object.entries(checkList)) {
  const present = defined.has(func);
  console.log(present ? '✓' : '✗', desc, '[' + func + ']', present ? 'OK' : 'MISSING');
}

// 5. HTML structure check
console.log('\n=== HTML 结构检查 ===');
const checks = [
  ['.dialog-modal-mask.show', '问佛弹窗显示样式'],
  ['.modal-overlay.show', '通用弹窗显示样式'],
  ['id="leftVase"', '花瓶（左）'],
  ['id="rightVase"', '花瓶（右）'],
  ['id="incenseBurner"', '香炉'],
  ['id="fruitPlate"', '果盘'],
  ['id="dessertPlate"', '点心'],
  ['id="teacup"', '茶杯'],
  ['id="askBuddhaBtn"', '问佛按钮'],
  ['id="buddhaStatue"', '佛像'],
  ['id="prayerMat"', '跪拜垫'],
  ['id="dialogModal"', '问佛对话弹窗'],
  ['id="simpleOfferingModal"', '简单供奉弹窗'],
  ['id="offeringModal"', '请佛供奉弹窗']
];
checks.forEach(([needle, desc]) => {
  const found = content.includes(needle);
  console.log(found ? '✓' : '✗', desc, '[' + needle + ']', found ? 'OK' : 'MISSING');
});

// 6. main.js check
const hasMainJs = /<script[^>]*main\.js/.test(content);
console.log('\n=== 干扰检查 ===');
console.log(hasMainJs ? '✗ main.js 仍被引用' : '✓ main.js 已移除');

// 7. Check that onclick on offering items is correct
const offeringOnclicks = [...content.matchAll(/(花瓶|莲花灯|香炉|果盘|点心|茶水)[^<]*<\/span>[^<]*<\/div>|offering-item[^>]*onclick="([^"]+)"/gi)];
console.log('\n=== 贡品 onclick 检查 ===');
const items = content.match(/<div[^>]*class="offering-item"[^>]*onclick="([^"]+)"[^>]*>/gi);
if (items) {
  items.forEach(it => {
    const m = it.match(/onclick="([^"]+)"/);
    const idm = it.match(/id="([^"]+)"/);
    console.log(' ✓', idm ? idm[1] : '?', '->', m ? m[1] : '?');
  });
}
