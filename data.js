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
// 店铺基础信息
const SHOP_CONFIG = {
  name: '夜巷烧烤', // 
  desc: '新鲜现烤·随点随做',
  phone: '',
  address: ''
};

// 默认菜品（已按你的菜单整理，分类完全匹配）
const DEFAULT_DISHES = [
  // ===== 烧烤类 =====
  { id: 1, name: '锡纸猪脑', price: 25, category: '烧烤类', description: '软嫩鲜香', icon: '🍢', available: true },
  { id: 2, name: '东北风干油边', price: 9, category: '烧烤类', description: '越嚼越香', icon: '🍢', available: true },
  { id: 3, name: '锡纸鸭血', price: 15, category: '烧烤类', description: '麻辣入味', icon: '🍢', available: true },
  { id: 4, name: '东北原味油边', price: 8, category: '烧烤类', description: '原香十足', icon: '🍢', available: true },
  { id: 5, name: '生蚝（烤/清蒸）', price: '时价', category: '烧烤类', description: '新鲜当日到店', icon: '🦪', available: true },
  { id: 6, name: '清蒸大闸蟹', price: '时价', category: '烧烤类', description: '肥满流黄', icon: '🦀', available: true },
  { id: 7, name: '五花肉', price: 4, category: '烧烤类', description: '焦香不腻', icon: '🍢', available: true },
  { id: 8, name: '五花肉酸菜卷', price: 5, category: '烧烤类', description: '解腻爽口', icon: '🍢', available: true },
  { id: 9, name: '牛肉', price: 5, category: '烧烤类', description: '嫩而不柴', icon: '🍢', available: true },
  { id: 10, name: '五花趾', price: 6, category: '烧烤类', description: '脆弹有嚼劲', icon: '🍢', available: true },
  { id: 11, name: '牛雁翅', price: 6, category: '烧烤类', description: '筋道入味', icon: '🍢', available: true },
  { id: 12, name: '牛肋条', price: 6, category: '烧烤类', description: '肉香浓郁', icon: '🍢', available: true },
  { id: 13, name: '牛肉香菜卷', price: 6, category: '烧烤类', description: '经典搭配', icon: '🍢', available: true },
  { id: 14, name: '牛胸油', price: 6, category: '烧烤类', description: '爆汁奶香', icon: '🍢', available: true },
  { id: 15, name: '羊肉', price: 8, category: '烧烤类', description: '无膻味·现切', icon: '🍢', available: true },
  { id: 16, name: '羊腰', price: 15, category: '烧烤类', description: '滋补烤制', icon: '🍢', available: true },
  { id: 17, name: '鸡脆骨', price: 5, category: '烧烤类', description: '嘎嘣脆', icon: '🍢', available: true },
  { id: 18, name: '鸡中翅', price: 8, category: '烧烤类', description: '蜜汁/香辣可选', icon: '🍗', available: true },
  { id: 19, name: '鸡翅', price: 8, category: '烧烤类', description: '鲜嫩多汁', icon: '🍗', available: true },
  { id: 20, name: '鸡爪', price: 8, category: '烧烤类', description: '脱骨/留骨可选', icon: '🦶', available: true },
  { id: 21, name: '鸡腿', price: 8, category: '烧烤类', description: '大个入味', icon: '🍗', available: true },
  { id: 22, name: '藤椒鸡腿肉', price: 7, category: '烧烤类', description: '麻香过瘾', icon: '🍗', available: true },
  { id: 23, name: '鸭肾', price: 4, category: '烧烤类', description: '脆爽耐嚼', icon: '🍢', available: true },
  { id: 24, name: '猪鞭', price: 6, category: '烧烤类', description: '特色烤品', icon: '🍢', available: true },
  { id: 25, name: '猪肠', price: 5, category: '烧烤类', description: '洗得干净', icon: '🍢', available: true },
  { id: 26, name: '热狗', price: 3, category: '烧烤类', description: '脆皮爆浆', icon: '🌭', available: true },
  { id: 27, name: '蚂蚱', price: 5, category: '烧烤类', description: '高蛋白香酥', icon: '🦗', available: true },
  { id: 28, name: '虾', price: 8, category: '烧烤类', description: '鲜虾开背', icon: '🍤', available: true },
  { id: 29, name: '秋刀鱼', price: 10, category: '烧烤类', description: '挤柠檬更鲜', icon: '🐟', available: true },
  { id: 30, name: '多春鱼', price: 5, category: '烧烤类', description: '满籽爆浆', icon: '🐟', available: true },
  { id: 31, name: '鱿鱼抱虾滑', price: 10, category: '烧烤类', description: '双重鲜味', icon: '🦑', available: true },
  { id: 32, name: '虾滑豆腐泡', price: 6, category: '烧烤类', description: '吸满汤汁', icon: '🍢', available: true },
  { id: 33, name: '骨肉相连', price: 4, category: '烧烤类', description: '经典款', icon: '🍢', available: true },
  { id: 34, name: '鸡柳', price: 4, category: '烧烤类', description: '外酥里嫩', icon: '🍢', available: true },
  { id: 35, name: '豆干', price: 3, category: '烧烤类', description: '卤香入味', icon: '🍢', available: true },
  { id: 36, name: '蒜蓉豆腐皮', price: 4, category: '烧烤类', description: '蒜香浓郁', icon: '🍢', available: true },
  { id: 37, name: '韭菜', price: 3, category: '烧烤类', description: '必点素菜', icon: '🥬', available: true },
  { id: 38, name: '西葫芦', price: 3, category: '烧烤类', description: '清爽解腻', icon: '🥒', available: true },
  { id: 39, name: '玉米', price: 8, category: '烧烤类', description: '甜玉米刷蜜', icon: '🌽', available: true },
  { id: 40, name: '茄子', price: 10, category: '烧烤类', description: '蒜蓉/肉末可选', icon: '🍆', available: true },
  { id: 41, name: '菠萝', price: 5, category: '烧烤类', description: '酸甜开胃', icon: '🍍', available: true },

  // ===== 小吃类 =====
  { id: 42, name: '凉拌青瓜', price: 10, category: '小吃类', description: '拍黄瓜·爽口', icon: '🥒', available: true },
  { id: 43, name: '凉拌莲藕', price: 10, category: '小吃类', description: '脆甜入味', icon: '🥗', available: true },
  { id: 44, name: '香辣毛豆', price: 13, category: '小吃类', description: '下酒神器', icon: '🥜', available: true },
  { id: 45, name: '泡椒藕尖', price: 10, category: '小吃类', description: '酸辣脆爽', icon: '🌶️', available: true },
  { id: 46, name: '芥末青瓜', price: 10, category: '小吃类', description: '冲鼻过瘾', icon: '🥒', available: true },
  { id: 47, name: '芥末秋葵', price: 10, category: '小吃类', description: '黏滑鲜爽', icon: '🥬', available: true },
  { id: 48, name: '芥末豆腐皮', price: 10, category: '小吃类', description: '芥末爱好者专属', icon: '🥗', available: true },
  { id: 49, name: '手撕鱿鱼', price: 38, category: '小吃类', description: '干香有嚼劲', icon: '🦑', available: true },
  { id: 50, name: '蒜片热狗', price: 15, category: '小吃类', description: '厚切蒜香', icon: '🌭', available: true },
  { id: 51, name: '炸饺子', price: 18, category: '小吃类', description: '金黄酥脆', icon: '🥟', available: true },
  { id: 52, name: '炸薯条', price: 13, category: '小吃类', description: '粗薯·配番茄酱', icon: '🍟', available: true },
  { id: 53, name: '炸南口豆干', price: 12, category: '小吃类', description: '豆香浓郁', icon: '🧈', available: true },
  { id: 54, name: '椒盐扇子骨', price: 38, category: '小吃类', description: '啃着香', icon: '🍖', available: true },

  // ===== 酒水类 =====
  { id: 55, name: '青岛啤酒', price: 7, category: '酒水类', description: '冰爽经典', icon: '🍺', available: true },
  { id: 56, name: '珠江黑金纯生', price: 8, category: '酒水类', description: '纯生口感', icon: '🍺', available: true },
  { id: 57, name: '百事可乐', price: 3, category: '酒水类', description: '冰镇', icon: '🥤', available: true },
  { id: 58, name: '七喜', price: 3, category: '酒水类', description: '柠檬味', icon: '🥤', available: true },
  { id: 59, name: '王老吉', price: 5, category: '酒水类', description: '凉茶降火', icon: '🥫', available: true },
  { id: 60, name: '椰汁', price: 6, category: '酒水类', description: '生榨椰香', icon: '🥥', available: true },
  { id: 61, name: '矿泉水', price: 2, category: '酒水类', description: '常温/冰', icon: '💧', available: true }
];

// 初始化
initDB();
