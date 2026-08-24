

const SHOP_NAME = 'Gangor Fashion Store';

/* ---------- small utils ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

/* ---------- state ---------- */
let CART = safeParse(localStorage.getItem('sf_cart')) || [];       // [{id, qty}]
let WISHLIST = safeParse(localStorage.getItem('sf_wishlist')) || []; // [id, ...]
const UI = { cartOpen: false, wishlistOpen: false, searchOpen: false, mobileMenuOpen: false };
let LOCAL = {};   // per-route ephemeral UI state, reset on navigation
let TOAST = null;
let toastTimer = null;

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
function persist() {
  localStorage.setItem('sf_cart', JSON.stringify(CART));
  localStorage.setItem('sf_wishlist', JSON.stringify(WISHLIST));
}

/* ---------- store helpers ---------- */
function findProduct(id) { return products.find((p) => p.id === id); }
function cartLines() {
  return CART.map((c) => ({ product: findProduct(c.id), qty: c.qty })).filter((l) => l.product);
}
function cartTotal() { return cartLines().reduce((s, l) => s + l.product.price * l.qty, 0); }
function cartCount() { return CART.reduce((s, c) => s + c.qty, 0); }
function isInWishlist(id) { return WISHLIST.includes(id); }

function addToCart(id, qty) {
  qty = qty || 1;
  const existing = CART.find((c) => c.id === id);
  if (existing) existing.qty += qty; else CART.push({ id, qty });
  persist();
  showToast('Added to cart');
  render();
}
function removeFromCart(id) { CART = CART.filter((c) => c.id !== id); persist(); render(); }
function updateQty(id, qty) {
  if (qty < 1) return removeFromCart(id);
  const line = CART.find((c) => c.id === id);
  if (line) line.qty = qty;
  persist(); render();
}
function clearCart() { CART = []; persist(); }
function toggleWishlist(id) {
  if (WISHLIST.includes(id)) WISHLIST = WISHLIST.filter((w) => w !== id);
  else WISHLIST.push(id);
  persist(); render();
}
function showToast(msg) {
  TOAST = msg;
  clearTimeout(toastTimer);
  renderToastOnly();
  toastTimer = setTimeout(() => { TOAST = null; renderToastOnly(); }, 2200);
}
function renderToastOnly() {
  const el = $('#toast-root');
  if (el) el.innerHTML = TOAST ? `<div class="toast">${escapeHtml(TOAST)}</div>` : '';
}

/* ---------- router ---------- */
function getPath() { return window.location.hash.slice(1) || '/'; }
function navigate(to) { window.location.hash = '#' + to; }

window.addEventListener('hashchange', () => {
  LOCAL = {};
  UI.mobileMenuOpen = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
});

/* ---------- small render helpers ---------- */
function starRating(rating, size) {
  size = size || 14;
  let out = '<div class="stars">';
  for (let i = 0; i < 5; i++) {
    const filled = i < Math.round(rating);
    out += svgIcon('star', size, `style="color:${filled ? '#fbbf24' : '#d1d5db'};fill:${filled ? '#fbbf24' : 'none'}"`);
  }
  return out + '</div>';
}
function discountBadge(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return '';
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return `<span class="badge badge-solid-primary">${pct}% OFF</span>`;
}

