/* ========================================================
   烧烤店点餐系统 - 顾客端逻辑
   ======================================================== */

// ---------- 全局状态 ----------
let cart = []; // [{dishId, name, price, qty, remark}]
let currentCat = 'bbq';
let orderType = 'dine'; // dine | takeout

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  renderShopInfo();
  renderCategories();
  renderMenu();
  updateCartBar();
});

// ---------- 店铺信息 ----------
function renderShopInfo() {
  const s = getSettings();
  document.getElementById('shopName').textContent = '🔥 ' + s.shopName;
  const statusEl = document.getElementById('shopStatus');
  if (s.open) {
    statusEl.textContent = '营业中 · 欢迎光临';
    statusEl.style.color = '';
  } else {
    statusEl.textContent = '⚠️ 暂停营业中';
    statusEl.style.color = '#ff9800';
  }
}

// ---------- 分类渲染 ----------
function renderCategories() {
  const tabs = document.getElementById('catTabs');
  tabs.innerHTML = CATEGORIES.map(cat => `
    <div class="cat-tab ${cat.id === currentCat ? 'active' : ''}" onclick="switchCat('${cat.id}')">
      <span class="emoji">${cat.emoji}</span>${cat.name}
    </div>
  `).join('');
}

function switchCat(catId) {
  currentCat = catId;
  renderCategories();
  renderMenu();
}

// ---------- 菜单渲染 ----------
function renderMenu() {
  const dishes = getDishes().filter(d => d.available !== false);
  const filtered = dishes.filter(d => d.category === currentCat);

  const sectionTitle = CATEGORIES.find(c => c.id === currentCat)?.name || '';

  document.getElementById('menuList').innerHTML = `
    <div class="menu-section-title">${CATEGORIES.find(c => c.id === currentCat)?.emoji} ${sectionTitle}</div>
    ${filtered.length === 0 ? '<div style="text-align:center;padding:40px;color:#999">暂无菜品</div>' : ''}
    ${filtered.map(d => `
      <div class="menu-item">
        <div class="icon">${d.icon || '🍽️'}</div>
        <div class="info">
          <div class="name">${d.name}</div>
          <div class="desc">${d.desc || ''}</div>
          <div class="price">${formatPrice(d.price)}</div>
        </div>
        <button class="add-btn" onclick="addToCart(${d.id})">+</button>
      </div>
    `).join('')}
  `;
}

// ---------- 购物车操作 ----------
function addToCart(dishId) {
  const dish = getDishes().find(d => d.id === dishId);
  if (!dish) return;
  const existing = cart.find(c => c.dishId === dishId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ dishId, name: dish.name, price: dish.price, qty: 1, remark: '' });
  }
  updateCartBar();
  showToast('已加入购物车 🛒');
}

function updateCartBar() {
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const bar = document.getElementById('cartBar');

  if (totalQty > 0) {
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }

  document.getElementById('cartBadge').textContent = totalQty;
  document.getElementById('cartTotal').textContent = formatPrice(totalPrice);
}

// ---------- 购物车弹窗 ----------
function openCart() {
  if (cart.length === 0) { showToast('购物车是空的'); return; }
  renderCartItems();
  document.getElementById('cartModal').classList.add('show');
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div style="flex:1">
        <div class="ci-name">${item.name}</div>
        ${item.remark ? `<div class="ci-remark">📝 ${item.remark}</div>` : `<div class="ci-remark" onclick="addCartRemark(${idx})">+ 添加备注</div>`}
        ${item._editingRemark ? `<input class="ci-remark-input" id="remarkInput${idx}" placeholder="如：不要辣、多孜然..." value="${item.remark||''}" onblur="saveCartRemark(${idx}, this.value)">` : ''}
      </div>
      <div class="ci-price">${formatPrice(item.price * item.qty)}</div>
      <div class="ci-qty">
        <button onclick="changeQty(${idx}, -1)">−</button>
        <span class="num">${item.qty}</span>
        <button onclick="changeQty(${idx}, 1)">+</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('cartModalTotal').textContent = formatPrice(total);
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCartItems();
  updateCartBar();
}

