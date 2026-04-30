const tabs = [
  ["dashboard", "Dashboard"],
  ["header", "Header"],
  ["sections", "Home sections"],
  ["products", "Products"],
  ["categories", "Collections"],
  ["blogs", "Blog"],
  ["footer", "Footer and contact"],
  ["design", "Design"]
];

const state = {
  authenticated: false,
  active: "dashboard",
  site: null,
  products: [],
  blogs: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? "").replace(/[&<>"']/g, match => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
}[match]));

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || response.statusText);
  }
  return response.json();
}

async function init() {
  const me = await api("/api/admin/me").catch(() => ({ authenticated: false }));
  state.authenticated = me.authenticated;
  if (!state.authenticated) renderLogin();
  else await loadAndRender();
}

function renderLogin() {
  $("#admin-root").innerHTML = `
    <section class="login-screen">
      <form class="login-card" id="login-form">
        <div class="brand">A</div>
        <h1>ATHORA Admin</h1>
        <p class="hint">Local CMS login. Default: admin / admin123</p>
        <div class="field"><label>Username</label><input name="username" autocomplete="username" required value="admin"></div>
        <div class="field" style="margin-top:12px"><label>Password</label><input name="password" type="password" autocomplete="current-password" required value="admin123"></div>
        <button class="btn" style="width:100%;margin-top:18px">Log in</button>
      </form>
    </section>`;
  $("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify(payload) });
      state.authenticated = true;
      await loadAndRender();
    } catch (error) {
      toast(error.message);
    }
  });
}

async function loadAndRender() {
  const [site, products, blogs] = await Promise.all([
    api("/api/site"),
    api("/api/products"),
    api("/api/blogs")
  ]);
  state.site = site;
  state.products = products;
  state.blogs = blogs;
  renderShell();
}

function renderShell() {
  $("#admin-root").innerHTML = `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">A</div>
        <h1>ATHORA CMS</h1>
        <p>Edit local JSON content. Refresh the public site to see changes.</p>
        ${tabs.map(([id, label]) => `<button class="tab-btn ${id === state.active ? "active" : ""}" data-tab="${id}"><span>${label}</span><span>></span></button>`).join("")}
        <button class="tab-btn" data-logout style="margin-top:24px"><span>Logout</span><span>X</span></button>
      </aside>
      <section class="main">
        <div class="topbar">
          <div><p class="hint">Localhost control panel</p><h2>${esc(tabLabel(state.active))}</h2></div>
          <div class="actions">
            <a class="btn secondary" href="/" target="_blank">View site</a>
            <button class="btn success" data-save>Save all changes</button>
          </div>
        </div>
        <div id="content"></div>
      </section>
    </div>`;
  renderTab();
}

function tabLabel(id) {
  return tabs.find(tab => tab[0] === id)?.[1] || "Dashboard";
}

function renderTab() {
  const content = $("#content");
  if (state.active === "dashboard") content.innerHTML = dashboardHtml();
  if (state.active === "header") content.innerHTML = headerHtml();
  if (state.active === "sections") content.innerHTML = sectionsHtml();
  if (state.active === "products") content.innerHTML = productsHtml();
  if (state.active === "categories") content.innerHTML = categoriesHtml();
  if (state.active === "blogs") content.innerHTML = blogsHtml();
  if (state.active === "footer") content.innerHTML = footerHtml();
  if (state.active === "design") content.innerHTML = designHtml();
}

function dashboardHtml() {
  const visibleProducts = state.products.filter(item => item.show !== false).length;
  const visibleSections = (state.site.home?.sections || []).filter(item => item.show !== false).length;
  return `
    <div class="grid three">
      ${stat("Products", state.products.length, `${visibleProducts} visible`)}
      ${stat("Home sections", state.site.home?.sections?.length || 0, `${visibleSections} visible`)}
      ${stat("Blog posts", state.blogs.length, `${state.blogs.filter(item => item.show !== false).length} visible`)}
    </div>
    <div class="panel">
      <h3>Admin coverage</h3>
      <p class="hint">Use the sidebar to manage header navigation, announcement, home sections, products, categories, blog posts, footer, contact and design settings. Click Save all changes to write JSON files.</p>
    </div>`;
}

function stat(title, value, text) {
  return `<div class="panel"><h3>${esc(title)}</h3><h2>${esc(value)}</h2><p class="hint">${esc(text)}</p></div>`;
}