function productCard(p) {
  const wished = isInWishlist(p.id);
  return `
  <div class="card-product">
    <div class="img-wrap" data-action="navigate" data-path="/product/${p.id}">
      <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" loading="lazy" />
      <div class="badges">
        ${p.isNew ? '<span class="badge badge-solid-teal">New</span>' : ''}
        ${p.isBestSeller ? '<span class="badge badge-solid-gold">Best Seller</span>' : ''}
        ${discountBadge(p.price, p.oldPrice)}
      </div>
      <button class="wish-btn" data-action="toggle-wishlist" data-id="${p.id}" aria-label="Add to wishlist">
        ${svgIcon(wished ? 'heartFill' : 'heart', 18, `style="color:${wished ? '#e63946' : '#6b7280'}"`)}
      </button>
    </div>
    <div class="card-body">
      <p class="type">${escapeHtml(p.type)}</p>
      <h3 data-action="navigate" data-path="/product/${p.id}">${escapeHtml(p.name)}</h3>
      <div class="rating-row">
        ${starRating(p.rating)}
        <span class="cnt">(${p.reviews})</span>
      </div>
      <div class="price-row">
        <span class="price">&#8377;${p.price}</span>
        ${p.oldPrice ? `<span class="old">&#8377;${p.oldPrice}</span>` : ''}
      </div>
      <button class="btn-primary" data-action="add-to-cart" data-id="${p.id}">Add to Cart</button>
    </div>
  </div>`;
}

function productGrid(list) {
  if (!list.length) return '<p style="color:var(--gray-500);padding:24px 0;">No products found.</p>';
  return `<div class="product-grid">${list.map(productCard).join('')}</div>`;
}

function breadcrumb(items) {
  // items: [{label, path?}] — last item has no path (current page)
  return `<nav class="breadcrumb">${items.map((it, i) => {
    const sep = i > 0 ? '<span>/</span>' : '';
    if (it.path) return `${sep}<button data-action="navigate" data-path="${it.path}">${escapeHtml(it.label)}</button>`;
    return `${sep}<span class="current">${escapeHtml(it.label)}</span>`;
  }).join('')}</nav>`;
}

/* ===================================================================
   HEADER / FOOTER / DRAWERS
   =================================================================== */

function isLinkActive(link, path) {
  return path === link.path || (link.path !== '/' && path.startsWith(link.path));
}

function renderHeader(path) {
  return `
  <div class="announce"><span class="dot">${svgIcon('sparkles', 14)}</span>Festive Sale Live Now — Up to 30% OFF on Rakhi, Jewellery &amp; Cosmetics!</div>
  <header class="site-header" id="site-header">
    <nav class="wrap nav-row">
      <button class="logo-btn" data-action="navigate" data-path="/">
        <div class="logo-icon">${svgIcon('sparkles', 22)}</div>
        <div class="logo-text">
          <h1>Gangor Fashion</h1>
          <p>&amp; Cosmetics</p>
        </div>
      </button>

      <ul class="desktop-nav">
        ${navLinks.map((l) => `<li><a href="#${l.path}" data-action="navigate" data-path="${l.path}" class="${isLinkActive(l, path) ? 'active' : ''}">${escapeHtml(l.label)}</a></li>`).join('')}
      </ul>

      <div class="nav-icons">
        <button class="icon-btn" data-action="open-search" aria-label="Search">${svgIcon('search', 20)}</button>
        <button class="icon-btn" data-action="open-wishlist" aria-label="Wishlist">
          ${svgIcon('heart', 20)}
          ${WISHLIST.length ? `<span class="count">${WISHLIST.length}</span>` : ''}
        </button>
        <button class="icon-btn" data-action="open-cart" aria-label="Cart">
          ${svgIcon('cart', 20)}
          ${cartCount() ? `<span class="count">${cartCount()}</span>` : ''}
        </button>
        <button class="icon-btn account" data-action="navigate" data-path="/account" aria-label="Account">${svgIcon('user', 20)}</button>
        <button class="icon-btn menu-toggle" data-action="toggle-mobile-menu" aria-label="Menu">${svgIcon(UI.mobileMenuOpen ? 'x' : 'menu', 22)}</button>
      </div>
    </nav>

    ${UI.mobileMenuOpen ? `
    <div class="mobile-menu">
      <ul class="wrap">
        ${navLinks.map((l) => `<li><a href="#${l.path}" data-action="navigate" data-path="${l.path}" class="${path === l.path ? 'active' : ''}">${escapeHtml(l.label)}</a></li>`).join('')}
        <li><button data-action="navigate" data-path="/account">${svgIcon('user', 18)} &nbsp;My Account</button></li>
      </ul>
    </div>` : ''}
  </header>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="newsletter">
      <div class="wrap newsletter-inner">
        <div>
          <h3>Stay in the Loop</h3>
          <p>Subscribe for new arrivals, festival offers, and exclusive discounts delivered to your inbox.</p>
        </div>
        <form data-form="newsletter">
          <input type="email" required placeholder="Enter your email address" />
          <button type="submit" class="btn-gold">${svgIcon('send', 16)} Subscribe</button>
        </form>
      </div>
    </div>

    <div class="wrap footer-main">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <div class="logo-icon">${svgIcon('sparkles', 22)}</div>
            <div>
              <h2>Shree Fashion</h2>
              <p>&amp; Cosmetics</p>
            </div>
          </div>
          <p class="footer-desc">Your trusted local destination for beautiful Rakhi, bangles, jewellery, rings, bracelets, and cosmetics. Celebrating every occasion with quality, style, and affordable prices.</p>
          <div class="social-row">
            <a href="#" class="ig" aria-label="Instagram">${svgIcon('instagram', 18)}</a>
            <a href="#" class="fb" aria-label="Facebook">${svgIcon('facebook', 18)}</a>
            <a href="#" class="wa" aria-label="WhatsApp">${svgIcon('message', 18)}</a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>${navLinks.slice(0, 6).map((l) => `<li><button data-action="navigate" data-path="${l.path}">${escapeHtml(l.label)}</button></li>`).join('')}</ul>
        </div>

        <div class="footer-col">
          <h4>Customer Support</h4>
          <ul>
            <li><button data-action="navigate" data-path="/contact">Contact Us</button></li>
            <li><button data-action="navigate" data-path="/delivery">Delivery Information</button></li>
            <li><button data-action="navigate" data-path="/returns">Return Policy</button></li>
            <li><button data-action="navigate" data-path="/about">About Us</button></li>
            <li><button data-action="navigate" data-path="/faq">FAQ</button></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Get in Touch</h4>
          <ul class="contact-list">
            <li>${svgIcon('mapPin', 18)}<span>Shop No. 12, Main Bazaar Road, Your City, India - 400001</span></li>
            <li>${svgIcon('phone', 18)}<a href="tel:+919876543210">+91 98765 43210</a></li>
            <li>${svgIcon('mail', 18)}<a href="mailto:hello@shreefashion.in">hello@shreefashion.in</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="wrap footer-bottom-inner">
        <p>&copy; ${year} ${SHOP_NAME}. All rights reserved.</p>
        <p>Designed with care for our wonderful customers.</p>
      </div>
    </div>
  </footer>`;
}

function drawerItemRow(product, qty) {
  return `
  <div class="drawer-item">
    <img src="${product.images[0]}" alt="${escapeHtml(product.name)}" />
    <div class="info">
      <div class="top">
        <h3>${escapeHtml(product.name)}</h3>
        <button data-action="remove-from-cart" data-id="${product.id}" style="color:var(--gray-400)">${svgIcon('trash', 16)}</button>
      </div>
      <p class="type">${escapeHtml(product.type)}</p>
      <div class="bottom">
        <div class="qty-box">
          <button data-action="update-qty" data-id="${product.id}" data-qty="${qty - 1}">${svgIcon('minus', 14)}</button>
          <span>${qty}</span>
          <button data-action="update-qty" data-id="${product.id}" data-qty="${qty + 1}">${svgIcon('plus', 14)}</button>
        </div>
        <span style="font-family:var(--font-display);font-weight:700;">&#8377;${product.price * qty}</span>
      </div>
    </div>
  </div>`;
}

function renderCartDrawer() {
  if (!UI.cartOpen) return '';
  const lines = cartLines();
  return `
  <div class="overlay">
    <div class="backdrop" data-action="close-cart"></div>
    <div class="drawer">
      <div class="drawer-head">
        <h2>${svgIcon('bag', 20, 'style="color:var(--primary-500)"')} Your Cart (${cartCount()})</h2>
        <button class="drawer-close" data-action="close-cart">${svgIcon('x', 20)}</button>
      </div>
      ${lines.length === 0 ? `
      <div class="drawer-empty">
        <div class="ic">${svgIcon('bag', 36)}</div>
        <p style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--gray-900)">Your cart is empty</p>
        <p style="font-size:14px;color:var(--gray-500)">Browse our collection and add some beautiful items!</p>
        <button class="btn-primary" data-action="close-cart-and-home">Start Shopping</button>
      </div>` : `
      <div class="drawer-body">${lines.map((l) => drawerItemRow(l.product, l.qty)).join('')}</div>
      <div class="drawer-footer">
        <div class="subtotal"><span style="font-size:14px;color:var(--gray-600)">Subtotal</span><span class="amt">&#8377;${cartTotal()}</span></div>
        <p class="note">Shipping &amp; taxes calculated at checkout</p>
        <button class="btn-primary btn-block" data-action="goto-checkout">Proceed to Checkout ${svgIcon('arrowRight', 16)}</button>
        <button class="btn-ghost btn-block" style="margin-top:8px;color:var(--gray-600)" data-action="goto-cart-page">View Full Cart</button>
      </div>`}
    </div>
  </div>`;
}

function renderWishlistDrawer() {
  if (!UI.wishlistOpen) return '';
  const items = WISHLIST.map(findProduct).filter(Boolean);
  return `
  <div class="overlay">
    <div class="backdrop" data-action="close-wishlist"></div>
    <div class="drawer">
      <div class="drawer-head">
        <h2>${svgIcon('heart', 20, 'style="color:var(--primary-500)"')} Your Wishlist (${items.length})</h2>
        <button class="drawer-close" data-action="close-wishlist">${svgIcon('x', 20)}</button>
      </div>
      ${items.length === 0 ? `
      <div class="drawer-empty">
        <div class="ic">${svgIcon('heart', 36)}</div>
        <p style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--gray-900)">Your wishlist is empty</p>
        <p style="font-size:14px;color:var(--gray-500)">Tap the heart on any product to save it for later.</p>
        <button class="btn-primary" data-action="close-wishlist-and-home">Start Shopping</button>
      </div>` : `
      <div class="drawer-body">
        ${items.map((product) => `
        <div class="drawer-item">
          <img src="${product.images[0]}" alt="${escapeHtml(product.name)}" data-action="navigate-close-wishlist" data-path="/product/${product.id}" style="cursor:pointer" />
          <div class="info">
            <div class="top">
              <h3 data-action="navigate-close-wishlist" data-path="/product/${product.id}" style="cursor:pointer">${escapeHtml(product.name)}</h3>
              <button data-action="toggle-wishlist" data-id="${product.id}" style="color:var(--gray-400)">${svgIcon('trash', 16)}</button>
            </div>
            <p class="type">${escapeHtml(product.type)}</p>
            <div class="bottom">
              <span style="font-family:var(--font-display);font-weight:700;">&#8377;${product.price}</span>
              <button class="btn-outline" style="padding:6px 14px;font-size:12px" data-action="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
          </div>
        </div>`).join('')}
      </div>`}
    </div>
  </div>`;
}

function renderSearchOverlay() {
  if (!UI.searchOpen) return '';
  const q = (LOCAL.searchQuery || '').trim().toLowerCase();
  const results = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8) : [];
  return `
  <div class="search-overlay">
    <div class="backdrop" data-action="close-search"></div>
    <div class="search-panel">
      <div class="search-box">
        <div class="search-input-row">
          ${svgIcon('search', 20, 'style="color:var(--gray-400)"')}
          <input id="search-input" type="text" placeholder="Search for Rakhi, Jewellery, Cosmetics..." value="${escapeHtml(LOCAL.searchQuery || '')}" autocomplete="off" />
          <button data-action="close-search">${svgIcon('x', 20)}</button>
        </div>
        <div class="search-results" id="search-results">${searchResultsHtml(q, results)}</div>
      </div>
    </div>
  </div>`;
}
function searchResultsHtml(q, results) {
  if (!q) return `<div class="search-empty">Start typing to search our full collection.</div>`;
  if (!results.length) return `<div class="search-empty">No products found for &ldquo;${escapeHtml(q)}&rdquo;.</div>`;
  return results.map((p) => `
    <div class="search-result-item" data-action="navigate-close-search" data-path="/product/${p.id}">
      <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" />
      <div>
        <p class="n">${escapeHtml(p.name)}</p>
        <p class="p">&#8377;${p.price} &middot; ${escapeHtml(p.type)}</p>
      </div>
    </div>`).join('');
}

/* ===================================================================
   HOME PAGE SECTIONS
   =================================================================== */

function sectionHero() {
  return `
  <section class="hero">
    <div class="hero-blob b1"></div>
    <div class="hero-blob b2"></div>
    <div class="wrap hero-inner">
      <div class="hero-text">
        <span class="badge badge-primary">${svgIcon('sparkles', 14)} Festive Collection 2026</span>
        <h1>Celebrate Every Occasion <span class="grad">in Style</span></h1>
        <p class="lead">Beautiful Rakhi, Jewellery, Bangles &amp; Cosmetics — handcrafted with love, delivered with care. Discover the perfect pieces for every celebration.</p>
        <div class="hero-actions">
          <button class="btn-primary" data-action="navigate" data-path="/category/rakhi">Shop Now ${svgIcon('arrowRight', 16)}</button>
          <button class="btn-outline" data-action="navigate" data-path="/offers">View Offers</button>
        </div>
        <div class="hero-stats">
          <div class="stat"><p class="num">500+</p><p class="lbl">Products</p></div>
          <div class="stat"><p class="num">10K+</p><p class="lbl">Happy Customers</p></div>
          <div class="stat"><p class="num">4.8</p><p class="lbl">Avg Rating</p></div>
        </div>
      </div>
      <div class="hero-image-wrap">
        <div class="hero-image">
          <img src="./images/main.jpg" alt="Indian woman wearing traditional jewellery" />
        </div>
        <div class="hero-float">
          <div class="ic">${svgIcon('sparkles', 24)}</div>
          <div>
            <p style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--gray-900)">Up to 30% OFF</p>
            <p style="font-size:12px;color:var(--gray-500)">Festival Special Sale</p>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

