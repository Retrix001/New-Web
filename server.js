const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(session({
  secret: 'athora-local-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ---------- helpers ----------
function readJson(name) {
  const file = path.join(DATA_DIR, name);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return null; }
}
function writeJson(name, data) {
  const file = path.join(DATA_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// ---------- Public API ----------
app.get('/api/site', (req, res) => res.json(readJson('site.json') || {}));
app.get('/api/products', (req, res) => res.json(readJson('products.json') || []));
app.get('/api/products/:id', (req, res) => {
  const list = readJson('products.json') || [];
  const p = list.find(x => String(x.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});
app.get('/api/blogs', (req, res) => res.json(readJson('blogs.json') || []));
app.get('/api/blogs/:id', (req, res) => {
  const list = readJson('blogs.json') || [];
  const p = list.find(x => String(x.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// ---------- Admin auth ----------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const site = readJson('site.json') || {};
  const u = (site.admin && site.admin.username) || 'admin';
  const p = (site.admin && site.admin.password) || 'admin123';
  if (username === u && password === p) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get('/api/admin/me', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.admin) });
});

// ---------- Admin write API ----------
app.put('/api/admin/site', requireAdmin, (req, res) => {
  writeJson('site.json', req.body); res.json({ ok: true });
});
app.put('/api/admin/products', requireAdmin, (req, res) => {
  writeJson('products.json', req.body); res.json({ ok: true });
});
app.put('/api/admin/blogs', requireAdmin, (req, res) => {
  writeJson('blogs.json', req.body); res.json({ ok: true });
});

// ---------- Admin static ----------
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Friendly page routes
app.get('/admin', (req, res) =>
  res.sendFile(path.join(__dirname, 'admin', 'index.html')));

const publicApp = (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'));

[
  '/',
  '/collection',
  '/collection.html',
  '/product',
  '/product.html',
  '/about',
  '/about.html',
  '/contact',
  '/contact.html',
  '/blog',
  '/blog.html',
  '/cart',
  '/account',
  '/search'
].forEach(route => app.get(route, publicApp));

app.listen(PORT, () => {
  console.log(`\n  ATHORA running:`);
  console.log(`  Public:  http://localhost:${PORT}`);
  console.log(`  Admin:   http://localhost:${PORT}/admin\n`);
});
