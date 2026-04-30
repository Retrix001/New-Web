const fallbackSite = {
  brand: { logoText: "ATHORA", logoMark: "A", logoImage: "" },
  announcement: { show: true, text: "Welcome to ATHORA" },
  nav: [
    { label: "Home", url: "/", show: true },
    { label: "Shop", url: "/collection", show: true },
    { label: "About", url: "/about", show: true },
    { label: "Blog", url: "/blog", show: true },
    { label: "Contact", url: "/contact", show: true }
  ],
  theme: { primary: "#3A0088", accent: "#4A2B3D", buttonRadius: "50px", cardRadius: "22px", animations: true },
  home: { sections: [] },
  categories: [],
  footer: { show: true, blocks: [], columns: [], social: [], copyright: "Copyright 2026 ATHORA." },
  about: { title: "Born to move, designed to inspire", intro: "Premium activewear for every way you move.", values: [] },
  contact: { email: "hello@athora.com", phone: "+1 (555) 234-1290", address: "New York, NY" }
};

const fallbackProducts = [];
const fallbackBlogs = [];

const state = {
  site: fallbackSite,
  products: fallbackProducts,
  blogs: fallbackBlogs,
  filter: "All",
  search: "",
  cart: readCart()
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const params = () => new URLSearchParams(location.search);
const money = value => `$${Number(value || 0).toFixed(2)}`;
const visible = item => item && item.show !== false;
const img = src => src || "assets/hero.png";
const esc = value => String(value ?? "").replace(/[&<>"']/g, match => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
}[match]));

function cleanUrl(url = "/") {
  if (url === "/index.html") return "/";
  return url.replace(".html", "");
}

function currentRoute() {
  const path = cleanUrl(location.pathname);
  if (path === "/" || path === "") return "home";
  return path.replace("/", "") || "home";
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    return data || fallback;
  } catch {
    return fallback;
  }
}

async function init() {
  const [site, products, blogs] = await Promise.all([
    fetchJson("/api/site", fallbackSite),
    fetchJson("/api/products", fallbackProducts),
    fetchJson("/api/blogs", fallbackBlogs)
  ]);
  state.site = { ...fallbackSite, ...site };
  state.products = Array.isArray(products) ? products : fallbackProducts;
  state.blogs = Array.isArray(blogs) ? blogs : fallbackBlogs;
  state.filter = params().get("filter") || "All";
  state.search = params().get("q") || "";
  applyTheme();
  renderChrome();
  renderPage();
  bindGlobalEvents();
  refreshCartCount();
}

function applyTheme() {
  const theme = state.site.theme || {};
  document.documentElement.style.setProperty("--primary", theme.primary || "#3A0088");
  document.documentElement.style.setProperty("--accent", theme.accent || "#4A2B3D");
  document.documentElement.style.setProperty("--radius-button", theme.buttonRadius || "50px");
  document.documentElement.style.setProperty("--radius-card", theme.cardRadius || "22px");
  document.body.classList.toggle("no-motion", theme.animations === false);
}

function renderChrome() {
  const announcement = $("#announcement");
  announcement.innerHTML = state.site.announcement?.show
    ? `<div class="announcement">${esc(state.site.announcement.text)}</div>`
    : "";

  const route = currentRoute();
  const brand = state.site.brand || {};
  const logo = brand.logoImage
    ? `<img src="/${esc(brand.logoImage).replace(/^\/+/, "")}" alt="${esc(brand.logoText || "ATHORA")}">`
    : `<span class="brand-mark">${esc(brand.logoMark || "A")}</span>`;
  const navItems = (state.site.nav || []).filter(visible).map(item => {
    const url = cleanUrl(item.url || "/");
    const active = route === "home" ? url === "/" : url.includes(route);
    return `<a class="${active ? "active" : ""}" href="${esc(url)}">${esc(item.label)}</a>`;
  }).join("");

  $("#site-header").innerHTML = `
    <div class="header-pill">
      <a class="brand" href="/">${logo}<span>${esc(brand.logoText || "ATHORA")}</span></a>
      <nav class="nav" id="nav-menu">${navItems}</nav>
      <div class="header-actions">
        <button class="icon-btn mobile-toggle" data-action="menu" aria-label="Open menu">M</button>
        <a class="icon-btn" href="/search" aria-label="Search">S</a>
        <a class="icon-btn" href="/account" aria-label="Account">A</a>
        <a class="icon-btn" href="/cart" aria-label="Cart">C</a><span class="cart-count" id="cart-count">0</span>
      </div>
    </div>`;

  renderFooter();
}