const CAT_META = [
  { key: 'rakhi', label: 'Rakhi', icon: 'gift', path: '/category/rakhi' },
  { key: 'bangles', label: 'Bangles', icon: 'circleRing', path: '/category/bangles' },
  { key: 'jewellery', label: 'Jewellery', icon: 'gem', path: '/category/jewellery' },
  { key: 'rings-bracelets', label: 'Rings & Bracelets', icon: 'watch', path: '/category/rings-bracelets' },
  { key: 'cosmetics', label: 'Cosmetics', icon: 'droplet', path: '/category/cosmetics' },
  { key: 'all', label: 'All Products', icon: 'sparkles', path: '/category/all' },
];

function sectionShopByCategory() {
  return `
  <section class="wrap pad">
    <div class="section-head">
      <div>
        <span class="badge badge-primary">Explore</span>
        <h2 class="section-title" style="margin-top:12px">Shop by Category</h2>
      </div>
    </div>
    <div class="cat-grid">
      ${CAT_META.map((c) => `
      <button class="cat-card" data-action="navigate" data-path="${c.path}">
        <div class="ic">${svgIcon(c.icon, 26)}</div>
        <span class="name">${escapeHtml(c.label)}</span>
      </button>`).join('')}
    </div>
  </section>`;
}

function sectionRakhiSpecial() {
  const rakhiProducts = products.filter((p) => p.category === 'rakhi').slice(0, 4);
  return `
  <section class="rakhi-band">
    <div class="blob1"></div><div class="blob2"></div>
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="badge" style="background:var(--gold-400);color:var(--primary-900)">Festival Special</span>
          <h2 style="margin-top:12px;font-size:30px;font-weight:700;color:#fff">Rakhi Special Collection</h2>
          <p style="margin-top:8px">Celebrate the sacred bond of love with our exclusive Rakhi range — Designer, Traditional, Kids &amp; Gift Combos.</p>
        </div>
        <button class="btn-gold" data-action="navigate" data-path="/category/rakhi">View All Rakhi ${svgIcon('arrowRight', 16)}</button>
      </div>
      ${productGrid(rakhiProducts)}
    </div>
  </section>`;
}

function sectionFeaturedProducts() {
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);
  return `
  <section class="wrap pad">
    <div class="section-head">
      <div>
        <span class="badge badge-primary">Handpicked for You</span>
        <h2 class="section-title" style="margin-top:12px">Featured Products</h2>
      </div>
      <button class="btn-ghost" style="color:var(--primary-600)" data-action="navigate" data-path="/category/all">View All ${svgIcon('arrowRight', 16)}</button>
    </div>
    ${productGrid(featured)}
  </section>`;
}

function sectionNewArrivals() {
  const newProducts = products.filter((p) => p.isNew);
  return `
  <section class="bg-gray pad">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="badge badge-teal">Just In</span>
          <h2 class="section-title" style="margin-top:12px">New Arrivals</h2>
          <p style="margin-top:8px;color:var(--gray-600)">Be the first to shop our latest additions</p>
        </div>
        <button class="btn-ghost" style="color:var(--primary-600)" data-action="navigate" data-path="/new-arrivals">View All ${svgIcon('arrowRight', 16)}</button>
      </div>
      ${productGrid(newProducts)}
    </div>
  </section>`;
}

function sectionSpecialOffers() {
  const offerCount = products.filter((p) => p.oldPrice && p.oldPrice > p.price).length;
  return `
  <section class="offer-band">
    <div class="wrap" style="max-width:640px">
      <div class="icon">${svgIcon('gift', 30)}</div>
      <h2 class="section-title" style="margin-top:16px">Festive Offers Just for You</h2>
      <p style="margin-top:8px;color:var(--gray-600)">Save big across Rakhi, Jewellery, Bangles &amp; Cosmetics — ${offerCount} products currently on discount.</p>
      <button class="btn-primary" style="margin-top:24px" data-action="navigate" data-path="/offers">Shop All Offers ${svgIcon('arrowRight', 16)}</button>
    </div>
  </section>`;
}

function sectionWhyChooseUs() {
  const items = [
    { icon: 'shieldCheck', title: 'Secure Shopping', desc: 'Your payments and data are always protected.' },
    { icon: 'truck', title: 'Fast Delivery', desc: 'Quick, reliable shipping across India.' },
    { icon: 'refresh', title: 'Easy Returns', desc: 'Hassle-free 7-day return & exchange policy.' },
    { icon: 'message', title: '24/7 Support', desc: 'We\'re always here to help over call or chat.' },
  ];
  return `
  <section class="wrap pad">
    <div style="text-align:center;margin-bottom:40px">
      <span class="badge badge-primary">Why Us</span>
      <h2 class="section-title" style="margin-top:12px">Why Choose Us</h2>
    </div>
    <div class="why-grid">
      ${items.map((it) => `
      <div class="why-card">
        <div class="ic">${svgIcon(it.icon, 26)}</div>
        <h3>${escapeHtml(it.title)}</h3>
        <p>${escapeHtml(it.desc)}</p>
      </div>`).join('')}
    </div>
  </section>`;
}

