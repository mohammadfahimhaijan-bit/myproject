/* Lumen & Co. — store logic (vanilla JS, no dependencies).
 *
 * IMPORTANT ABOUT UPLOADED IMAGES:
 * GitHub Pages is a static host. The "Add Product" form reads the chosen image with FileReader and shows it
 * from the browser's memory only. It is NOT uploaded to GitHub and disappears when you refresh the page.
 * To keep a product permanently, copy its image into the /images folder, commit it, and add the product
 * to the PRODUCTS array below.
 */
'use strict';

const CATEGORIES = [
  { name: 'Electronics', icon: '🎧' }, { name: 'Fashion', icon: '👕' }, { name: 'Accessories', icon: '⌚' },
  { name: 'Beauty', icon: '✨' }, { name: 'Lifestyle', icon: '🕯️' }
];

// Starter catalog. `reviews` doubles as the popularity score.
const PRODUCTS = [
  { id: 1, name: 'Studio Wireless Headphones', category: 'Electronics', price: 129, rating: 4.8, reviews: 412, image: 'images/product1.jpg', description: 'Over-ear headphones with active noise cancelling and 40 hours of battery life.' },
  { id: 2, name: 'Compact Bluetooth Speaker', category: 'Electronics', price: 59, rating: 4.5, reviews: 268, image: 'images/product2.jpg', description: 'Pocket-sized speaker with deep bass, splash resistance and a 12-hour battery.' },
  { id: 3, name: 'Linen Overshirt', category: 'Fashion', price: 74, rating: 4.6, reviews: 143, image: 'images/product3.jpg', description: 'A breathable, relaxed-fit overshirt in washed European linen.' },
  { id: 4, name: 'Everyday Canvas Sneakers', category: 'Fashion', price: 68, rating: 4.4, reviews: 309, image: 'images/product4.jpg', description: 'Lightweight sneakers with a cushioned insole and recycled canvas upper.' },
  { id: 5, name: 'Minimal Steel Watch', category: 'Accessories', price: 149, rating: 4.9, reviews: 521, image: 'images/product5.jpg', description: 'A slim stainless-steel watch with sapphire glass and a soft leather strap.' },
  { id: 6, name: 'Leather Card Wallet', category: 'Accessories', price: 39, rating: 4.7, reviews: 187, image: 'images/product6.jpg', description: 'Vegetable-tanned leather wallet that holds six cards and folded notes.' },
  { id: 7, name: 'Glow Repair Face Serum', category: 'Beauty', price: 34, rating: 4.6, reviews: 356, image: 'images/product7.jpg', description: 'A lightweight serum with vitamin C and hyaluronic acid for daily glow.' },
  { id: 8, name: 'Soy Wax Candle, Cedar', category: 'Lifestyle', price: 26, rating: 4.7, reviews: 224, image: 'images/product8.jpg', description: 'Hand-poured soy candle with cedar and amber notes. Burns for 45 hours.' }
];

/* ---------- State ---------- */
const state = {
  products: PRODUCTS.map(p => ({ ...p })),
  cart: [],                 // [{ id, qty }]
  favs: new Set(),
  filter: 'All',
  query: '',
  sort: 'featured',
  detailId: null,
  detailQty: 1,
  nextId: 100,
  previewSrc: ''
};

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getProduct = id => state.products.find(p => p.id === id);
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