function addCartRemark(idx) {
  cart[idx]._editingRemark = true;
  renderCartItems();
  setTimeout(() => document.getElementById('remarkInput' + idx)?.focus(), 50);
}

function saveCartRemark(idx, val) {
  if (cart[idx]) {
    cart[idx].remark = val.trim();
    cart[idx]._editingRemark = false;
    renderCartItems();
  }
}

// ---------- 结算 ----------
function goCheckout() {
  if (cart.length === 0) return;
  closeModal('cartModal');

  // 渲染订单摘要
  const itemsHtml = cart.map(c => `
    <div style="display:flex; justify-content:space-between">
      <span>${c.name} × ${c.qty}</span>
      <span>${formatPrice(c.price * c.qty)}</span>
    </div>
  `).join('');
  document.getElementById('checkoutItems').innerHTML = itemsHtml;

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('checkoutTotal').textContent = formatPrice(total);

  document.getElementById('checkoutModal').classList.add('show');
}

function setOrderType(type) {
  orderType = type;
  document.getElementById('otDine').className = 'ot-btn' + (type === 'dine' ? ' active' : '');
  document.getElementById('otTake').className = 'ot-btn' + (type === 'takeout' ? ' active' : '');
  document.getElementById('fgTable').style.display = type === 'dine' ? '' : 'none';
  document.getElementById('fgAddress').style.display = type === 'takeout' ? '' : 'none';
}

// ---------- 提交订单 ----------
function submitOrder() {
  // 校验
  const phone = document.getElementById('inpPhone').value.trim();
  if (!phone) { showToast('请输入联系电话'); return; }

  let table = '', address = '';
  if (orderType === 'dine') {
    table = document.getElementById('inpTable').value.trim();
    if (!table) { showToast('请输入桌号'); return; }
  } else {
    address = document.getElementById('inpAddress').value.trim();
    if (!address) { showToast('请输入外卖地址'); return; }
  }

  const remark = document.getElementById('inpOrderRemark').value.trim();
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const order = {
    type: orderType,
    table,
    address,
    phone,
    remark,
    items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, remark: c.remark })),
    total,
    payMethod: 'offline_transfer'
  };

  const saved = addOrder(order);

  // 展示付款页面
  document.getElementById('payAmount').textContent = formatPrice(total);
  document.getElementById('payOrderNo').textContent = saved.id;
  renderPayCodes();
  closeModal('checkoutModal');
  document.getElementById('payModal').classList.add('show');
}

function renderPayCodes() {
  const codes = getPayCodes();
  const container = document.getElementById('payCodes');
  let html = '';

  if (codes.wechat) {
    html += `
      <div class="pay-code-box">
        <div class="pc-label">💚 微信收款码</div>
        <img class="pc-img" src="${codes.wechat}" alt="微信收款码">
      </div>`;
  }
  if (codes.alipay) {
    html += `
      <div class="pay-code-box">
        <div class="pc-label">🔵 支付宝收款码</div>
        <img class="pc-img" src="${codes.alipay}" alt="支付宝收款码">
      </div>`;
  }
  if (!codes.wechat && !codes.alipay) {
    html = '<div style="color:#999;font-size:13px;padding:20px">商家暂未设置收款码，请直接联系商家付款</div>';
  }

  container.innerHTML = html;
}

// ---------- 完成下单 ----------
function finishOrder() {
  const orderId = document.getElementById('payOrderNo').textContent;
  closeModal('payModal');

  document.getElementById('successOrderNo').textContent = orderId;
  document.getElementById('successModal').classList.add('show');

  // 重置
  cart = [];
  updateCartBar();
  document.getElementById('inpPhone').value = '';
  document.getElementById('inpTable').value = '';
  document.getElementById('inpAddress').value = '';
  document.getElementById('inpOrderRemark').value = '';
}

// ---------- 弹窗控制 ----------
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
}

// ---------- Toast ----------
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ---------- 监听广播（多标签页同步） ----------
onBroadcast((msg) => {
  if (msg.type === 'dishes-updated') renderMenu();
  if (msg.type === 'settings-updated') renderShopInfo();
});