function sectionCustomerReviews() {
  return `
  <section class="pad" style="background:linear-gradient(135deg,var(--gray-50),rgba(255,241,242,.5))">
    <div class="wrap">
      <div style="text-align:center;margin-bottom:40px">
        <span class="badge badge-gold">Testimonials</span>
        <h2 class="section-title" style="margin-top:12px">What Our Customers Say</h2>
        <p style="margin:12px auto 0;max-width:560px;color:var(--gray-600)">Real reviews from our wonderful customers across India.</p>
      </div>
      <div class="review-grid">
        ${reviews.map((r) => `
        <div class="review-card">
          <div class="quote">${svgIcon('quote', 32)}</div>
          <p class="text">&ldquo;${escapeHtml(r.text)}&rdquo;</p>
          <div style="margin-top:16px">${starRating(r.rating, 16)}</div>
          <div class="who">
            <div class="avatar">${r.name.charAt(0)}</div>
            <div>
              <p class="n">${escapeHtml(r.name)}</p>
              <p class="l">${escapeHtml(r.location)}</p>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function pageHome() {
  return sectionHero() + sectionShopByCategory() + sectionRakhiSpecial() + sectionFeaturedProducts()
    + sectionNewArrivals() + sectionSpecialOffers() + sectionWhyChooseUs() + sectionCustomerReviews();
}

/* ===================================================================
   CATEGORY PAGE
   =================================================================== */

const priceRanges = [
  { label: 'Under \u20b9300', min: 0, max: 300 },
  { label: '\u20b9300 - \u20b9600', min: 300, max: 600 },
  { label: '\u20b9600 - \u20b91000', min: 600, max: 1000 },
  { label: '\u20b91000 - \u20b92000', min: 1000, max: 2000 },
  { label: 'Over \u20b92000', min: 2000, max: Infinity },
];

function categoryBaseProducts(category) {
  if (category === 'new') return products.filter((p) => p.isNew);
  if (category === 'offers') return products.filter((p) => p.oldPrice && p.oldPrice > p.price);
  if (category === 'all' || !category) return products;
  if (category === 'rings' || category === 'bracelets') return products.filter((p) => p.category === 'rings' || p.category === 'bracelets');
  return products.filter((p) => p.category === category);
}

function pageCategory(category) {
  ensureLocalDefaults({ filterTypes: [], priceIdx: null, inStock: false, sort: 'popular', showMobileFilters: false });

  const base = categoryBaseProducts(category);
  const typesForFilter = Array.from(new Set(base.map((p) => p.type)));

  let list = [...base];
  if (LOCAL.filterTypes.length) list = list.filter((p) => LOCAL.filterTypes.includes(p.type));
  if (LOCAL.priceIdx !== null) { const r = priceRanges[LOCAL.priceIdx]; list = list.filter((p) => p.price >= r.min && p.price < r.max); }
  if (LOCAL.inStock) list = list.filter((p) => p.stock > 0);

  if (LOCAL.sort === 'newest') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  else if (LOCAL.sort === 'price-low') list.sort((a, b) => a.price - b.price);
  else if (LOCAL.sort === 'price-high') list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => b.reviews - a.reviews);

  const pageTitle = category === 'new' ? 'New Arrivals' : category === 'offers' ? 'Special Offers'
    : (category === 'all' || !category) ? 'All Products' : categoryNames[category];

  const activeCount = LOCAL.filterTypes.length + (LOCAL.priceIdx !== null ? 1 : 0) + (LOCAL.inStock ? 1 : 0);

  const filterContent = `
    <div class="filter-group">
      <h4>Product Type</h4>
      <div class="opts">
        ${typesForFilter.map((t) => `
        <label class="filter-opt">
          <input type="checkbox" class="chk-input" data-action="filter-type" value="${escapeHtml(t)}" ${LOCAL.filterTypes.includes(t) ? 'checked' : ''} />
          ${escapeHtml(t)}
        </label>`).join('')}
      </div>
    </div>
    <div class="filter-group">
      <h4>Price Range</h4>
      <div class="opts">
        ${priceRanges.map((r, i) => `
        <label class="filter-opt">
          <input type="radio" name="price-range" class="chk-input round" data-action="filter-price" value="${i}" ${LOCAL.priceIdx === i ? 'checked' : ''} />
          ${escapeHtml(r.label)}
        </label>`).join('')}
      </div>
    </div>
    <div class="filter-group">
      <h4>Availability</h4>
      <label class="filter-opt">
        <input type="checkbox" class="chk-input" data-action="filter-stock" ${LOCAL.inStock ? 'checked' : ''} />
        In Stock Only
      </label>
    </div>
    ${activeCount ? `<button class="btn-ghost btn-block" style="color:var(--primary-600)" data-action="clear-filters">Clear All Filters (${activeCount})</button>` : ''}
  `;

  return `
  <div class="page">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: pageTitle }])}
    <div style="margin-bottom:24px">
      <h1 style="font-size:30px;font-weight:700;color:var(--gray-900)">${escapeHtml(pageTitle)}</h1>
      <p style="font-size:14px;color:var(--gray-500);margin-top:4px">${list.length} products found</p>
    </div>

    <div class="cat-layout">
      <aside class="filters-aside">
        <div class="filters-box">
          <div class="head">${svgIcon('sliders', 18, 'style="color:var(--primary-500)"')}<h3>Filters</h3></div>
          ${filterContent}
        </div>
      </aside>

      <div style="flex:1;min-width:0">
        <div class="toolbar">
          <button class="filter-toggle" data-action="toggle-mobile-filters">
            ${svgIcon('sliders', 16)} Filters
            ${activeCount ? `<span class="n">${activeCount}</span>` : ''}
          </button>
          <select class="sort-select" data-action="change-sort">
            <option value="popular" ${LOCAL.sort === 'popular' ? 'selected' : ''}>Popular</option>
            <option value="newest" ${LOCAL.sort === 'newest' ? 'selected' : ''}>Newest</option>
            <option value="price-low" ${LOCAL.sort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price-high" ${LOCAL.sort === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
          </select>
        </div>

        ${list.length === 0 ? `
        <div class="empty-state" style="border:1px dashed var(--gray-200);border-radius:16px;padding:64px 16px">
          <p style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--gray-900)">No products found</p>
          <p style="font-size:14px;color:var(--gray-500)">Try adjusting your filters</p>
          <button class="btn-primary" data-action="clear-filters">Clear Filters</button>
        </div>` : productGrid(list)}
      </div>
    </div>

    ${LOCAL.showMobileFilters ? `
    <div class="mobile-filter-drawer">
      <div class="backdrop" data-action="toggle-mobile-filters"></div>
      <div class="mobile-filter-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h3 style="font-size:18px;font-weight:700;color:var(--gray-900)">Filters</h3>
          <button class="drawer-close" data-action="toggle-mobile-filters">${svgIcon('x', 20)}</button>
        </div>
        ${filterContent}
        <button class="btn-primary btn-block" style="margin-top:24px" data-action="toggle-mobile-filters">Show ${list.length} Results</button>
      </div>
    </div>` : ''}
  </div>`;
}

function ensureLocalDefaults(defaults) {
  Object.keys(defaults).forEach((k) => { if (!(k in LOCAL)) LOCAL[k] = defaults[k]; });
}

/* ===================================================================
   PRODUCT DETAIL PAGE
   =================================================================== */

