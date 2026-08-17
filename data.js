/* ========================================================
   烧烤店点餐系统 - 共享数据层
   - 使用 LocalStorage 持久化
   - 使用 BroadcastChannel 实现跨标签页实时通信
   ======================================================== */

const DB_KEYS = {
  dishes: 'bbq_dishes',
  orders: 'bbq_orders',
  payCodes: 'bbq_pay_codes',
  settings: 'bbq_settings',
  orderSeq: 'bbq_order_seq'
};

// ---------- 默认菜品 ----------
const DEFAULT_DISHES = [
  // 烧烤类
  { id: 1, name: '烤羊肉串', price: 5, category: 'bbq', desc: '新疆风味·鲜嫩多汁', icon: '🍢', available: true },
  { id: 2, name: '烤牛肉串', price: 6, category: 'bbq', desc: '精选牛肉·炭火烤制', icon: '🥩', available: true },
  { id: 3, name: '烤鸡翅', price: 8, category: 'bbq', desc: '外焦里嫩·蜜汁口味', icon: '🍗', available: true },
  { id: 4, name: '烤生蚝', price: 12, category: 'bbq', desc: '蒜蓉粉丝·鲜香肥美', icon: '🦪', available: true },
  { id: 5, name: '烤茄子', price: 10, category: 'bbq', desc: '蒜蓉秘制·软糯入味', icon: '🍆', available: true },
  { id: 6, name: '烤韭菜', price: 4, category: 'bbq', desc: '炭火焦香·下酒神器', icon: '🥬', available: true },
  { id: 7, name: '烤金针菇', price: 5, category: 'bbq', desc: '酱香浓郁·爽滑可口', icon: '🍄', available: true },
  { id: 8, name: '烤玉米', price: 6, category: 'bbq', desc: '香甜焦脆·刷酱烤制', icon: '🌽', available: true },
  { id: 9, name: '烤土豆片', price: 4, category: 'bbq', desc: '薄脆焦香·撒料十足', icon: '🥔', available: true },
  { id: 10, name: '烤鱿鱼', price: 10, category: 'bbq', desc: '铁板风味·Q弹鲜香', icon: '🦑', available: true },
  { id: 11, name: '烤鸡心', price: 4, category: 'bbq', desc: '脆嫩爽口·烧烤经典', icon: '❤️', available: true },
  { id: 12, name: '烤馒头片', price: 3, category: 'bbq', desc: '金黄酥脆·刷黄油烤', icon: '🍞', available: true },
  // 小吃类
  { id: 13, name: '炸花生米', price: 8, category: 'snack', desc: '酥脆下酒·经典小菜', icon: '🥜', available: true },
  { id: 14, name: '凉拌黄瓜', price: 10, category: 'snack', desc: '爽脆开胃·蒜泥香醋', icon: '🥒', available: true },
  { id: 15, name: '拍黄瓜', price: 10, category: 'snack', desc: '蒜香辣油·清凉解腻', icon: '🥒', available: true },
  { id: 16, name: '卤毛豆', price: 12, category: 'snack', desc: '五香卤制·夏日必备', icon: '🫘', available: true },
  { id: 17, name: '炸薯条', price: 15, category: 'snack', desc: '金黄酥脆·番茄酱配', icon: '🍟', available: true },
  { id: 18, name: '凉拌木耳', price: 12, category: 'snack', desc: '脆嫩爽口·酸辣开胃', icon: '🍄', available: true },
  // 酒水类
  { id: 19, name: '雪花啤酒', price: 6, category: 'drink', desc: '冰镇清爽·烧烤绝配', icon: '🍺', available: true },
  { id: 20, name: '青岛啤酒', price: 8, category: 'drink', desc: '经典原浆·麦香浓郁', icon: '🍺', available: true },
  { id: 21, name: '可乐', price: 5, category: 'drink', desc: '冰镇可口·畅爽解腻', icon: '🥤', available: true },
  { id: 22, name: '雪碧', price: 5, category: 'drink', desc: '柠檬清爽·气泡十足', icon: '🥤', available: true },
  { id: 23, name: '王老吉', price: 6, category: 'drink', desc: '凉茶清热·怕上火喝', icon: '🧃', available: true },
  { id: 24, name: '矿泉水', price: 3, category: 'drink', desc: '纯净水·解渴必备', icon: '💧', available: true },
  { id: 25, name: '白酒（二锅头）', price: 15, category: 'drink', desc: '56度·老北京风味', icon: '🍶', available: true },
  { id: 26, name: '江小白', price: 20, category: 'drink', desc: '青春小酒·高粱酒', icon: '🍶', available: true },
];