// Inline SVG shown when a product image file is missing, so the shop never looks broken.
function placeholder(label) {
  const icon = (CATEGORIES.find(c => c.name === label) || {}).icon || '🛍️';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe8dc"/><stop offset="1" stop-color="#8fc5ae"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="230" font-size="120" text-anchor="middle">${icon}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
// Capture-phase listener catches load errors for every image, including ones added later.
document.addEventListener('error', e => {
  const img = e.target;
  if (img.tagName !== 'IMG' || img.dataset.failed) return;
  img.dataset.failed = '1';
  img.src = placeholder(img.dataset.fallback);
}, true);

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- Layers (drawer + modals) ---------- */
let lastFocus = null;
function openLayer(el) {
  closeLayers(false);
  lastFocus = document.activeElement;
  el.hidden = false;
  if (el.id === 'cartDrawer') $('#overlay').hidden = false;
  document.body.classList.add('locked');
  const first = $('button, input, textarea', el);
  if (first) first.focus();
}
function closeLayers(restoreFocus = true) {
  $$('.modal, .drawer').forEach(el => { el.hidden = true; });
  $('#overlay').hidden = true;
  document.body.classList.remove('locked');
  if (restoreFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLayers(); });
$('#overlay').addEventListener('click', () => closeLayers());
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeLayers(); }));
document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLayers(); });

/* ---------- Categories, chips, footer ---------- */
function renderCategories() {
  $('#catGrid').innerHTML = CATEGORIES.map(c => {
    const n = state.products.filter(p => p.category === c.name).length;
    return `<button class="cat-card" data-cat="${esc(c.name)}"><span class="cat-ico" aria-hidden="true">${c.icon}</span><strong>${esc(c.name)}</strong><span>${n} product${n === 1 ? '' : 's'}</span></button>`;
  }).join('');
  $('#pCategory').innerHTML = CATEGORIES.map(c => `<option>${esc(c.name)}</option>`).join('');
  $('#footCats').innerHTML = CATEGORIES.map(c => `<a href="#products" data-cat="${esc(c.name)}">${esc(c.name)}</a>`).join('');
}
function renderChips() {
  $('#chips').innerHTML = ['All', ...CATEGORIES.map(c => c.name)]
    .map(n => `<button class="chip" data-chip="${esc(n)}" aria-pressed="${state.filter === n}">${esc(n)}</button>`).join('');
}
function goToCategory(name) {
  state.filter = name;
  renderChips();
  renderProducts();
  $('#products').scrollIntoView({ behavior: 'smooth' });
}
document.addEventListener('click', e => {
  const cat = e.target.closest('[data-cat]');
  if (cat) { e.preventDefault(); goToCategory(cat.dataset.cat); }
  const chip = e.target.closest('[data-chip]');
  if (chip) { state.filter = chip.dataset.chip; renderChips(); renderProducts(); }
});

/* ---------- Products: search, filter, sort ---------- */
function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  let list = state.products.filter(p =>
    (state.filter === 'All' || p.category === state.filter) && (!q || p.name.toLowerCase().includes(q)));
  if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
  else if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
  else if (state.sort === 'popular') list.sort((a, b) => b.reviews - a.reviews);
  else list.sort((a, b) => a.id - b.id);
  return list;
}
function renderProducts() {
  const list = visibleProducts();
  $('#productGrid').innerHTML = list.map((p, i) => `
    <article class="card" style="animation-delay:${Math.min(i, 8) * 0.05}s">
      <div class="card-media">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" data-fallback="${esc(p.category)}">
        <button class="fav ${state.favs.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-pressed="${state.favs.has(p.id)}" aria-label="${state.favs.has(p.id) ? 'Remove' : 'Add'} ${esc(p.name)} ${state.favs.has(p.id) ? 'from' : 'to'} favorites">${state.favs.has(p.id) ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        <p class="cat-tag">${esc(p.category)}</p>
        <h3>${esc(p.name)}</h3>
        <p class="stars" aria-label="Rated ${p.rating} out of 5">${stars(p.rating)} <small>${p.rating.toFixed(1)} (${p.reviews})</small></p>
        <p class="price">${money.format(p.price)}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-add="${p.id}">Add to Cart</button>
          <button class="btn btn-ghost" data-view="${p.id}">View Details</button>
        </div>
      </div>
    </article>`).join('');
  $('#emptyState').hidden = list.length > 0;
  $('#resultInfo').textContent = `${list.length} of ${state.products.length} products shown`;
}
$('#productGrid').addEventListener('click', e => {
  const add = e.target.closest('[data-add]'), view = e.target.closest('[data-view]'), fav = e.target.closest('[data-fav]');
  if (add) addToCart(+add.dataset.add, 1);
  if (view) openDetails(+view.dataset.view);
  if (fav) {
    const id = +fav.dataset.fav;
    state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
    renderProducts();
    const again = $(`[data-fav="${id}"]`); if (again) again.focus();
  }
});
$('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderProducts(); });
$('#searchInput').addEventListener('input', e => { state.query = e.target.value; renderProducts(); });
$('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#products').scrollIntoView({ behavior: 'smooth' }); });