function pageProductDetail(id) {
  const product = findProduct(id);
  if (!product) {
    return `<div class="page"><div class="empty-state">
      <h1 style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gray-900)">Product Not Found</h1>
      <p style="color:var(--gray-500)">The product you are looking for doesn't exist.</p>
      <button class="btn-primary" data-action="navigate" data-path="/">Back to Home</button>
    </div></div>`;
  }

  ensureLocalDefaults({ activeImage: 0, qty: 1 });
  const wished = isInWishlist(product.id);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return `
  <div class="page">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: categoryNames[product.category] || product.category, path: `/category/${product.category}` }, { label: product.name }])}

    <button class="btn-ghost" style="margin-bottom:20px;color:var(--gray-600);padding-left:0" data-action="navigate" data-path="/category/${product.category}">
      ${svgIcon('chevronLeft', 16)} Back to ${escapeHtml(product.category)}
    </button>

    <div class="pd-grid">
      <div>
        <div class="pd-main-img">
          <img src="${product.images[LOCAL.activeImage] || product.images[0]}" alt="${escapeHtml(product.name)}" />
          <div class="badges" style="position:absolute;left:16px;top:16px">
            ${product.isNew ? '<span class="badge badge-solid-teal">New Arrival</span>' : ''}
            ${discountBadge(product.price, product.oldPrice)}
          </div>
        </div>
        ${product.images.length > 1 ? `
        <div class="pd-thumbs">
          ${product.images.map((img, i) => `
          <button class="${LOCAL.activeImage === i ? 'active' : ''}" data-action="set-active-image" data-index="${i}">
            <img src="${img}" alt="${escapeHtml(product.name)} ${i + 1}" />
          </button>`).join('')}
        </div>` : ''}
      </div>

      <div>
        <p style="font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--primary-500)">${escapeHtml(product.type)}</p>
        <h1 style="margin-top:8px;font-size:28px;font-weight:700;color:var(--gray-900)">${escapeHtml(product.name)}</h1>
        <div style="margin-top:12px;display:flex;align-items:center;gap:12px">
          ${starRating(product.rating, 18)}
          <span style="font-size:14px;color:var(--gray-500)">${product.rating} (${product.reviews} reviews)</span>
        </div>

        <div class="pd-price-row">
          <span class="price">&#8377;${product.price}</span>
          ${product.oldPrice ? `<span class="old">&#8377;${product.oldPrice}</span><span class="badge badge-primary">${discount}% OFF</span>` : ''}
        </div>
        <p style="margin-top:4px;font-size:12px;color:var(--gray-500)">Inclusive of all taxes</p>

        <p style="margin-top:20px;font-size:14px;line-height:1.6;color:var(--gray-600)">${escapeHtml(product.description)}</p>

        <div class="pd-stock">
          ${product.stock > 0
            ? `${svgIcon('check', 16, 'style="color:var(--teal-500)"')}<span style="font-weight:600;color:var(--teal-600)">In Stock</span><span style="color:var(--gray-400)">(${product.stock} available)</span>`
            : `<span style="font-weight:600;color:var(--primary-600)">Out of Stock</span>`}
        </div>

        <div class="pd-qty-row">
          <div class="qty-box">
            <button data-action="set-qty" data-qty="${Math.max(1, LOCAL.qty - 1)}">${svgIcon('minus', 16)}</button>
            <span>${LOCAL.qty}</span>
            <button data-action="set-qty" data-qty="${LOCAL.qty + 1}">${svgIcon('plus', 16)}</button>
          </div>
          <button class="pd-wish-btn ${wished ? 'active' : ''}" data-action="toggle-wishlist" data-id="${product.id}">
            ${svgIcon(wished ? 'heartFill' : 'heart', 18)}
          </button>
        </div>

        <div class="pd-actions">
          <button class="btn-outline" data-action="add-to-cart-qty" data-id="${product.id}">${svgIcon('cart', 18)} Add to Cart</button>
          <button class="btn-primary" data-action="buy-now" data-id="${product.id}">Buy Now</button>
        </div>

        <div class="trust-grid">
          <div class="item">${svgIcon('shieldCheck', 22, 'style="color:var(--primary-500)"')}<span>Secure Shopping</span></div>
          <div class="item">${svgIcon('truck', 22, 'style="color:var(--primary-500)"')}<span>Fast Delivery</span></div>
          <div class="item">${svgIcon('refresh', 22, 'style="color:var(--primary-500)"')}<span>Easy Returns</span></div>
        </div>

        <div style="margin-top:32px;border-top:1px solid var(--gray-100);padding-top:24px">
          <h3 style="font-size:16px;font-weight:700;color:var(--gray-900)">Product Details</h3>
          <ul class="detail-list">
            ${product.details.map((d) => `<li>${svgIcon('check', 16, 'style="color:var(--teal-500);flex-shrink:0;margin-top:2px"')}${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    ${related.length ? `
    <section style="margin-top:64px">
      <h2 class="section-title" style="margin-bottom:32px">Related Products</h2>
      ${productGrid(related)}
    </section>` : ''}
  </div>`;
}

/* ===================================================================
   CART PAGE
   =================================================================== */

function pageCart() {
  const lines = cartLines();
  const shipping = cartTotal() > 999 ? 0 : lines.length > 0 ? 49 : 0;
  const total = cartTotal() + shipping;

  if (lines.length === 0) {
    return `<div class="page"><div class="empty-state">
      <div class="ic">${svgIcon('bag', 40)}</div>
      <h1 style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gray-900)">Your Cart is Empty</h1>
      <p style="color:var(--gray-500)">Looks like you haven't added anything yet.</p>
      <button class="btn-primary" data-action="navigate" data-path="/">Start Shopping</button>
    </div></div>`;
  }

  return `
  <div class="page">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: 'Cart' }])}
    <h1 style="margin-bottom:32px;font-size:30px;font-weight:700;color:var(--gray-900)">Shopping Cart <span style="font-size:16px;font-weight:400;color:var(--gray-400)">(${cartCount()} items)</span></h1>

    <div style="display:grid;gap:32px" class="cart-columns">
      <div>
        <div style="display:flex;flex-direction:column;gap:16px">
          ${lines.map((l) => `
          <div class="cart-item-row">
            <img src="${l.product.images[0]}" alt="${escapeHtml(l.product.name)}" data-action="navigate" data-path="/product/${l.product.id}" />
            <div style="flex:1;display:flex;flex-direction:column">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <h3 style="cursor:pointer;font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--gray-900)" data-action="navigate" data-path="/product/${l.product.id}">${escapeHtml(l.product.name)}</h3>
                  <p style="margin-top:2px;font-size:12px;color:var(--gray-500)">${escapeHtml(l.product.type)}</p>
                </div>
                <button data-action="remove-from-cart" data-id="${l.product.id}" style="color:var(--gray-400)">${svgIcon('trash', 18)}</button>
              </div>
              <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
                <div class="qty-box">
                  <button data-action="update-qty" data-id="${l.product.id}" data-qty="${l.qty - 1}">${svgIcon('minus', 14)}</button>
                  <span>${l.qty}</span>
                  <button data-action="update-qty" data-id="${l.product.id}" data-qty="${l.qty + 1}">${svgIcon('plus', 14)}</button>
                </div>
                <div style="text-align:right">
                  <p style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--gray-900)">&#8377;${l.product.price * l.qty}</p>
                  ${l.product.oldPrice ? `<p style="font-size:12px;color:var(--gray-400);text-decoration:line-through">&#8377;${l.product.oldPrice * l.qty}</p>` : ''}
                </div>
              </div>
            </div>
          </div>`).join('')}
        </div>
        <button class="btn-ghost" style="margin-top:24px;color:var(--primary-600);padding-left:0" data-action="navigate" data-path="/">${svgIcon('arrowLeft', 16)} Continue Shopping</button>
      </div>

      <div>
        <div class="cart-summary-box">
          <h2 style="font-size:18px;font-weight:700;color:var(--gray-900)">Order Summary</h2>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
            <div class="summary-row"><span style="color:var(--gray-600)">Subtotal (${cartCount()} items)</span><span style="font-weight:600">&#8377;${cartTotal()}</span></div>
            <div class="summary-row"><span style="color:var(--gray-600)">Shipping</span><span style="font-weight:600">${shipping === 0 ? '<span style="color:var(--teal-600)">FREE</span>' : `&#8377;${shipping}`}</span></div>
            ${shipping > 0 ? `<p class="free-ship-note">Add &#8377;${999 - cartTotal()} more to get FREE shipping!</p>` : ''}
            <div style="border-top:1px solid var(--gray-100);padding-top:12px;display:flex;justify-content:space-between">
              <span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--gray-900)">Total</span>
              <span style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--primary-600)">&#8377;${total}</span>
            </div>
          </div>
          <button class="btn-primary btn-block" style="margin-top:20px" data-action="goto-checkout">Proceed to Checkout ${svgIcon('arrowRight', 16)}</button>
          <div style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:var(--gray-400)">
            <span>Secure checkout powered by</span><span style="font-weight:600;color:var(--gray-600)">SSL</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <style>@media(min-width:1024px){.cart-columns{grid-template-columns:2fr 1fr}}</style>`;
}

/* ===================================================================
   CHECKOUT PAGE
   =================================================================== */

function pageCheckout() {
  ensureLocalDefaults({ placed: false, payment: 'cod', lastOrderId: null, lastOrderTotal: 0 });
  const lines = cartLines();
  const shipping = cartTotal() > 999 ? 0 : lines.length > 0 ? 49 : 0;
  const total = cartTotal() + shipping;

  if (LOCAL.placed) {
    return `<div class="page"><div class="order-success">
      <div class="ic">${svgIcon('checkCircle', 48)}</div>
      <h1 style="font-family:var(--font-display);font-size:30px;font-weight:700;color:var(--gray-900)">Order Placed Successfully!</h1>
      <p style="max-width:440px;color:var(--gray-600)">Thank you for your order. We've received your details and will contact you shortly to confirm delivery. A confirmation has been sent to your email.</p>
      <div class="order-box">
        <p style="font-size:14px;color:var(--gray-500)">Order Total</p>
        <p style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--primary-600)">&#8377;${LOCAL.lastOrderTotal}</p>
        <p style="margin-top:4px;font-size:12px;color:var(--gray-400)">Order ID: ${LOCAL.lastOrderId}</p>
      </div>
      <button class="btn-primary" data-action="navigate" data-path="/">Continue Shopping</button>
    </div></div>`;
  }

  if (lines.length === 0) {
    return `<div class="page"><div class="empty-state">
      <div class="ic">${svgIcon('bag', 40)}</div>
      <h1 style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gray-900)">Your Cart is Empty</h1>
      <p style="color:var(--gray-500)">Add some products before checking out.</p>
      <button class="btn-primary" data-action="navigate" data-path="/">Start Shopping</button>
    </div></div>`;
  }

  const payMethods = [
    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
    { id: 'upi', label: 'UPI Payment', desc: 'Pay via UPI (GPay, PhonePe, Paytm)' },
    { id: 'card', label: 'Credit / Debit Card', desc: 'Secure card payment' },
  ];

  return `
  <div class="page">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: 'Cart', path: '/cart' }, { label: 'Checkout' }])}
    <h1 style="margin-bottom:32px;font-size:30px;font-weight:700;color:var(--gray-900)">Checkout</h1>

    <form data-form="checkout" style="display:grid;gap:32px" class="checkout-columns">
      <div style="display:flex;flex-direction:column;gap:24px">
        <div class="form-box">
          <h2 style="font-size:18px;font-weight:700;color:var(--gray-900)">Contact Information</h2>
          <div class="form-grid">
            <input required name="name" placeholder="Full Name" class="input" />
            <input required type="email" name="email" placeholder="Email Address" class="input" />
            <input required type="tel" name="phone" placeholder="Phone Number" class="input" />
          </div>
        </div>

        <div class="form-box">
          <h2 style="font-size:18px;font-weight:700;color:var(--gray-900)">Shipping Address</h2>
          <div class="form-grid">
            <input required name="address" placeholder="Full Address" class="input full" />
            <input required name="city" placeholder="City" class="input" />
            <input required name="state" placeholder="State" class="input" />
            <input required name="pincode" placeholder="Pincode" class="input" />
          </div>
        </div>

        <div class="form-box">
          <h2 style="font-size:18px;font-weight:700;color:var(--gray-900)">Payment Method</h2>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
            ${payMethods.map((m) => `
            <label class="pay-option ${LOCAL.payment === m.id ? 'selected' : ''}">
              <input type="radio" name="payment" value="${m.id}" data-action="set-payment" ${LOCAL.payment === m.id ? 'checked' : ''} />
              <div><p class="lbl">${escapeHtml(m.label)}</p><p class="desc">${escapeHtml(m.desc)}</p></div>
            </label>`).join('')}
          </div>
        </div>
      </div>

      <div>
        <div class="cart-summary-box">
          <h2 style="font-size:18px;font-weight:700;color:var(--gray-900)">Order Summary</h2>
          <div style="margin-top:16px;max-height:256px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
            ${lines.map((l) => `
            <div class="checkout-mini-item">
              <img src="${l.product.images[0]}" alt="${escapeHtml(l.product.name)}" />
              <div style="flex:1">
                <p style="font-size:12px;font-weight:600;color:var(--gray-900)">${escapeHtml(l.product.name)}</p>
                <p style="font-size:12px;color:var(--gray-500)">Qty: ${l.qty}</p>
              </div>
              <span style="font-size:14px;font-weight:600;color:var(--gray-900)">&#8377;${l.product.price * l.qty}</span>
            </div>`).join('')}
          </div>
          <div style="margin-top:16px;border-top:1px solid var(--gray-100);padding-top:16px;display:flex;flex-direction:column;gap:8px;font-size:14px">
            <div class="summary-row"><span style="color:var(--gray-600)">Subtotal</span><span style="font-weight:600">&#8377;${cartTotal()}</span></div>
            <div class="summary-row"><span style="color:var(--gray-600)">Shipping</span><span style="font-weight:600">${shipping === 0 ? '<span style="color:var(--teal-600)">FREE</span>' : `&#8377;${shipping}`}</span></div>
            <div class="summary-row" style="border-top:1px solid var(--gray-100);padding-top:8px">
              <span style="font-family:var(--font-display);font-weight:700;color:var(--gray-900)">Total</span>
              <span style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--primary-600)">&#8377;${total}</span>
            </div>
          </div>
          <button type="submit" class="btn-primary btn-block" style="margin-top:20px">Place Order</button>
        </div>
      </div>
    </form>
  </div>
  <style>@media(min-width:1024px){.checkout-columns{grid-template-columns:2fr 1fr}}</style>`;
}

/* ===================================================================
   CONTACT / ABOUT / ACCOUNT PAGES
   =================================================================== */

function pageContact() {
  ensureLocalDefaults({ sent: false });
  const infoItems = [
    { icon: 'mapPin', title: 'Visit Our Store', lines: ['nhi pata, pata nhi', 'Ajmer, India - 305001'] },
    { icon: 'phone', title: 'Call Us', lines: ['+91 77xxxxxxx4', '+91 XXXXXXXXXX'] },
    { icon: 'mail', title: 'Email Us', lines: ['Gangor123@email.com'] },
    { icon: 'clock', title: 'Store Hours', lines: ['Mon - Sat: 10 AM - 9 PM', 'Sunday: 11 AM - 6 PM'] },
  ];
  return `
  <div class="page">
    <div style="text-align:center">
      <span class="badge badge-primary">Get in Touch</span>
      <h1 style="margin-top:12px;font-size:34px;font-weight:700;color:var(--gray-900)">Contact Us</h1>
      <p style="margin:12px auto 0;max-width:560px;color:var(--gray-600)">Have a question, feedback, or need help with an order? We'd love to hear from you!</p>
    </div>

    <div style="margin-top:48px;display:grid;gap:32px" class="contact-columns">
      <div style="display:flex;flex-direction:column;gap:16px">
        ${infoItems.map((it) => `
        <div class="contact-info-card">
          <div class="ic">${svgIcon(it.icon, 22)}</div>
          <div>
            <h3 style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--gray-900)">${escapeHtml(it.title)}</h3>
            ${it.lines.map((l) => `<p style="margin-top:2px;font-size:14px;color:var(--gray-600)">${escapeHtml(l)}</p>`).join('')}
          </div>
        </div>`).join('')}
        <a href="#" class="whatsapp-btn">${svgIcon('message', 20)} Chat on WhatsApp</a>
      </div>

      <div class="contact-form-col">
        <div class="form-box">
          <h2 style="font-size:20px;font-weight:700;color:var(--gray-900)">Send Us a Message</h2>
          <p style="margin-top:4px;font-size:14px;color:var(--gray-500)">We'll get back to you within 24 hours.</p>
          ${LOCAL.sent ? `<div style="margin-top:16px;display:flex;align-items:center;gap:12px;border-radius:12px;background:var(--teal-50);padding:16px;color:var(--teal-700)">${svgIcon('send', 20)}<p style="font-size:14px;font-weight:500">Thank you! Your message has been sent successfully.</p></div>` : ''}
          <form data-form="contact" style="margin-top:24px;display:flex;flex-direction:column;gap:16px">
            <div class="form-grid" style="margin-top:0">
              <input required name="name" placeholder="Your Name" class="input" />
              <input required type="email" name="email" placeholder="Your Email" class="input" />
            </div>
            <input required name="subject" placeholder="Subject" class="input" />
            <textarea required name="message" placeholder="Your Message" rows="5" class="input" style="resize:none"></textarea>
            <button type="submit" class="btn-primary" style="align-self:flex-start">${svgIcon('send', 16)} Send Message</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  <style>@media(min-width:1024px){.contact-columns{grid-template-columns:1fr 2fr}}</style>`;
}

function pageAbout() {
  const values = [
    { icon: 'award', title: 'Quality First', desc: 'Every product is hand-checked for quality before it reaches you.' },
    { icon: 'heart', title: 'Customer Love', desc: 'Your happiness is our priority. We go the extra mile, always.' },
    { icon: 'bag', title: 'Affordable Luxury', desc: 'Premium products at prices that make sense for every budget.' },
    { icon: 'users', title: 'Community Rooted', desc: 'Proudly local. We know our customers by name, not by number.' },
  ];
  return `
  <div class="page">
    <div class="about-hero">
      <div class="ic">${svgIcon('sparkles', 32)}</div>
      <h1 style="margin-top:20px;font-size:34px;font-weight:700">About Gangor fashion &amp; Cosmetics</h1>
      <p style="margin:16px auto 0;max-width:640px;opacity:.9">Your trusted neighbourhood destination for beautiful Rakhi, jewellery, bangles, cosmetics, and fashion accessories — celebrating every occasion with quality and style.</p>
    </div>

    <div style="margin-top:64px;display:grid;gap:40px;align-items:center" class="about-columns">
      <div>
        <h2 style="font-size:28px;font-weight:700;color:var(--gray-900)">Our Story</h2>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:16px;color:var(--gray-600)">
          <p>Gangor Fashion &amp; Cosmetics began as a small family-run shop with a simple dream — to bring beautiful, affordable jewellery and cosmetics to our local community. What started as a tiny corner store has grown into a beloved destination for festive shopping.</p>
          <p>From the sacred threads of Rakhi to the sparkle of diamond rings, from vibrant bangles to the perfect shade of lipstick — we carefully curate every product with love and attention to detail. We believe everyone deserves to feel beautiful, regardless of their budget.</p>
          <p>Today, we are proud to serve thousands of happy customers across the city, and now we're bringing our collection online so you can shop from the comfort of your home.</p>
        </div>
      </div>
      <div style="overflow:hidden;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.15)">
        <img src="https://images.pexels.com/photos/17261596/pexels-photo-17261596.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Indian woman in traditional jewellery" style="aspect-ratio:4/3;width:100%;object-fit:cover" />
      </div>
    </div>

    <div style="margin-top:64px">
      <h2 style="text-align:center;font-size:28px;font-weight:700;color:var(--gray-900)">Our Values</h2>
      <div style="margin-top:40px" class="why-grid">
        ${values.map((v) => `
        <div class="value-card">
          <div class="ic">${svgIcon(v.icon, 24)}</div>
          <h3 style="margin-top:16px;font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--gray-900)">${escapeHtml(v.title)}</h3>
          <p style="margin-top:8px;font-size:14px;color:var(--gray-600)">${escapeHtml(v.desc)}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="margin-top:64px;border-radius:24px;background:var(--gray-50);padding:48px 24px;text-align:center">
      <h2 style="font-size:24px;font-weight:700;color:var(--gray-900)">Ready to Explore Our Collection?</h2>
      <p style="margin:8px auto 0;max-width:440px;color:var(--gray-600)">Discover beautiful pieces for every occasion — from festive Rakhi to everyday cosmetics.</p>
      <button class="btn-primary" style="margin-top:24px" data-action="navigate" data-path="/">Start Shopping</button>
    </div>
  </div>
  <style>@media(min-width:1024px){.about-columns{grid-template-columns:1fr 1fr}}</style>`;
}

function pageAccount() {
  const stats = [
    { icon: 'cart', label: 'Cart Items', value: cartCount(), path: '/cart' },
    { icon: 'heart', label: 'Wishlist Items', value: WISHLIST.length, path: '/wishlist' },
    { icon: 'package', label: 'Total Orders', value: 0, path: null },
  ];
  return `
  <div class="page" style="max-width:760px">
    <div style="text-align:center">
      <div class="account-avatar">${svgIcon('user', 40)}</div>
      <h1 style="margin-top:20px;font-size:30px;font-weight:700;color:var(--gray-900)">My Account</h1>
      <p style="margin-top:8px;color:var(--gray-600)">Welcome back! Manage your account here.</p>
    </div>

    <div class="account-box" style="margin-top:40px">
      <h2 style="font-size:20px;font-weight:700;color:var(--gray-900)">Sign In to Continue</h2>
      <p style="margin:8px auto 0;max-width:440px;font-size:14px;color:var(--gray-500)">Sign in to track your orders, save your wishlist, and enjoy a personalised shopping experience.</p>
      <div style="margin-top:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px" class="account-actions">
        <button class="btn-primary">Sign In</button>
        <button class="btn-outline">Create Account</button>
      </div>
      <p style="margin-top:16px;font-size:12px;color:var(--gray-400)">This is a demo account page. Authentication will be enabled in a future update.</p>
    </div>

    <div style="margin-top:32px" class="grid-3">
      ${stats.map((s) => `
      <button class="stat-btn" ${s.path ? `data-action="navigate" data-path="${s.path}"` : ''}>
        <div class="ic">${svgIcon(s.icon, 22)}</div>
        <p style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gray-900)">${s.value}</p>
        <p style="font-size:12px;color:var(--gray-500)">${escapeHtml(s.label)}</p>
      </button>`).join('')}
    </div>
  </div>
  <style>@media(min-width:640px){.account-actions{flex-direction:row}}</style>`;
}