const CATEGORIES = [
  { id: 'bbq', name: '烧烤类', emoji: '🔥' },
  { id: 'snack', name: '小吃类', emoji: '🍟' },
  { id: 'drink', name: '酒水类', emoji: '🥤' },
];

// ---------- 初始化 ----------
function initDB() {
  if (!localStorage.getItem(DB_KEYS.dishes)) {
    localStorage.setItem(DB_KEYS.dishes, JSON.stringify(DEFAULT_DISHES));
  }
  if (!localStorage.getItem(DB_KEYS.orders)) {
    localStorage.setItem(DB_KEYS.orders, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.payCodes)) {
    localStorage.setItem(DB_KEYS.payCodes, JSON.stringify({ wechat: '', alipay: '' }));
  }
  if (!localStorage.getItem(DB_KEYS.settings)) {
    localStorage.setItem(DB_KEYS.settings, JSON.stringify({ shopName: '老王烧烤店', open: true }));
  }
  if (!localStorage.getItem(DB_KEYS.orderSeq)) {
    localStorage.setItem(DB_KEYS.orderSeq, '0');
  }
}

// ---------- 菜品 CRUD ----------
function getDishes() {
  return JSON.parse(localStorage.getItem(DB_KEYS.dishes) || '[]');
}
function saveDish(dish) {
  const dishes = getDishes();
  if (dish.id) {
    const idx = dishes.findIndex(d => d.id === dish.id);
    if (idx >= 0) dishes[idx] = { ...dishes[idx], ...dish };
  } else {
    dish.id = Date.now();
    dishes.push(dish);
  }
  localStorage.setItem(DB_KEYS.dishes, JSON.stringify(dishes));
  broadcast('dishes-updated');
}
function deleteDish(id) {
  const dishes = getDishes().filter(d => d.id !== id);
  localStorage.setItem(DB_KEYS.dishes, JSON.stringify(dishes));
  broadcast('dishes-updated');
}

// ---------- 订单 ----------
function getOrders() {
  return JSON.parse(localStorage.getItem(DB_KEYS.orders) || '[]');
}
function addOrder(order) {
  const orders = getOrders();
  let seq = parseInt(localStorage.getItem(DB_KEYS.orderSeq) || '0') + 1;
  localStorage.setItem(DB_KEYS.orderSeq, String(seq));
  order.id = 'BBQ' + String(seq).padStart(4, '0');
  order.time = new Date().toLocaleString('zh-CN', { hour12: false });
  order.status = 'new'; // new | confirmed | completed
  orders.unshift(order);
  localStorage.setItem(DB_KEYS.orders, JSON.stringify(orders));
  broadcast('order-new', order);
  return order;
}
function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const o = orders.find(o => o.id === orderId);
  if (o) o.status = status;
  localStorage.setItem(DB_KEYS.orders, JSON.stringify(orders));
  broadcast('order-updated');
}
function deleteOrder(orderId) {
  const orders = getOrders().filter(o => o.id !== orderId);
  localStorage.setItem(DB_KEYS.orders, JSON.stringify(orders));
  broadcast('order-updated');
}

// ---------- 收款码 ----------
function getPayCodes() {
  return JSON.parse(localStorage.getItem(DB_KEYS.payCodes) || '{"wechat":"","alipay":""}');
}
function savePayCodes(codes) {
  localStorage.setItem(DB_KEYS.payCodes, JSON.stringify(codes));
  broadcast('paycodes-updated');
}

// ---------- 设置 ----------
function getSettings() {
  return JSON.parse(localStorage.getItem(DB_KEYS.settings) || '{"shopName":"烧烤店","open":true}');
}
function saveSettings(s) {
  localStorage.setItem(DB_KEYS.settings, JSON.stringify(s));
  broadcast('settings-updated');
}

// ---------- 跨标签页通信 ----------
let channel = null;
function broadcast(type, data) {
  try {
    if (!channel) channel = new BroadcastChannel('bbq_channel');
    channel.postMessage({ type, data });
  } catch (e) {}
}
function onBroadcast(handler) {
  try {
    if (!channel) channel = new BroadcastChannel('bbq_channel');
    channel.onmessage = (e) => handler(e.data);
  } catch (e) {}
}

// ---------- 通知声音 ----------
function playNotifySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // 播放三段提示音
    [0, 200, 400].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay / 1000 + 0.15);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.2);
    });
  } catch (e) {
    // fallback: 使用 audio 元素
  }
}

// ---------- 工具 ----------
function formatPrice(p) { return '¥' + parseFloat(p).toFixed(0); }
function uid() { return Date.now() + Math.random().toString(36).substr(2, 5); }

// 初始化
initDB();
