/* ========================================================
   烧烤店点餐系统 - 商家后台逻辑
   ======================================================== */

let currentFilter = 'all';
let editingDishId = null;

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  renderOrders();
  renderDishes();
  renderPayCodes();
  renderSettings();
  renderStats();

  // 监听新订单
  onBroadcast((msg) => {
    if (msg.type === 'order-new') {
      handleNewOrder(msg.data);
    }
    if (msg.type === 'order-updated') {
      renderOrders();
      renderStats();
    }
    if (msg.type === 'dishes-updated') renderDishes();
    if (msg.type === 'paycodes-updated') renderPayCodes();
    if (msg.type === 'settings-updated') renderSettings();
  });
});

// ---------- 新订单处理 ----------
function handleNewOrder(order) {
  // 播放声音
  playNotifySound();
  // 弹窗提醒
  const body = document.getElementById('notifyBody');
  const itemsSummary = order.items.slice(0, 3).map(i => `${i.name}×${i.qty}`).join('、');
  const more = order.items.length > 3 ? ` 等${order.items.length}项` : '';
  const typeStr = order.type === 'dine' ? `🍽️ 堂食-${order.table}` : '🛵 外卖';
  body.innerHTML = `
    <div style="margin-bottom:4px"><b>${order.id}</b> · ${typeStr}</div>
    <div>${itemsSummary}${more}</div>
    <div style="margin-top:4px">合计：${formatPrice(order.total)}</div>
  `;
  const popup = document.getElementById('notifyPopup');
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 6000);

  // 刷新列表
  renderOrders();
  renderStats();

  // 请求通知权限并发送桌面通知
  if (Notification.permission === 'granted') {
    new Notification('🔔 新订单！', { body: `${order.id} - ${formatPrice(order.total)}`, icon: '🍢' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

// ---------- 订单渲染 ----------
function renderOrders() {
  const orders = getOrders();
  const filtered = currentFilter === 'all' ? orders : orders.filter(o => o.status === currentFilter);

  const container = document.getElementById('ordersList');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">📭</div>
        <div>暂无订单</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(o => {
    const typeClass = o.type === 'dine' ? 'dine-in' : 'takeout';
    const typeText = o.type === 'dine' ? `🍽️ 堂食 · ${o.table}` : '🛵 外卖';
    const statusText = { new: '🆕 新订单', confirmed: '👨‍🍳 制作中', completed: '✅ 已完成' }[o.status];
    const itemsHtml = o.items.map(i => `
      <div class="item-line"><span>${i.name} × ${i.qty}${i.remark ? ` <small style="color:#B45309">(📝${i.remark})</small>` : ''}</span><span>${formatPrice(i.price * i.qty)}</span></div>
    `).join('');

    let actions = '';
    if (o.status === 'new') {
      actions = `<button class="btn-confirm" onclick="setOrderStatus('${o.id}','confirmed')">✅ 确认接单</button>
                 <button class="btn-delete" onclick="delOrder('${o.id}')">🗑️ 删除</button>`;
    } else if (o.status === 'confirmed') {
      actions = `<button class="btn-complete" onclick="setOrderStatus('${o.id}','completed')">🎉 完成订单</button>
                 <button class="btn-delete" onclick="delOrder('${o.id}')">🗑️ 删除</button>`;
    } else {
      actions = `<button class="btn-delete" onclick="delOrder('${o.id}')">🗑️ 删除</button>`;
    }

    return `
    <div class="order-card ${o.status === 'new' ? 'new-order' : ''}">
      <div class="oc-header">
        <span class="oc-no">${o.id}</span>
        <span class="oc-time">${o.time}</span>
      </div>
      <div class="oc-type ${typeClass}">${typeText} · ${statusText}</div>
      <div class="oc-items">${itemsHtml}</div>
      ${o.address ? `<div class="oc-customer">📍 ${o.address}</div>` : ''}
      <div class="oc-customer">📱 ${o.phone}${o.remark ? ` · 💬 ${o.remark}` : ''}</div>
      <div class="oc-total">合计：${formatPrice(o.total)}</div>
      <div class="oc-actions">${actions}</div>
    </div>`;
  }).join('');
}

function setOrderStatus(id, status) {
  updateOrderStatus(id, status);
  showToast(status === 'confirmed' ? '已确认接单' : '订单已完成');
}

function delOrder(id) {
  if (confirm('确定删除此订单？')) {
    deleteOrder(id);
    showToast('订单已删除');
  }
}

// ---------- 订单筛选 ----------
function filterOrders(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.order-filter button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOrders();
}

// ---------- 统计 ----------
function renderStats() {
  const orders = getOrders();
  const today = new Date().toLocaleDateString('zh-CN');
  const todayOrders = orders.filter(o => o.time.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== 'completed').length;

  document.getElementById('statCards').innerHTML = `
    <div class="stat-card"><div class="sc-num">${orders.length}</div><div class="sc-label">总订单</div></div>
    <div class="stat-card"><div class="sc-num">${todayOrders.length}</div><div class="sc-label">今日订单</div></div>
    <div class="stat-card"><div class="sc-num">${formatPrice(todayRevenue)}</div><div class="sc-label">今日营业额</div></div>
  `;
}

// ---------- 菜品管理 ----------
function renderDishes() {
  const dishes = getDishes();
  const container = document.getElementById('dishList');

  if (dishes.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#999">暂无菜品，请添加</div>';
    return;
  }

  container.innerHTML = dishes.map(d => {
    const catName = CATEGORIES.find(c => c.id === d.category)?.name || d.category;
    return `
    <div class="dish-manage-item">
      <div class="dm-icon">${d.icon || '🍽️'}</div>
      <div class="dm-info">
        <div class="dm-name">${d.name} ${d.available === false ? '<span style="color:#999;font-size:11px">(已下架)</span>' : ''}</div>
        <div class="dm-price">${formatPrice(d.price)} · <span class="dm-cat">${catName}</span></div>
      </div>
      <div class="dm-actions">
        <button class="btn-edit" onclick="editDish(${d.id})">✏️ 编辑</button>
        <button class="btn-del" onclick="removeDish(${d.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function saveDishForm() {
  const name = document.getElementById('dfName').value.trim();
  const price = parseFloat(document.getElementById('dfPrice').value);
  const cat = document.getElementById('dfCat').value;
  const icon = document.getElementById('dfIcon').value.trim() || '🍽️';
  const desc = document.getElementById('dfDesc').value.trim();

  if (!name) { showToast('请输入菜品名称'); return; }
  if (!price || price <= 0) { showToast('请输入有效价格'); return; }

  saveDish({
    id: editingDishId,
    name, price, category: cat, icon, desc,
    available: true
  });

  showToast(editingDishId ? '菜品已更新' : '菜品已添加');
  resetDishForm();
}

function editDish(id) {
  const dish = getDishes().find(d => d.id === id);
  if (!dish) return;
  editingDishId = id;
  document.getElementById('dfName').value = dish.name;
  document.getElementById('dfPrice').value = dish.price;
  document.getElementById('dfCat').value = dish.category;
  document.getElementById('dfIcon').value = dish.icon || '🍢';
  document.getElementById('dfDesc').value = dish.desc || '';
  document.querySelector('.dish-form button.btn-primary').textContent = '💾 更新菜品';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function removeDish(id) {
  if (confirm('确定删除此菜品？')) {
    deleteDish(id);
    showToast('菜品已删除');
  }
}

function resetDishForm() {
  editingDishId = null;
  document.getElementById('dfName').value = '';
  document.getElementById('dfPrice').value = '';
  document.getElementById('dfCat').value = 'bbq';
  document.getElementById('dfIcon').value = '🍢';
  document.getElementById('dfDesc').value = '';
  document.querySelector('.dish-form button.btn-primary').textContent = '💾 保存菜品';
}

// ---------- 收款码 ----------
function renderPayCodes() {
  const codes = getPayCodes();
  const wcIcon = document.getElementById('wechatIcon');
  const wcText = document.getElementById('wechatText');
  const alIcon = document.getElementById('alipayIcon');
  const alText = document.getElementById('alipayText');

  if (codes.wechat) {
    wcIcon.innerHTML = `<img src="${codes.wechat}" style="width:60px;height:60px;border-radius:6px;object-fit:contain">`;
    wcText.textContent = '✅ 已上传 · 点击更换';
  } else {
    wcIcon.textContent = '📷';
    wcText.textContent = '点击上传微信收款码';
  }
  if (codes.alipay) {
    alIcon.innerHTML = `<img src="${codes.alipay}" style="width:60px;height:60px;border-radius:6px;object-fit:contain">`;
    alText.textContent = '✅ 已上传 · 点击更换';
  } else {
    alIcon.textContent = '📷';
    alText.textContent = '点击上传支付宝收款码';
  }
}

function uploadPayCode(type) {
  document.getElementById(type + 'File').click();
}

function handlePayCodeUpload(type, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const codes = getPayCodes();
    codes[type] = e.target.result;
    savePayCodes(codes);
    showToast(type === 'wechat' ? '微信收款码已更新' : '支付宝收款码已更新');
  };
  reader.readAsDataURL(file);
}

// ---------- 店铺设置 ----------
function renderSettings() {
  const s = getSettings();
  document.getElementById('setName').value = s.shopName || '';
  const sw = document.getElementById('setOpen');
  sw.classList.toggle('on', s.open !== false);
}

function toggleOpen(el) {
  el.classList.toggle('on');
}

function saveSettingsForm() {
  const name = document.getElementById('setName').value.trim() || '烧烤店';
  const open = document.getElementById('setOpen').classList.contains('on');
  saveSettings({ shopName: name, open });
  showToast('设置已保存');
}

// ---------- 数据统计初始化 ----------
// 已在 DOMContentLoaded 中调用 renderStats

// ---------- 危险操作 ----------
function clearAllOrders() {
  if (confirm('⚠️ 确定清空所有订单？此操作不可恢复！')) {
    localStorage.setItem(DB_KEYS.orders, JSON.stringify([]));
    renderOrders();
    renderStats();
    showToast('所有订单已清空');
    broadcast('order-updated');
  }
}

function resetAllData() {
  if (confirm('⚠️ 确定恢复默认菜品？当前菜品修改将丢失！')) {
    localStorage.setItem(DB_KEYS.dishes, JSON.stringify(DEFAULT_DISHES));
    renderDishes();
    showToast('已恢复默认菜品');
    broadcast('dishes-updated');
  }
}

// ---------- 标签切换 ----------
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');

  if (tab === 'orders') { renderOrders(); renderStats(); }
  if (tab === 'dishes') renderDishes();
}

// ---------- Toast ----------
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ---------- 测试通知 ----------
function testNotify() {
  handleNewOrder({
    id: 'BBQ0000',
    type: 'dine',
    table: '测试桌',
    items: [{ name: '烤羊肉串', qty: 2, price: 5 }, { name: '雪花啤酒', qty: 1, price: 6 }],
    total: 16,
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  });
}

// 请求通知权限
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