function pageWishlist() {
  const items = WISHLIST.map(findProduct).filter(Boolean);
  return `
  <div class="page">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: 'Wishlist' }])}
    <h1 style="margin-bottom:24px;font-size:30px;font-weight:700;color:var(--gray-900)">My Wishlist <span style="font-size:16px;font-weight:400;color:var(--gray-400)">(${items.length} items)</span></h1>
    ${items.length === 0 ? `
    <div class="empty-state">
      <div class="ic">${svgIcon('heart', 40)}</div>
      <p style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--gray-900)">Your wishlist is empty</p>
      <p style="color:var(--gray-500)">Save items you love by tapping the heart icon.</p>
      <button class="btn-primary" data-action="navigate" data-path="/">Start Shopping</button>
    </div>` : productGrid(items)}
  </div>`;
}

function pageInfo(title, body) {
  return `
  <div class="page" style="max-width:760px">
    ${breadcrumb([{ label: 'Home', path: '/' }, { label: title }])}
    <h1 style="margin-bottom:16px;font-size:30px;font-weight:700;color:var(--gray-900)">${escapeHtml(title)}</h1>
    <div style="color:var(--gray-600);line-height:1.8;font-size:14px">${body}</div>
    <button class="btn-primary" style="margin-top:24px" data-action="navigate" data-path="/">Back to Home</button>
  </div>`;
}