/* ---------- Product details modal ---------- */
function openDetails(id) {
  const p = getProduct(id); if (!p) return;
  state.detailId = id; state.detailQty = 1;
  const img = $('#mImg');
  delete img.dataset.failed;
  img.dataset.fallback = p.category;
  img.src = p.image; img.alt = p.name;
  $('#mCat').textContent = p.category;
  $('#mName').textContent = p.name;
  $('#mRating').textContent = `${stars(p.rating)} ${p.rating.toFixed(1)} (${p.reviews} reviews)`;
  $('#mPrice').textContent = money.format(p.price);
  $('#mDesc').textContent = p.description || 'No description yet.';
  $('#mQty').textContent = 1;
  openLayer($('#productModal'));
}
$('#mMinus').addEventListener('click', () => { state.detailQty = Math.max(1, state.detailQty - 1); $('#mQty').textContent = state.detailQty; });
$('#mPlus').addEventListener('click', () => { state.detailQty = Math.min(99, state.detailQty + 1); $('#mQty').textContent = state.detailQty; });
$('#mAdd').addEventListener('click', () => { addToCart(state.detailId, state.detailQty); closeLayers(false); document.body.classList.remove('locked'); });

/* ---------- Cart ---------- */
function addToCart(id, qty) {
  const line = state.cart.find(l => l.id === id);
  if (line) line.qty = Math.min(99, line.qty + qty); else state.cart.push({ id, qty });
  renderCart();
  toast(`${getProduct(id).name} added to cart`);
  const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
}
const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
const cartTotal = () => state.cart.reduce((s, l) => s + getProduct(l.id).price * l.qty, 0);
function renderCart() {
  $('#cartCount').textContent = cartCount();
  $('#cartItemsTotal').textContent = cartCount();
  $('#cartSubtotal').textContent = money.format(cartTotal());
  $('#cartFoot').hidden = state.cart.length === 0;
  $('#cartItems').innerHTML = state.cart.length ? state.cart.map(l => {
    const p = getProduct(l.id);
    return `<div class="cart-item">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" data-fallback="${esc(p.category)}">
      <div><h4>${esc(p.name)}</h4><p>${money.format(p.price)}</p>
        <div class="qty" role="group" aria-label="Quantity of ${esc(p.name)}">
          <button data-dec="${p.id}" aria-label="Decrease quantity">−</button><output>${l.qty}</output><button data-inc="${p.id}" aria-label="Increase quantity">+</button>
        </div></div>
      <div><strong>${money.format(p.price * l.qty)}</strong><br><button class="remove" data-remove="${p.id}">Remove</button></div>
    </div>`;
  }).join('') : '<p class="cart-empty">Your cart is empty.<br>Add something you love.</p>';
}
$('#cartItems').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const id = +(t.dataset.inc || t.dataset.dec || t.dataset.remove);
  const line = state.cart.find(l => l.id === id); if (!line) return;
  if (t.dataset.inc) line.qty = Math.min(99, line.qty + 1);
  if (t.dataset.dec) line.qty -= 1;
  if (t.dataset.remove || line.qty <= 0) state.cart = state.cart.filter(l => l.id !== id);
  renderCart();
});
$('#clearCart').addEventListener('click', () => { state.cart = []; renderCart(); toast('Cart cleared'); });
$('#cartToggle').addEventListener('click', () => openLayer($('#cartDrawer')));