function renderFooter() {
  const footer = state.site.footer || {};
  if (footer.show === false) {
    $("#site-footer").innerHTML = "";
    return;
  }
  const blocks = (footer.blocks || []).filter(visible).map(block => `
    <div class="feature">
      <h3>${esc(block.title)}</h3>
      <p>${esc(block.text)}</p>
    </div>`).join("");
  const columns = (footer.columns || []).filter(visible).map(column => `
    <div class="footer-col">
      <h3>${esc(column.title)}</h3>
      ${(column.links || []).map(link => `<a href="${esc(cleanUrl(link.url || "#"))}">${esc(link.label)}</a>`).join("")}
    </div>`).join("");
  const social = (footer.social || []).map(item => `<a href="${esc(item.url || "#")}" aria-label="${esc(item.label)}">${esc(item.icon || item.label?.[0] || "s")}</a>`).join("");
  $("#site-footer").className = "site-footer";
  $("#site-footer").innerHTML = `
    ${blocks ? `<div class="footer-features"><div class="container features-grid">${blocks}</div></div>` : ""}
    <div class="container footer-main">
      <div>
        <a class="brand" href="/"><span class="brand-mark">${esc(state.site.brand?.logoMark || "A")}</span><span>${esc(state.site.brand?.logoText || "ATHORA")}</span></a>
        ${footer.newsletter !== false ? `
          <h2 style="margin-top:24px">${esc(footer.newsletterTitle || "Sign up now")}</h2>
          <p>${esc(footer.newsletterText || "")}</p>
          <form class="newsletter" data-action="newsletter"><input type="email" required placeholder="Enter your email"><button class="btn light" type="submit">Subscribe</button></form>` : ""}
        <div class="social">${social}</div>
      </div>
      ${columns}
    </div>
    <div class="container footer-bottom">${esc(footer.copyright || "")}</div>`;
}

function renderPage() {
  const route = currentRoute();
  if (route === "collection") return renderCollection();
  if (route === "product") return renderProductDetail();
  if (route === "about") return renderAbout();
  if (route === "contact") return renderContact();
  if (route === "blog") return renderBlog();
  if (route === "cart") return renderCart();
  if (route === "account") return renderAccount();
  if (route === "search") return renderSearch();
  renderHome();
}

function renderHome() {
  const sections = (state.site.home?.sections || []).filter(visible);
  $("#app").className = "page";
  $("#app").innerHTML = sections.map(section => {
    if (section.type === "hero") return heroSection(section);
    if (section.type === "categories") return categoriesSection(section);
    if (section.type === "banner") return bannerSection(section);
    if (section.type === "marquee") return marqueeSection(section);
    if (section.type === "products") return productsSection(section);
    if (section.type === "look") return lookSection(section);
    if (section.type === "offer") return offerSection(section);
    if (section.type === "activity") return activitySection(section);
    if (section.type === "reviews") return reviewsSection(section);
    if (section.type === "stories") return storiesSection(section);
    return textSection(section);
  }).join("");
  initHero();
  initCountdowns();
  revealOnScroll();
}

function heroSection(section) {
  const slides = (section.slides || [section.image || "assets/hero.png"]).map((slide, index) =>
    `<div class="hero-slide ${index === 0 ? "active" : ""}" style="background-image:url('/${esc(slide).replace(/^\/+/, "")}')"></div>`).join("");
  const dots = (section.slides || [section.image || "assets/hero.png"]).map((_, index) =>
    `<button class="dot ${index === 0 ? "active" : ""}" data-slide="${index}" aria-label="Hero slide ${index + 1}"></button>`).join("");
  return `
    <section class="hero">
      <div class="hero-media" data-hero>${slides}</div>
      <div class="container hero-content">
        <div class="hero-grid">
          <div class="hero-copy reveal">
            <p class="eyebrow">${esc(section.summary || "Premium performance wear")}</p>
            <h1>${esc(section.title)}</h1>
            <p>${esc(section.subtitle)}</p>
            <a class="btn light" href="${esc(cleanUrl(section.buttonLink || "/collection"))}">${esc(section.buttonText || "Shop now")}</a>
          </div>
          <div class="hero-panel reveal">
            <strong>ATHORA edit</strong>
            <p>Soft compression, sculpted lines and pieces that work beyond the workout.</p>
            <div class="hero-controls">
              <button class="icon-btn" data-hero-prev aria-label="Previous slide">P</button>
              ${dots}
              <button class="icon-btn" data-hero-next aria-label="Next slide">N</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function categoriesSection(section) {
  const cards = (state.site.categories || []).filter(visible).map(category => `
    <a class="category-card" href="/collection?category=${esc(category.id)}">
      <img src="/${esc(img(category.image))}" alt="${esc(category.name)}">
      <span>${esc(category.name)}</span>
    </a>`).join("");
  return `
    <section class="section">
      <div class="container category-strip reveal">
        <div>
          <p class="eyebrow">Collections</p>
          <h2>${esc(section.title)}</h2>
          <p class="lead">${esc(section.subtitle || "")}</p>
          <a class="btn" href="${esc(cleanUrl(section.buttonLink || "/collection"))}">${esc(section.buttonText || "View all")}</a>
        </div>
        <div class="horizontal-cards">${cards}</div>
      </div>
    </section>`;
}

function bannerSection(section) {
  return `
    <section class="section tight">
      <div class="container">
        <div class="banner reveal">
          <img src="/${esc(img(section.image))}" alt="${esc(section.title)}">
          <div class="banner-content">
            <p class="eyebrow">Performance</p>
            <h2>${esc(section.title)}</h2>
            <p class="lead" style="color:rgba(255,255,255,.84); margin:16px auto 24px">${esc(section.subtitle || "")}</p>
            <a class="btn light" href="${esc(cleanUrl(section.buttonLink || "/collection"))}">${esc(section.buttonText || "Shop now")}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function marqueeSection(section) {
  const items = [...(section.items || []), ...(section.items || [])].map(item => `<span>${esc(item)}</span>`).join("");
  return `<section class="marquee" aria-label="Brand statements"><div class="marquee-track">${items}</div></section>`;
}

function productsSection(section, products = state.products.filter(visible).slice(0, 8)) {
  return `
    <section class="section">
      <div class="container reveal">
        <div class="section-head">
          <p class="eyebrow">Shop</p>
          <h2>${esc(section.title || "Products")}</h2>
          <p class="lead">${esc(section.subtitle || "")}</p>
        </div>
        <div class="toolbar">
          <div class="chips" data-filter-group>
            ${(section.filters || ["All", "Featured", "New", "Bestseller", "Sale"]).map(filter => `<button class="chip ${filter === state.filter ? "active" : ""}" data-filter="${esc(filter)}">${esc(filter)}</button>`).join("")}
          </div>
          <input class="search-field" data-product-search value="${esc(state.search)}" placeholder="Search products">
        </div>
        <div class="grid" data-product-grid>${renderProductCards(filterProducts(products))}</div>
      </div>
    </section>`;
}

function lookSection(section) {
  const product = state.products.find(item => item.id === section.productId) || state.products.find(visible) || {};
  return `
    <section class="section">
      <div class="container look reveal">
        <div class="look-image">
          <img src="/${esc(img(section.image))}" alt="${esc(section.title)}">
          <span class="hotspot one"></span><span class="hotspot two"></span>
          <div class="look-content" style="position:absolute;left:32px;bottom:32px;color:#fff;max-width:520px">
            <p class="eyebrow" style="color:#fff">Shop the look</p>
            <h2>${esc(section.title)}</h2>
          </div>
        </div>
        <div class="look-side">
          <div>
            <h2>${esc(product.name || section.title)}</h2>
            <p class="lead">${esc(section.subtitle || product.summary || "")}</p>
            <a class="btn" href="${esc(cleanUrl(section.buttonLink || `/product?id=${product.id || ""}`))}">${esc(section.buttonText || "View outfit")}</a>
          </div>
          ${product.id ? renderProductCards([product]) : ""}
        </div>
      </div>
    </section>`;
}

function offerSection(section) {
  return `
    <section class="section tight">
      <div class="container">
        <div class="offer reveal" data-countdown="${esc(section.endsAt || "")}">
          <img src="/${esc(img(section.image))}" alt="${esc(section.title)}">
          <div class="offer-content">
            <p class="eyebrow" style="color:#fff">Limited-time deals</p>
            <h2>${esc(section.title)}</h2>
            <p class="lead" style="color:rgba(255,255,255,.82)">${esc(section.subtitle || "")}</p>
            <div class="countdown">
              ${["Days", "Hours", "Minutes", "Seconds"].map(label => `<div class="count-box"><strong data-count="${label.toLowerCase()}">00</strong><span>${label}</span></div>`).join("")}
            </div>
            <a class="btn light" href="${esc(cleanUrl(section.buttonLink || "/collection"))}">${esc(section.buttonText || "Shop now")}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function activitySection(section) {
  const images = ["assets/activity-run.png", "assets/activity-gym.png", "assets/activity-pilates.png", "assets/activity-swim.png", "assets/activity-casual.png"];
  const labels = ["Run", "Gym", "Pilates", "Swim", "Casual"];
  return `
    <section class="section" style="background:var(--soft)">
      <div class="container reveal">
        <div class="section-head">
          <p class="eyebrow">Activity</p>
          <h2>${esc(section.title)}</h2>
          <p class="lead">${esc(section.subtitle || "")}</p>
        </div>
        <div class="activity-grid">
          ${labels.map((label, index) => `
            <a class="activity-card" href="/collection?q=${encodeURIComponent(label)}">
              <img src="/${images[index]}" alt="${label}">
              <div><h3>${label}</h3><p>Purpose-built pieces for this routine.</p></div>
            </a>`).join("")}
        </div>
      </div>
    </section>`;
}

function reviewsSection(section) {
  const items = (section.items || []).map(item => `
    <article class="review-card">
      <div class="stars">${"*".repeat(Number(item.rating || 5))}</div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.text)}</p>
      <strong>${esc(item.name)}</strong>
      <p class="brand-tag">${esc(item.product)} - ${money(item.price)}</p>
    </article>`).join("");
  return `
    <section class="section">
      <div class="container reveal">
        <div class="section-head">
          <p class="eyebrow">Reviews</p>
          <h2>${esc(section.title)}</h2>
          <p class="lead">${esc(section.subtitle || "")}</p>
        </div>
        <div class="reviews">${items}</div>
      </div>
    </section>`;
}

function storiesSection(section) {
  return `
    <section class="section tight">
      <div class="container reveal">
        <div class="toolbar">
          <div><p class="eyebrow">Journal</p><h2>${esc(section.title)}</h2><p class="lead">${esc(section.subtitle || "")}</p></div>
          <a class="btn ghost" href="${esc(cleanUrl(section.buttonLink || "/blog"))}">${esc(section.buttonText || "Read all")}</a>
        </div>
        <div class="blog-grid">${renderBlogCards(state.blogs.filter(visible).slice(0, 3))}</div>
      </div>
    </section>`;
}

function textSection(section) {
  return `<section class="section"><div class="container reveal"><h2>${esc(section.title || "ATHORA")}</h2><p class="lead">${esc(section.subtitle || section.summary || "")}</p><a class="btn" href="${esc(cleanUrl(section.buttonLink || "/collection"))}">${esc(section.buttonText || "Shop now")}</a></div></section>`;
}

function renderCollection() {
  state.filter = params().get("filter") || state.filter || "All";
  state.search = params().get("q") || "";
  const category = params().get("category") || "all";
  const categories = (state.site.categories || []).filter(visible);
  const base = state.products.filter(product => visible(product) && (category === "all" || !category || product.category === category || (product.collections || []).includes(category)));
  $("#app").innerHTML = `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Catalogue</p>
        <h1>Collection</h1>
        <p class="lead">Filter ATHORA essentials by activity, fit and product status.</p>
      </div>
    </section>
    <section class="section tight">
      <div class="container collection-layout">
        <aside class="filter-panel">
          <h3>Collections</h3>
          ${categories.map(item => `<label><input type="radio" name="category" value="${esc(item.id)}" ${item.id === category ? "checked" : ""}> ${esc(item.name)}</label>`).join("")}
          <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
          <h3>Sort</h3>
          <select class="search-field" data-sort>
            <option value="featured">Featured</option>
            <option value="low">Price low to high</option>
            <option value="high">Price high to low</option>
            <option value="new">Newest</option>
          </select>
        </aside>
        <div>
          <div class="toolbar">
            <div class="chips" data-filter-group>${["All", "Featured", "New", "Bestseller", "Sale"].map(filter => `<button class="chip ${filter === state.filter ? "active" : ""}" data-filter="${filter}">${filter}</button>`).join("")}</div>
            <input class="search-field" data-product-search value="${esc(state.search)}" placeholder="Search catalogue">
          </div>
          <div class="grid" data-product-grid>${renderProductCards(filterProducts(base))}</div>
        </div>
      </div>
    </section>`;
}

function renderProductCards(products) {
  if (!products.length) return `<div class="empty span-2">No products found.</div>`;
  return products.map(product => {
    const images = product.images || [];
    const badge = product.sale ? "Sale" : product.isNew ? "New" : product.bestseller ? "Best" : product.featured ? "Featured" : "";
    return `
      <article class="product-card" data-product-id="${esc(product.id)}">
        <a class="product-link" href="/product?id=${esc(product.id)}">
          <div class="product-media">
            ${badge ? `<span class="badge">${esc(badge)}</span>` : ""}
            <img src="/${esc(img(images[0]))}" alt="${esc(product.name)}">
            <img src="/${esc(img(images[1] || images[0]))}" alt="${esc(product.name)} alternate">
          </div>
          <div class="product-info">
            <p class="brand-tag">${esc(product.brand)}</p>
            <h3 class="product-title">${esc(product.name)}</h3>
            ${priceHtml(product)}
            <div class="swatches">${(product.colors || []).map(color => `<span class="swatch" title="${esc(color.name)}" style="background:${esc(color.hex)}"></span>`).join("")}</div>
          </div>
        </a>
        <button class="btn light quick" data-quick="${esc(product.id)}">Quick view</button>
      </article>`;
  }).join("");
}

function priceHtml(product) {
  return `<div class="price">${product.salePrice ? `<span>${money(product.salePrice)}</span><del>${money(product.price)}</del>` : `<span>${money(product.price)}</span>`}</div>`;
}

function filterProducts(products) {
  let list = [...products];
  const filter = String(state.filter || "All").toLowerCase();
  const query = String(state.search || "").trim().toLowerCase();
  if (filter === "featured") list = list.filter(item => item.featured);
  if (filter === "new") list = list.filter(item => item.isNew || (item.tags || []).includes("new"));
  if (filter === "bestseller") list = list.filter(item => item.bestseller);
  if (filter === "sale") list = list.filter(item => item.sale || item.salePrice);
  if (query) {
    list = list.filter(item => [item.name, item.brand, item.summary, item.category, ...(item.tags || [])].join(" ").toLowerCase().includes(query));
  }
  return list;
}

function renderProductDetail() {
  const id = params().get("id") || state.products[0]?.id;
  const product = state.products.find(item => item.id === id) || state.products.find(visible);
  if (!product) {
    $("#app").innerHTML = `<div class="container section"><div class="empty">Product not found.</div></div>`;
    return;
  }
  const images = product.images || [];
  $("#app").innerHTML = `
    <section class="section tight">
      <div class="container product-detail">
        <div class="gallery">
          <div class="thumbs">${images.map((image, index) => `<button class="${index === 0 ? "active" : ""}" data-gallery="${esc(image)}"><img src="/${esc(image)}" alt="${esc(product.name)} thumbnail"></button>`).join("")}</div>
          <img class="main-product-image" id="main-product-image" src="/${esc(img(images[0]))}" alt="${esc(product.name)}">
        </div>
        <div class="product-buy">
          <p class="brand-tag">${esc(product.brand)} - ${esc(product.sku)}</p>
          <h1 style="font-size:clamp(38px,5vw,76px)">${esc(product.name)}</h1>
          <p class="lead">${esc(product.summary)}</p>
          ${priceHtml(product)}
          <div class="stock">Hurry, only ${Number(product.stock || 0)} items left in stock.</div>
          <strong>Color</strong><div class="option-row">${(product.colors || []).map((color, index) => `<button class="option ${index === 0 ? "active" : ""}" style="background:${esc(color.hex)}" title="${esc(color.name)}"></button>`).join("")}</div>
          <strong>Size</strong><div class="option-row">${(product.sizes || []).map((size, index) => `<button class="option ${index === 0 ? "active" : ""}">${esc(size)}</button>`).join("")}</div>
          <button class="btn" style="width:100%" data-add="${esc(product.id)}">Add to cart</button>
          <button class="btn ghost" style="width:100%;margin-top:12px" data-buy="${esc(product.id)}">Buy it now</button>
          <details style="margin-top:24px" open><summary><strong>Description</strong></summary><p>${esc(product.description)}</p></details>
          <details><summary><strong>Care and fit</strong></summary><p>Machine wash cold. Designed for sculpted support and easy layering.</p></details>
        </div>
      </div>
    </section>
    <section class="section tight"><div class="container"><h2>You may also like</h2><div class="grid" style="margin-top:24px">${renderProductCards(state.products.filter(item => item.id !== product.id && visible(item)).slice(0, 4))}</div></div></section>`;
}

function renderAbout() {
  const about = state.site.about || {};
  $("#app").innerHTML = `
    <section class="section tight">
      <div class="container split">
        <div>
          <p class="eyebrow">About ATHORA</p>
          <h1>${esc(about.title)}</h1>
          <p class="lead">${esc(about.intro)}</p>
          <p>${esc(about.mission)}</p>
          <a class="btn" href="/collection">Shop collection</a>
        </div>
        <img src="/${esc(img(about.image))}" alt="ATHORA activewear">
      </div>
    </section>
    <section class="section tight"><div class="container value-grid">${(about.values || []).map(value => `<div class="info-card"><h3>${esc(value.title)}</h3><p>${esc(value.text)}</p></div>`).join("")}</div></section>`;
}

function renderContact() {
  const contact = state.site.contact || {};
  $("#app").innerHTML = `
    <section class="page-hero"><div class="container"><p class="eyebrow">Contact</p><h1>We are here to help</h1><p class="lead">Questions about fit, orders or product care? Send a note and the ATHORA team will reply locally in this demo.</p></div></section>
    <section class="section tight">
      <div class="container contact-grid">
        <div class="info-card"><h3>Email</h3><p>${esc(contact.email)}</p></div>
        <div class="info-card"><h3>Phone</h3><p>${esc(contact.phone)}</p></div>
        <div class="info-card"><h3>Studio</h3><p>${esc(contact.address)}</p></div>
      </div>
      <div class="container" style="margin-top:26px">
        <form class="form-grid info-card" data-action="contact">
          <input required placeholder="Name">
          <input type="email" required placeholder="Email">
          <input class="span-2" placeholder="Subject">
          <textarea rows="6" placeholder="Message"></textarea>
          <button class="btn span-2" type="submit">Send message</button>
        </form>
      </div>
    </section>`;
}

function renderBlog() {
  const id = params().get("id");
  if (id) {
    const post = state.blogs.find(item => item.id === id) || state.blogs.find(visible);
    $("#app").innerHTML = post ? `
      <article class="section tight"><div class="container split">
        <div><p class="eyebrow">${esc(post.author)} - ${esc(post.date)}</p><h1>${esc(post.title)}</h1><p class="lead">${esc(post.summary)}</p><p>${esc(post.content)}</p><a class="btn ghost" href="/blog">Back to journal</a></div>
        <img src="/${esc(img(post.image))}" alt="${esc(post.title)}">
      </div></article>` : `<div class="container section"><div class="empty">Post not found.</div></div>`;
    return;
  }
  $("#app").innerHTML = `
    <section class="page-hero"><div class="container"><p class="eyebrow">Journal</p><h1>Blog</h1><p class="lead">Short, useful notes on training, fit, fabric and recovery.</p></div></section>
    <section class="section tight"><div class="container blog-grid">${renderBlogCards(state.blogs.filter(visible))}</div></section>`;
}

function renderBlogCards(posts) {
  if (!posts.length) return `<div class="empty span-2">No posts available.</div>`;
  return posts.map(post => `
    <article class="article-card">
      <a href="/blog?id=${esc(post.id)}"><img src="/${esc(img(post.image))}" alt="${esc(post.title)}"></a>
      <div><p class="brand-tag">${esc(post.author)} - ${esc(post.date)}</p><h3>${esc(post.title)}</h3><p>${esc(post.summary)}</p><a class="btn ghost" href="/blog?id=${esc(post.id)}">Read article</a></div>
    </article>`).join("");
}

function renderCart() {
  const items = state.cart.map(entry => {
    const product = state.products.find(item => item.id === entry.id);
    return product ? { ...entry, product } : null;
  }).filter(Boolean);
  const total = items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price || 0) * item.qty, 0);
  $("#app").innerHTML = `
    <section class="page-hero"><div class="container"><p class="eyebrow">Cart</p><h1>Your cart</h1><p class="lead">Review quantities before checkout.</p></div></section>
    <section class="section tight"><div class="container">
      <div class="cart-list">${items.length ? items.map(item => cartItemHtml(item)).join("") : `<div class="empty">Your cart is empty.</div>`}</div>
      <div class="info-card" style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap"><h3>Total ${money(total)}</h3><button class="btn" data-checkout>Checkout</button></div>
    </div></section>`;
}

function cartItemHtml(item) {
  const product = item.product;
  return `
    <div class="cart-item">
      <img src="/${esc(img(product.images?.[0]))}" alt="${esc(product.name)}">
      <div><p class="brand-tag">${esc(product.brand)}</p><h3>${esc(product.name)}</h3>${priceHtml(product)}</div>
      <div><div class="qty"><button data-qty="${esc(product.id)}" data-delta="-1">-</button><span>${item.qty}</span><button data-qty="${esc(product.id)}" data-delta="1">+</button></div><button class="chip" style="margin-top:10px" data-remove="${esc(product.id)}">Remove</button></div>
    </div>`;
}

function renderAccount() {
  $("#app").innerHTML = `
    <section class="page-hero"><div class="container"><p class="eyebrow">Account</p><h1>Account</h1><p class="lead">A simple local customer area for this ATHORA demo.</p></div></section>
    <section class="section tight"><div class="container value-grid">
      <div class="account-card"><h3>Profile</h3><p>Sign in is mocked for localhost preview.</p><button class="btn">Local sign in</button></div>
      <div class="account-card"><h3>Orders</h3><p>No orders yet. Add products to the cart to preview the flow.</p></div>
      <div class="account-card"><h3>Support</h3><p>Need sizing help? Reach the team through the contact page.</p><a class="btn ghost" href="/contact">Contact</a></div>
    </div></section>`;
}

function renderSearch() {
  state.search = params().get("q") || state.search || "";
  const results = filterProducts(state.products.filter(visible));
  $("#app").innerHTML = `
    <section class="page-hero"><div class="container"><p class="eyebrow">Search</p><h1>Search ATHORA</h1><p class="lead">Find products, categories and stories quickly.</p></div></section>
    <section class="section tight"><div class="container">
      <form class="toolbar" data-search-form><input class="search-field" name="q" value="${esc(state.search)}" placeholder="Search products, fits or activities"><button class="btn">Search</button></form>
      <h2 style="margin:26px 0">${results.length} product result${results.length === 1 ? "" : "s"}</h2>
      <div class="grid">${renderProductCards(results)}</div>
    </div></section>`;
}

function initHero() {
  const slides = $$(".hero-slide");
  const dots = $$(".dot");
  if (!slides.length) return;
  let active = 0;
  const show = index => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === active));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === active));
  };
  $("[data-hero-next]")?.addEventListener("click", () => show(active + 1));
  $("[data-hero-prev]")?.addEventListener("click", () => show(active - 1));
  dots.forEach(dot => dot.addEventListener("click", () => show(Number(dot.dataset.slide))));
  setInterval(() => show(active + 1), 6000);
}

function initCountdowns() {
  $$("[data-countdown]").forEach(box => {
    const end = new Date(box.dataset.countdown || Date.now());
    const tick = () => {
      const diff = Math.max(0, end - new Date());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;
      ["days", "hours", "minutes", "seconds"].forEach(key => {
        const value = { days, hours, minutes, seconds }[key];
        const target = $(`[data-count="${key}"]`, box);
        if (target) target.textContent = String(value).padStart(2, "0");
      });
    };
    tick();
    setInterval(tick, 1000);
  });
}

function bindGlobalEvents() {
  document.addEventListener("click", event => {
    const action = event.target.closest("[data-action]");
    if (action?.dataset.action === "menu") $("#nav-menu")?.classList.toggle("open");

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      state.filter = filter.dataset.filter;
      const grid = $("[data-product-grid]");
      const currentProducts = currentRoute() === "collection" ? collectionProductsFromUrl() : state.products.filter(visible).slice(0, 8);
      $$(".chip").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === state.filter));
      if (grid) grid.innerHTML = renderProductCards(filterProducts(currentProducts));
    }

    const quick = event.target.closest("[data-quick]");
    if (quick) {
      event.preventDefault();
      openQuickView(quick.dataset.quick);
    }

    const add = event.target.closest("[data-add]");
    if (add) addToCart(add.dataset.add);

    const buy = event.target.closest("[data-buy]");
    if (buy) {
      addToCart(buy.dataset.buy);
      history.pushState({}, "", "/cart");
      renderPage();
    }

    const gallery = event.target.closest("[data-gallery]");
    if (gallery) {
      $$(".thumbs button").forEach(button => button.classList.remove("active"));
      gallery.classList.add("active");
      $("#main-product-image").src = `/${gallery.dataset.gallery}`;
    }

    const option = event.target.closest(".option");
    if (option && option.parentElement) {
      $$(".option", option.parentElement).forEach(item => item.classList.remove("active"));
      option.classList.add("active");
    }

    const qty = event.target.closest("[data-qty]");
    if (qty) changeQty(qty.dataset.qty, Number(qty.dataset.delta));

    const remove = event.target.closest("[data-remove]");
    if (remove) removeFromCart(remove.dataset.remove);

    if (event.target.closest("[data-checkout]")) toast("Checkout is ready for ecommerce integration.");
    if (event.target.closest("[data-close-quick]")) closeQuickView();
    if (event.target.id === "quick-view") closeQuickView();
  });

  document.addEventListener("input", event => {
    const search = event.target.closest("[data-product-search]");
    if (search) {
      state.search = search.value;
      const grid = $("[data-product-grid]");
      const currentProducts = currentRoute() === "collection" ? collectionProductsFromUrl() : state.products.filter(visible).slice(0, 8);
      if (grid) grid.innerHTML = renderProductCards(filterProducts(currentProducts));
    }
  });

  document.addEventListener("change", event => {
    const category = event.target.closest("input[name='category']");
    if (category) {
      history.pushState({}, "", `/collection?category=${encodeURIComponent(category.value)}`);
      state.filter = "All";
      renderCollection();
    }
    const sort = event.target.closest("[data-sort]");
    if (sort) sortCollection(sort.value);
  });

  document.addEventListener("submit", event => {
    const newsletter = event.target.closest("[data-action='newsletter']");
    const contact = event.target.closest("[data-action='contact']");
    const search = event.target.closest("[data-search-form]");
    if (newsletter || contact) {
      event.preventDefault();
      event.target.reset();
      toast(newsletter ? "Subscribed locally." : "Message captured locally.");
    }
    if (search) {
      event.preventDefault();
      const q = new FormData(search).get("q") || "";
      history.pushState({}, "", `/search?q=${encodeURIComponent(q)}`);
      state.search = q;
      renderSearch();
    }
  });

  window.addEventListener("popstate", renderPage);
}

function collectionProductsFromUrl() {
  const category = params().get("category") || "all";
  return state.products.filter(product => visible(product) && (category === "all" || product.category === category || (product.collections || []).includes(category)));
}

function sortCollection(value) {
  const grid = $("[data-product-grid]");
  let list = filterProducts(collectionProductsFromUrl());
  if (value === "low") list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  if (value === "high") list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  if (value === "new") list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  if (grid) grid.innerHTML = renderProductCards(list);
}

function openQuickView(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;
  const modal = $("#quick-view");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = `
    <div class="quick-card" role="dialog" aria-modal="true" aria-label="${esc(product.name)}">
      <button class="icon-btn close" data-close-quick aria-label="Close">X</button>
      <img src="/${esc(img(product.images?.[0]))}" alt="${esc(product.name)}">
      <div>
        <p class="brand-tag">${esc(product.brand)}</p>
        <h2>${esc(product.name)}</h2>
        <p>${esc(product.summary)}</p>
        ${priceHtml(product)}
        <div class="swatches">${(product.colors || []).map(color => `<span class="swatch" title="${esc(color.name)}" style="background:${esc(color.hex)}"></span>`).join("")}</div>
        <button class="btn" style="width:100%;margin-top:24px" data-add="${esc(product.id)}">Add to cart</button>
        <a class="btn ghost" style="width:100%;margin-top:12px" href="/product?id=${esc(product.id)}">View details</a>
      </div>
    </div>`;
}

function closeQuickView() {
  const modal = $("#quick-view");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = "";
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("athoraCart") || "[]");
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("athoraCart", JSON.stringify(state.cart));
  refreshCartCount();
}

function addToCart(id) {
  const item = state.cart.find(entry => entry.id === id);
  if (item) item.qty += 1;
  else state.cart.push({ id, qty: 1 });
  saveCart();
  toast("Added to cart.");
}

function changeQty(id, delta) {
  const item = state.cart.find(entry => entry.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(entry => entry.id !== id);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(entry => entry.id !== id);
  saveCart();
  renderCart();
}

function refreshCartCount() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const target = $("#cart-count");
  if (target) target.textContent = count;
}

function toast(message) {
  const target = $("#toast");
  target.textContent = message;
  target.classList.add("show");
  setTimeout(() => target.classList.remove("show"), 2200);
}

function revealOnScroll() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(item => observer.observe(item));
}

init();