function pageNotFound() {
  return `<div class="page"><div class="empty-state">
    <h1 style="font-family:var(--font-display);font-size:64px;font-weight:700;color:var(--primary-500)">404</h1>
    <h2 style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gray-900)">Page Not Found</h2>
    <p style="color:var(--gray-500)">The page you are looking for doesn't exist or has been moved.</p>
    <button class="btn-primary" data-action="navigate" data-path="/">Back to Home</button>
  </div></div>`;
}

/* ===================================================================
   ROUTING
   =================================================================== */

function renderPage(path) {
  if (path.startsWith('/product/')) return pageProductDetail(path.replace('/product/', ''));

  if (path === '/category/rakhi') return pageCategory('rakhi');
  if (path === '/category/bangles') return pageCategory('bangles');
  if (path === '/category/jewellery') return pageCategory('jewellery');
  if (path === '/category/rings-bracelets') return pageCategory('rings');
  if (path === '/category/rings') return pageCategory('rings');
  if (path === '/category/bracelets') return pageCategory('bracelets');
  if (path === '/category/cosmetics') return pageCategory('cosmetics');
  if (path === '/category/all') return pageCategory('all');

  if (path === '/new-arrivals') return pageCategory('new');
  if (path === '/offers') return pageCategory('offers');

  if (path === '/cart') return pageCart();
  if (path === '/checkout') return pageCheckout();
  if (path === '/about') return pageAbout();
  if (path === '/contact') return pageContact();
  if (path === '/account') return pageAccount();
  if (path === '/wishlist') return pageWishlist();

  if (path === '/delivery') return pageInfo('Delivery Information', '<p>We deliver across India within 4-7 business days. Orders above &#8377;999 ship free; a flat &#8377;49 shipping fee applies below that. You will receive a tracking update once your order is dispatched.</p>');
  if (path === '/returns') return pageInfo('Return Policy', '<p>Not happy with your order? We accept returns and exchanges within 7 days of delivery, provided the item is unused and in its original packaging. Reach out to our support team to start a return.</p>');
  if (path === '/faq') return pageInfo('Frequently Asked Questions', '<p><strong>How long does delivery take?</strong> Typically 4-7 business days.</p><p style="margin-top:12px"><strong>Do you offer Cash on Delivery?</strong> Yes, along with UPI and card payments.</p><p style="margin-top:12px"><strong>Can I return a product?</strong> Yes, within 7 days of delivery.</p>');

  if (path === '/' || path === '') return pageHome();
  return pageNotFound();
}