/* ---------- Checkout (no real payment) ---------- */
$('#checkoutBtn').addEventListener('click', () => {
  if (!state.cart.length) return toast('Your cart is empty');
  $('#coSummary').innerHTML = state.cart.map(l => {
    const p = getProduct(l.id);
    return `<div class="row"><span>${esc(p.name)} × ${l.qty}</span><span>${money.format(p.price * l.qty)}</span></div>`;
  }).join('');
  $('#coTotal').textContent = money.format(cartTotal());
  $('#coError').hidden = true;
  openLayer($('#checkoutModal'));
});
$('#checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#coName').value.trim(), phone = $('#coPhone').value.trim(), addr = $('#coAddress').value.trim();
  const err = $('#coError');
  if (!name || !addr || phone.replace(/\D/g, '').length < 6) {
    err.textContent = 'Please enter your full name, a valid phone number and your address.';
    err.hidden = false; return;
  }
  $('#okText').textContent = `Thank you, ${name}. We will call ${phone} to confirm your delivery.`;
  state.cart = []; renderCart();
  e.target.reset();
  openLayer($('#successModal'));
});

/* ---------- Add product (test only — see note at top) ---------- */
$('#pImage').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { showAddError('Please choose an image file.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    state.previewSrc = reader.result;
    $('#imgPreview').src = reader.result; $('#imgPreview').hidden = false; $('#uploadHint').hidden = true;
  };
  reader.readAsDataURL(file);
});
function showAddError(msg) { const el = $('#addError'); el.textContent = msg; el.hidden = !msg; }
$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#pName').value.trim(), price = parseFloat($('#pPrice').value);
  if (!name) return showAddError('Enter a product name.');
  if (!(price > 0)) return showAddError('Enter a price greater than 0.');
  showAddError('');
  const category = $('#pCategory').value;
  const product = {
    id: state.nextId++, name, category, price: Math.round(price * 100) / 100, rating: 4.5, reviews: 0,
    image: state.previewSrc || placeholder(category),
    description: $('#pDesc').value.trim() || 'A new arrival at Lumen & Co.'
  };
  state.products.push(product);
  e.target.reset(); state.previewSrc = '';
  $('#imgPreview').hidden = true; $('#imgPreview').removeAttribute('src'); $('#uploadHint').hidden = false;
  state.filter = 'All'; state.query = ''; $('#searchInput').value = '';
  renderCategories(); renderChips(); renderProducts();
  toast(`${name} added (temporary, this browser only)`);
  $('#products').scrollIntoView({ behavior: 'smooth' });
});

/* ---------- Navbar, theme, misc ---------- */
const nav = $('#nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
$('#menuToggle').addEventListener('click', e => {
  const open = $('#navLinks').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', open);
});
$('#navLinks').addEventListener('click', e => { if (e.target.closest('a')) { $('#navLinks').classList.remove('open'); $('#menuToggle').setAttribute('aria-expanded', 'false'); } });
$('#searchToggle').addEventListener('click', e => {
  const bar = $('#searchBar'); bar.hidden = !bar.hidden;
  e.currentTarget.setAttribute('aria-expanded', !bar.hidden);
  if (!bar.hidden) $('#searchInput').focus();
});
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('#themeToggle').setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('theme', t); } catch (_) { /* storage may be blocked; ignore */ }
}
$('#themeToggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
$$('[data-social]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); toast(`Add your ${a.dataset.social} link in index.html`);
}));

/* ---------- Init ---------- */
(function init() {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (_) { /* ignore */ }
  applyTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#year').textContent = new Date().getFullYear();
  renderCategories(); renderChips(); renderProducts(); renderCart();
  window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 500));
})();