function headerHtml() {
  const site = state.site;
  return `
    <div class="panel">
      <div class="panel-head"><h3>Brand and announcement</h3></div>
      <div class="grid">
        ${field("Logo text", "site", "brand.logoText", site.brand?.logoText)}
        ${field("Logo mark", "site", "brand.logoMark", site.brand?.logoMark)}
        ${field("Logo image path", "site", "brand.logoImage", site.brand?.logoImage, "assets/logo.png")}
        ${field("Announcement text", "site", "announcement.text", site.announcement?.text)}
        ${check("Show announcement", "site", "announcement.show", site.announcement?.show)}
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Navigation</h3><button class="btn secondary" data-add-nav>Add menu item</button></div>
      <div class="list">
        ${(site.nav || []).map((item, index) => `
          <div class="item">
            <div class="item-title"><h4>${esc(item.label || "Menu item")}</h4>${moveButtons("nav", index, site.nav.length)}</div>
            <div class="grid">
              ${field("Label", "nav", `${index}.label`, item.label)}
              ${field("Link", "nav", `${index}.url`, item.url)}
              ${check("Show item", "nav", `${index}.show`, item.show)}
              <div class="field"><label>Delete</label><button class="btn danger" data-delete-nav="${index}">Delete item</button></div>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

function sectionsHtml() {
  const sections = state.site.home?.sections || [];
  return `
    <div class="panel">
      <div class="panel-head">
        <div><h3>Home page sections</h3><p class="hint">Edit, hide, reorder or add content sections.</p></div>
        <button class="btn secondary" data-add-section>Add section</button>
      </div>
      <div class="list">
        ${sections.map((section, index) => sectionEditor(section, index, sections.length)).join("") || `<div class="empty">No sections yet.</div>`}
      </div>
    </div>`;
}

function sectionEditor(section, index, total) {
  const common = `
    ${field("ID", "section", `${index}.id`, section.id)}
    <div class="field"><label>Type</label><select data-bind="section" data-path="${index}.type">${["hero", "categories", "banner", "marquee", "products", "look", "offer", "activity", "reviews", "stories", "text"].map(type => `<option value="${type}" ${section.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></div>
    ${check("Show section", "section", `${index}.show`, section.show)}
    ${field("Title", "section", `${index}.title`, section.title)}
    ${field("Subtitle", "section", `${index}.subtitle`, section.subtitle)}
    ${field("Summary", "section", `${index}.summary`, section.summary)}
    ${field("Button text", "section", `${index}.buttonText`, section.buttonText)}
    ${field("Button link", "section", `${index}.buttonLink`, section.buttonLink)}
    ${field("Image path", "section", `${index}.image`, section.image)}
    ${field("Product ID", "section", `${index}.productId`, section.productId)}
    ${field("Offer ends at", "section", `${index}.endsAt`, section.endsAt, "2026-12-31")}`;
  return `
    <div class="item">
      <div class="item-title">
        <div><h4>${esc(section.title || section.type || "Section")}</h4><p class="hint">${esc(section.type)} section</p></div>
        ${moveButtons("section", index, total)}
      </div>
      <div class="grid">
        ${common}
        ${textarea("Slides, comma separated", "section-list", `${index}.slides`, (section.slides || []).join(", "))}
        ${textarea("Marquee items, one per line", "section-lines", `${index}.items`, (section.items || []).join("\n"))}
        ${textarea("Reviews JSON", "section-json", `${index}.items`, section.type === "reviews" ? JSON.stringify(section.items || [], null, 2) : "")}
        <div class="field"><label>Delete</label><button class="btn danger" data-delete-section="${index}">Delete section</button></div>
      </div>
    </div>`;
}

function productsHtml() {
  return `
    <div class="panel">
      <div class="panel-head">
        <div><h3>Products and catalogue</h3><p class="hint">Manage price, images, swatches, sizing, stock, flags and collection assignment.</p></div>
        <button class="btn secondary" data-add-product>Add product</button>
      </div>
      <div class="list">
        ${state.products.map((product, index) => productEditor(product, index)).join("") || `<div class="empty">No products yet.</div>`}
      </div>
    </div>`;
}

function productEditor(product, index) {
  return `
    <div class="item">
      <div class="item-title">
        <div style="display:flex;align-items:center;gap:12px">
          <img class="preview-img" src="/${esc(product.images?.[0] || "assets/hero.png")}" alt="">
          <div><h4>${esc(product.name || "Product")}</h4><p class="hint">${esc(product.sku || "")}</p></div>
        </div>
        <div class="mini-actions">
          <button class="btn secondary" data-price="${index}" data-delta="-5">- $5</button>
          <button class="btn secondary" data-price="${index}" data-delta="5">+ $5</button>
          <button class="btn danger" data-delete-product="${index}">Delete</button>
        </div>
      </div>
      <div class="grid">
        ${field("ID", "product", `${index}.id`, product.id)}
        ${field("Name", "product", `${index}.name`, product.name)}
        ${field("Brand", "product", `${index}.brand`, product.brand)}
        ${field("Price", "product-number", `${index}.price`, product.price, "", "number")}
        ${field("Sale price", "product-number-null", `${index}.salePrice`, product.salePrice, "", "number")}
        ${field("SKU", "product", `${index}.sku`, product.sku)}
        ${field("Stock", "product-number", `${index}.stock`, product.stock, "", "number")}
        ${field("Category ID", "product", `${index}.category`, product.category)}
        ${textarea("Short summary", "product", `${index}.summary`, product.summary)}
        ${textarea("Description", "product", `${index}.description`, product.description)}
        ${textarea("Images, comma separated", "product-list", `${index}.images`, (product.images || []).join(", "))}
        ${textarea("Tags, comma separated", "product-list", `${index}.tags`, (product.tags || []).join(", "))}
        ${textarea("Collections, comma separated", "product-list", `${index}.collections`, (product.collections || []).join(", "))}
        ${textarea("Sizes, comma separated", "product-list", `${index}.sizes`, (product.sizes || []).join(", "))}
        ${textarea("Colors, one per line: Name|#hex", "product-colors", `${index}.colors`, colorsToLines(product.colors))}
        <div class="span-2 grid three">
          ${check("Show", "product", `${index}.show`, product.show)}
          ${check("Featured", "product", `${index}.featured`, product.featured)}
          ${check("New", "product", `${index}.isNew`, product.isNew)}
          ${check("Bestseller", "product", `${index}.bestseller`, product.bestseller)}
          ${check("Sale", "product", `${index}.sale`, product.sale)}
        </div>
      </div>
    </div>`;
}

function categoriesHtml() {
  const categories = state.site.categories || [];
  return `
    <div class="panel">
      <div class="panel-head"><h3>Collections and categories</h3><button class="btn secondary" data-add-category>Add category</button></div>
      <div class="list">
        ${categories.map((category, index) => `
          <div class="item">
            <div class="item-title">
              <div style="display:flex;align-items:center;gap:12px"><img class="preview-img" src="/${esc(category.image || "assets/hero.png")}" alt=""><h4>${esc(category.name || "Category")}</h4></div>
              ${moveButtons("category", index, categories.length)}
            </div>
            <div class="grid">
              ${field("ID", "category", `${index}.id`, category.id)}
              ${field("Name", "category", `${index}.name`, category.name)}
              ${field("Slug", "category", `${index}.slug`, category.slug)}
              ${field("Image", "category", `${index}.image`, category.image)}
              ${textarea("Summary", "category", `${index}.summary`, category.summary)}
              ${check("Show", "category", `${index}.show`, category.show)}
              <div class="field"><label>Delete</label><button class="btn danger" data-delete-category="${index}">Delete category</button></div>
            </div>
          </div>`).join("") || `<div class="empty">No categories yet.</div>`}
      </div>
    </div>`;
}

function blogsHtml() {
  return `
    <div class="panel">
      <div class="panel-head"><h3>Blog posts</h3><button class="btn secondary" data-add-blog>Add post</button></div>
      <div class="list">
        ${state.blogs.map((post, index) => `
          <div class="item">
            <div class="item-title">
              <div style="display:flex;align-items:center;gap:12px"><img class="preview-img" src="/${esc(post.image || "assets/hero.png")}" alt=""><h4>${esc(post.title || "Post")}</h4></div>
              <button class="btn danger" data-delete-blog="${index}">Delete</button>
            </div>
            <div class="grid">
              ${field("ID", "blog", `${index}.id`, post.id)}
              ${field("Title", "blog", `${index}.title`, post.title)}
              ${field("Image", "blog", `${index}.image`, post.image)}
              ${field("Author", "blog", `${index}.author`, post.author)}
              ${field("Date", "blog", `${index}.date`, post.date, "", "date")}
              ${textarea("Short summary", "blog", `${index}.summary`, post.summary)}
              ${textarea("Content", "blog", `${index}.content`, post.content)}
              ${check("Show", "blog", `${index}.show`, post.show)}
            </div>
          </div>`).join("") || `<div class="empty">No posts yet.</div>`}
      </div>
    </div>`;
}

function footerHtml() {
  const footer = state.site.footer || {};
  const contact = state.site.contact || {};
  return `
    <div class="panel">
      <div class="panel-head"><h3>Footer settings</h3></div>
      <div class="grid">
        ${check("Show footer", "site", "footer.show", footer.show)}
        ${check("Show newsletter", "site", "footer.newsletter", footer.newsletter)}
        ${field("Newsletter title", "site", "footer.newsletterTitle", footer.newsletterTitle)}
        ${field("Newsletter text", "site", "footer.newsletterText", footer.newsletterText)}
        ${field("Copyright", "site", "footer.copyright", footer.copyright)}
        ${textarea("Social links, one per line: Label|url|icon", "footer-social", "footer.social", socialToLines(footer.social))}
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Footer link columns</h3><button class="btn secondary" data-add-footer-column>Add column</button></div>
      <div class="list">${(footer.columns || []).map((column, index) => `
        <div class="item">
          <div class="item-title"><h4>${esc(column.title || "Column")}</h4><button class="btn danger" data-delete-footer-column="${index}">Delete</button></div>
          <div class="grid">
            ${field("Title", "footer-column", `${index}.title`, column.title)}
            ${check("Show", "footer-column", `${index}.show`, column.show)}
            ${textarea("Links, one per line: Label|url", "footer-links", `${index}.links`, linksToLines(column.links))}
          </div>
        </div>`).join("")}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Footer service blocks</h3><button class="btn secondary" data-add-footer-block>Add block</button></div>
      <div class="list">${(footer.blocks || []).map((block, index) => `
        <div class="item">
          <div class="item-title"><h4>${esc(block.title || "Block")}</h4><button class="btn danger" data-delete-footer-block="${index}">Delete</button></div>
          <div class="grid">
            ${field("Title", "footer-block", `${index}.title`, block.title)}
            ${field("Text", "footer-block", `${index}.text`, block.text)}
            ${check("Show", "footer-block", `${index}.show`, block.show)}
          </div>
        </div>`).join("")}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Contact details</h3></div>
      <div class="grid">
        ${field("Email", "site", "contact.email", contact.email)}
        ${field("Phone", "site", "contact.phone", contact.phone)}
        ${field("Address", "site", "contact.address", contact.address)}
      </div>
    </div>`;
}

function designHtml() {
  const theme = state.site.theme || {};
  return `
    <div class="panel">
      <div class="panel-head"><h3>Design settings</h3></div>
      <div class="grid">
        ${field("Primary color", "site", "theme.primary", theme.primary, "", "color")}
        ${field("Accent color", "site", "theme.accent", theme.accent, "", "color")}
        ${field("Button radius", "site", "theme.buttonRadius", theme.buttonRadius)}
        ${field("Card radius", "site", "theme.cardRadius", theme.cardRadius)}
        <div class="field"><label>Font</label><select data-bind="site" data-path="theme.font">${["Inter", "Outfit", "Arial", "Georgia"].map(font => `<option value="${font}" ${theme.font === font ? "selected" : ""}>${font}</option>`).join("")}</select></div>
        ${check("Enable animations", "site", "theme.animations", theme.animations)}
      </div>
    </div>
    <div class="panel">
      <h3>About page</h3>
      <div class="grid">
        ${field("Title", "site", "about.title", state.site.about?.title)}
        ${field("Image", "site", "about.image", state.site.about?.image)}
        ${textarea("Intro", "site", "about.intro", state.site.about?.intro)}
        ${textarea("Mission", "site", "about.mission", state.site.about?.mission)}
        ${textarea("Values JSON", "site-json", "about.values", JSON.stringify(state.site.about?.values || [], null, 2))}
      </div>
    </div>`;
}

function field(label, bind, path, value = "", placeholder = "", type = "text") {
  return `<div class="field"><label>${esc(label)}</label><input type="${type}" data-bind="${bind}" data-path="${esc(path)}" value="${esc(value ?? "")}" placeholder="${esc(placeholder)}"></div>`;
}

function textarea(label, bind, path, value = "") {
  return `<div class="field span-2"><label>${esc(label)}</label><textarea data-bind="${bind}" data-path="${esc(path)}">${esc(value ?? "")}</textarea></div>`;
}

function check(label, bind, path, value) {
  return `<label class="toggle-line"><input type="checkbox" data-bind="${bind}" data-path="${esc(path)}" ${value !== false ? "checked" : ""}> ${esc(label)}</label>`;
}

function moveButtons(type, index, total) {
  return `<div class="mini-actions">
    <button class="btn secondary" data-move="${type}" data-index="${index}" data-dir="-1" ${index === 0 ? "disabled" : ""}>Up</button>
    <button class="btn secondary" data-move="${type}" data-index="${index}" data-dir="1" ${index === total - 1 ? "disabled" : ""}>Down</button>
  </div>`;
}

document.addEventListener("click", async event => {
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    state.active = tab.dataset.tab;
    renderShell();
    return;
  }
  if (event.target.closest("[data-save]")) return saveAll();
  if (event.target.closest("[data-logout]")) {
    await api("/api/admin/logout", { method: "POST" });
    state.authenticated = false;
    renderLogin();
    return;
  }

  if (event.target.closest("[data-add-nav]")) addNav();
  if (event.target.closest("[data-add-section]")) addSection();
  if (event.target.closest("[data-add-product]")) addProduct();
  if (event.target.closest("[data-add-category]")) addCategory();
  if (event.target.closest("[data-add-blog]")) addBlog();
  if (event.target.closest("[data-add-footer-column]")) addFooterColumn();
  if (event.target.closest("[data-add-footer-block]")) addFooterBlock();

  const delNav = event.target.closest("[data-delete-nav]");
  if (delNav) state.site.nav.splice(Number(delNav.dataset.deleteNav), 1), renderTab();
  const delSection = event.target.closest("[data-delete-section]");
  if (delSection) state.site.home.sections.splice(Number(delSection.dataset.deleteSection), 1), renderTab();
  const delProduct = event.target.closest("[data-delete-product]");
  if (delProduct) state.products.splice(Number(delProduct.dataset.deleteProduct), 1), renderTab();
  const delCategory = event.target.closest("[data-delete-category]");
  if (delCategory) state.site.categories.splice(Number(delCategory.dataset.deleteCategory), 1), renderTab();
  const delBlog = event.target.closest("[data-delete-blog]");
  if (delBlog) state.blogs.splice(Number(delBlog.dataset.deleteBlog), 1), renderTab();
  const delCol = event.target.closest("[data-delete-footer-column]");
  if (delCol) state.site.footer.columns.splice(Number(delCol.dataset.deleteFooterColumn), 1), renderTab();
  const delBlock = event.target.closest("[data-delete-footer-block]");
  if (delBlock) state.site.footer.blocks.splice(Number(delBlock.dataset.deleteFooterBlock), 1), renderTab();

  const move = event.target.closest("[data-move]");
  if (move) moveItem(move.dataset.move, Number(move.dataset.index), Number(move.dataset.dir));

  const price = event.target.closest("[data-price]");
  if (price) {
    const product = state.products[Number(price.dataset.price)];
    product.price = Math.max(0, Number(product.price || 0) + Number(price.dataset.delta));
    renderTab();
  }
});

document.addEventListener("input", event => {
  const input = event.target.closest("[data-bind]");
  if (!input) return;
  updateFromInput(input);
});

document.addEventListener("change", event => {
  const input = event.target.closest("[data-bind]");
  if (!input) return;
  updateFromInput(input);
});

function updateFromInput(input) {
  const bind = input.dataset.bind;
  const path = input.dataset.path;
  const raw = input.type === "checkbox" ? input.checked : input.value;
  let value = raw;
  if (bind.includes("number")) value = raw === "" && bind.includes("null") ? null : Number(raw);
  if (bind.endsWith("list")) value = parseList(raw);
  if (bind.endsWith("lines")) value = parseLines(raw);
  if (bind.endsWith("colors")) value = parseColors(raw);
  if (bind.endsWith("json")) {
    try { value = JSON.parse(raw || "null"); } catch { return; }
  }
  if (bind === "site" || bind === "site-json") setPath(state.site, path, value);
  if (bind === "nav") setPath(state.site.nav, path, value);
  if (bind === "section" || bind === "section-list" || bind === "section-lines" || bind === "section-json") setPath(state.site.home.sections, path, value);
  if (bind.startsWith("product")) setPath(state.products, path, value);
  if (bind === "category") setPath(state.site.categories, path, value);
  if (bind === "blog") setPath(state.blogs, path, value);
  if (bind === "footer-social") setPath(state.site, path, parseSocial(raw));
  if (bind === "footer-column") setPath(state.site.footer.columns, path, value);
  if (bind === "footer-links") setPath(state.site.footer.columns, path, parseLinks(raw));
  if (bind === "footer-block") setPath(state.site.footer.blocks, path, value);
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let current = target;
  parts.slice(0, -1).forEach(part => {
    const key = isFinite(part) ? Number(part) : part;
    if (current[key] === undefined || current[key] === null) current[key] = {};
    current = current[key];
  });
  const finalKey = parts.at(-1);
  current[isFinite(finalKey) ? Number(finalKey) : finalKey] = value;
}

function addNav() {
  state.site.nav ||= [];
  state.site.nav.push({ label: "New link", url: "/collection", show: true });
  renderTab();
}

function addSection() {
  state.site.home ||= { sections: [] };
  state.site.home.sections.push({ id: `section-${Date.now()}`, type: "text", show: true, title: "New section", subtitle: "Edit this section from admin.", buttonText: "Shop now", buttonLink: "/collection", image: "assets/hero.png" });
  renderTab();
}

function addProduct() {
  state.products.push({
    id: `p${Date.now()}`,
    name: "New product",
    brand: "ATHORA",
    price: 100,
    salePrice: null,
    sku: `ATH-${Date.now()}`,
    stock: 10,
    category: "all",
    collections: ["all"],
    tags: [],
    show: true,
    featured: false,
    isNew: true,
    bestseller: false,
    sale: false,
    summary: "Short product summary.",
    description: "Detailed product description.",
    images: ["assets/hero.png"],
    colors: [{ name: "Black", hex: "#000000" }],
    sizes: ["S", "M", "L"]
  });
  renderTab();
}

function addCategory() {
  state.site.categories ||= [];
  state.site.categories.push({ id: `cat-${Date.now()}`, name: "New collection", slug: "new-collection", image: "assets/hero.png", summary: "Collection summary.", show: true });
  renderTab();
}

function addBlog() {
  state.blogs.push({ id: `b${Date.now()}`, title: "New post", image: "assets/hero.png", summary: "Short summary.", content: "Post content.", author: "ATHORA", date: new Date().toISOString().slice(0, 10), show: true });
  renderTab();
}

function addFooterColumn() {
  state.site.footer.columns ||= [];
  state.site.footer.columns.push({ show: true, title: "New column", links: [{ label: "Shop", url: "/collection" }] });
  renderTab();
}

function addFooterBlock() {
  state.site.footer.blocks ||= [];
  state.site.footer.blocks.push({ show: true, title: "New block", text: "Short footer service message." });
  renderTab();
}

function moveItem(type, index, dir) {
  const lists = {
    nav: state.site.nav,
    section: state.site.home.sections,
    category: state.site.categories
  };
  const list = lists[type];
  const next = index + dir;
  if (!list || next < 0 || next >= list.length) return;
  [list[index], list[next]] = [list[next], list[index]];
  renderTab();
}

async function saveAll() {
  try {
    await Promise.all([
      api("/api/admin/site", { method: "PUT", body: JSON.stringify(state.site) }),
      api("/api/admin/products", { method: "PUT", body: JSON.stringify(state.products) }),
      api("/api/admin/blogs", { method: "PUT", body: JSON.stringify(state.blogs) })
    ]);
    toast("Saved to JSON.");
  } catch (error) {
    toast(error.message);
  }
}

function parseList(value) {
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
}

function parseLines(value) {
  return String(value || "").split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function colorsToLines(colors = []) {
  return colors.map(color => `${color.name || ""}|${color.hex || ""}`).join("\n");
}

function parseColors(value) {
  return parseLines(value).map(line => {
    const [name, hex] = line.split("|").map(part => part.trim());
    return { name: name || hex || "Color", hex: hex || name || "#000000" };
  });
}

function linksToLines(links = []) {
  return links.map(link => `${link.label || ""}|${link.url || ""}`).join("\n");
}

function parseLinks(value) {
  return parseLines(value).map(line => {
    const [label, url] = line.split("|").map(part => part.trim());
    return { label: label || "Link", url: url || "#" };
  });
}

function socialToLines(social = []) {
  return social.map(item => `${item.label || ""}|${item.url || ""}|${item.icon || ""}`).join("\n");
}

function parseSocial(value) {
  return parseLines(value).map(line => {
    const [label, url, icon] = line.split("|").map(part => part.trim());
    return { label: label || "Social", url: url || "#", icon: icon || (label || "s")[0].toLowerCase() };
  });
}

function toast(message) {
  const target = $("#admin-toast");
  target.textContent = message;
  target.classList.add("show");
  setTimeout(() => target.classList.remove("show"), 2200);
}

init();