/* ===================================================================
   MAIN RENDER
   =================================================================== */

function render() {
  const path = getPath();
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader(path)}
    <main>${renderPage(path)}</main>
    ${renderFooter()}
    ${renderCartDrawer()}
    ${renderWishlistDrawer()}
    ${renderSearchOverlay()}
    <div id="toast-root">${TOAST ? `<div class="toast">${escapeHtml(TOAST)}</div>` : ''}</div>
  `;
  applyScrollState();
  if (UI.searchOpen) attachSearchInputHandler();
}

function applyScrollState() {
  const header = document.getElementById('site-header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', applyScrollState);

function attachSearchInputHandler() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.addEventListener('input', () => {
    LOCAL.searchQuery = input.value;
    const q = input.value.trim().toLowerCase();
    const results = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8) : [];
    const box = document.getElementById('search-results');
    if (box) box.innerHTML = searchResultsHtml(q, results);
  });
}

/* ===================================================================
   EVENT DELEGATION
   =================================================================== */

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case 'navigate':
      e.preventDefault();
      navigate(el.dataset.path);
      break;
    case 'add-to-cart':
      addToCart(el.dataset.id, 1);
      break;
    case 'add-to-cart-qty': {
      const qty = LOCAL.qty || 1;
      addToCart(el.dataset.id, qty);
      break;
    }
    case 'buy-now': {
      const qty = LOCAL.qty || 1;
      addToCart(el.dataset.id, qty);
      navigate('/checkout');
      break;
    }
    case 'remove-from-cart':
      removeFromCart(el.dataset.id);
      break;
    case 'update-qty':
      updateQty(el.dataset.id, parseInt(el.dataset.qty, 10));
      break;
    case 'toggle-wishlist':
      toggleWishlist(el.dataset.id);
      break;
    case 'set-qty':
      LOCAL.qty = Math.max(1, parseInt(el.dataset.qty, 10));
      render();
      break;
    case 'set-active-image':
      LOCAL.activeImage = parseInt(el.dataset.index, 10);
      render();
      break;

    case 'open-cart': UI.cartOpen = true; render(); break;
    case 'close-cart': UI.cartOpen = false; render(); break;
    case 'close-cart-and-home': UI.cartOpen = false; navigate('/'); break;
    case 'goto-checkout': UI.cartOpen = false; navigate('/checkout'); break;
    case 'goto-cart-page': UI.cartOpen = false; navigate('/cart'); break;

    case 'open-wishlist': UI.wishlistOpen = true; render(); break;
    case 'close-wishlist': UI.wishlistOpen = false; render(); break;
    case 'close-wishlist-and-home': UI.wishlistOpen = false; navigate('/'); break;
    case 'navigate-close-wishlist': UI.wishlistOpen = false; navigate(el.dataset.path); break;

    case 'open-search': UI.searchOpen = true; LOCAL.searchQuery = LOCAL.searchQuery || ''; render(); break;
    case 'close-search': UI.searchOpen = false; render(); break;
    case 'navigate-close-search': UI.searchOpen = false; navigate(el.dataset.path); break;

    case 'toggle-mobile-menu': UI.mobileMenuOpen = !UI.mobileMenuOpen; render(); break;
    case 'toggle-mobile-filters': LOCAL.showMobileFilters = !LOCAL.showMobileFilters; render(); break;
    case 'clear-filters':
      LOCAL.filterTypes = []; LOCAL.priceIdx = null; LOCAL.inStock = false; render();
      break;
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'filter-type') {
    ensureLocalDefaults({ filterTypes: [] });
    const v = el.value;
    if (el.checked) LOCAL.filterTypes = [...LOCAL.filterTypes, v];
    else LOCAL.filterTypes = LOCAL.filterTypes.filter((t) => t !== v);
    render();
  } else if (action === 'filter-price') {
    LOCAL.priceIdx = parseInt(el.value, 10);
    render();
  } else if (action === 'filter-stock') {
    LOCAL.inStock = el.checked;
    render();
  } else if (action === 'change-sort') {
    LOCAL.sort = el.value;
    render();
  } else if (action === 'set-payment') {
    LOCAL.payment = el.value;
    render();
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const type = form.dataset.form;

  if (type === 'newsletter') {
    const input = form.querySelector('input');
    if (input && input.value.trim()) {
      showToast('Thank you for subscribing!');
      input.value = '';
    }
  } else if (type === 'contact') {
    LOCAL.sent = true;
    form.reset();
    render();
    setTimeout(() => { LOCAL.sent = false; render(); }, 5000);
  } else if (type === 'checkout') {
    const orderId = 'SF' + Math.floor(Math.random() * 100000);
    LOCAL.lastOrderId = orderId;
    LOCAL.lastOrderTotal = cartTotal() + (cartTotal() > 999 ? 0 : 49);
    clearCart();
    LOCAL.placed = true;
    render();
  }
});

/* ===================================================================
   INIT
   =================================================================== */
if (!window.location.hash) window.location.hash = '#/';
render();
