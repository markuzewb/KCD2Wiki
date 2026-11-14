#!/usr/bin/env node
/** Build a read-only, subpath-safe GitHub Pages site from the current Wiki data. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const out = path.join(root, 'dist', 'pages');
const dataDir = path.join(root, 'data');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const existing = (...files) => files.find(file => fs.existsSync(file));
const writeJson = (name, value) => fs.writeFileSync(path.join(out, 'data', name + '.json'), JSON.stringify(value));

const content = readJson(existing(path.join(dataDir, 'wiki.json'), path.join(root, 'seed.json')));
const game = readJson(existing(path.join(dataDir, 'game-catalog.json'), path.join(root, 'catalog', 'game-catalog.json')));
const animations = readJson(path.join(root, 'catalog', 'animations.json'));
const icons = readJson(path.join(root, 'catalog', 'icons.json'));
const matches = readJson(path.join(root, 'catalog', 'item-icon-map.json'));
const maps = readJson(existing(path.join(dataDir, 'map-markers.json'), path.join(root, 'catalog', 'map-markers.json')));
if (!content.site || !Array.isArray(content.categories) || !Array.isArray(content.articles)) throw new Error('Invalid Wiki content');
if (!game.meta || !Array.isArray(game.items) || !Array.isArray(game.recipes)) throw new Error('Invalid game catalog');
if (game.meta.itemCount !== game.items.length || game.meta.recipeCount !== game.recipes.length) throw new Error('Game catalog counts do not match meta');
if (!Array.isArray(animations.clips) || !Array.isArray(icons.icons) || !matches.items || !Array.isArray(maps.markers)) throw new Error('Invalid static catalog data');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'data'), { recursive: true });
fs.cpSync(publicDir, out, {
  recursive: true,
  filter: source => !['index.html', 'demo.html'].includes(path.basename(source))
});
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(out, 'THIRD_PARTY_NOTICES.md'));

// Never copy the server, environment files, backups or the whole data directory.
// Only published articles and explicitly whitelisted public catalog fields ship.
const published = content.articles.filter(article => article.published === true);
writeJson('content', { site: content.site, categories: content.categories, articles: published });
const { sourceHashes, ...publicMeta } = game.meta;
const media = {};
const mediaSource = path.join(dataDir, 'media', 'items');
if (fs.existsSync(mediaSource)) {
  fs.mkdirSync(path.join(out, 'media', 'items'), { recursive: true });
  for (const entry of fs.readdirSync(mediaSource, { withFileTypes: true })) {
    const match = entry.isFile() && entry.name.match(/^([a-f0-9-]{36})\.(webp|png|jpg)$/i);
    if (!match) continue;
    const name = match[1].toLowerCase() + '.' + match[2].toLowerCase();
    fs.copyFileSync(path.join(mediaSource, entry.name), path.join(out, 'media', 'items', name));
    media[match[1].toLowerCase()] = '/media/items/' + name;
  }
}
// Heavy per-item game stats ship in a separate file loaded only for detail cards.
const itemStats = {};
for (const item of game.items) if (Array.isArray(item.stats) && item.stats.length) itemStats[item.id.toLowerCase()] = item.stats;
const leanItems = game.items.map(({ stats, ...rest }) => rest);
writeJson('game', { meta: publicMeta, items: leanItems, recipes: game.recipes, media });
writeJson('item-stats', { items: itemStats });
const families = {};
const animCats = {};
const animKinds = {};
const animPhases = {};
const animPoses = {};
const clips = animations.clips.map(row => ({
  clip: String(row.clip), families: row.families || [], fragments: row.fragments || [],
  ru: row.ru || '', desc: row.desc || '', phase: row.phase || '', cat: row.cat || '', catIcon: row.catIcon || '',
  sub: row.sub || '', pose: row.pose || '', kind: row.kind || '', tags: row.tags || []
}));
for (const clip of clips) {
  for (const family of clip.families) families[family] = (families[family] || 0) + 1;
  if (clip.cat) animCats[clip.cat] = (animCats[clip.cat] || 0) + 1;
  if (clip.kind) animKinds[clip.kind] = (animKinds[clip.kind] || 0) + 1;
  if (clip.phase) animPhases[clip.phase] = (animPhases[clip.phase] || 0) + 1;
  if (clip.pose) animPoses[clip.pose] = (animPoses[clip.pose] || 0) + 1;
}
writeJson('animations', {
  source: animations.source, imported: animations.imported, clips, families,
  cats: animCats, catalog: animations.catalog || [], kinds: animKinds, phases: animPhases, poses: animPoses
});
writeJson('icons', { source: icons.source, total: icons.icons.length, categories: icons.categories, icons: icons.icons });
writeJson('item-icon-map', { itemCount: matches.itemCount, matchedCount: matches.matchedCount, counts: matches.counts, items: matches.items });
const mapLabels = readJson(path.join(root, 'catalog', 'map-labels.json'));
if (!mapLabels.labels || !Array.isArray(mapLabels.labels.trosky) || !Array.isArray(mapLabels.labels.kuttenberg)) throw new Error('Invalid map labels data');
const regionInfo = {
  trosky: { title: 'Троски', rows: 4, cols: 4, tileSize: 1024, source: 'Карты игрового режима KCD2RP', labels: mapLabels.labels.trosky },
  kuttenberg: { title: 'Кутна-Гора', rows: 5, cols: 6, tileSize: 1024, source: 'Карты игрового режима KCD2RP', labels: mapLabels.labels.kuttenberg }
};
writeJson('maps', { regions: regionInfo, markers: maps.markers, calibrated: false, notice: 'Игровые X/Y не привязаны к пикселям; метки размещаются вручную редактором.' });

// Cache busting: a content hash of the frontend bundle versions every asset URL,
// so browsers pick up new scripts/styles right after each deployment.
const crypto = await import('node:crypto');
const bundleFiles = ['app.js', 'wiki-extra.js', 'wiki-icons.js', 'static-api.js', 'style.css', 'wiki-icons.css', 'majestic-reference.css', 'reference-layout.css'];
const digest = crypto.createHash('sha256');
for (const file of bundleFiles) digest.update(fs.readFileSync(path.join(publicDir, file)));
const v = digest.digest('hex').slice(0, 10);

// Hash routes survive direct links and reloads without a server-side SPA fallback.
// Detect the repository subpath at runtime, so the same artifact also works at /.
const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="Энциклопедия KCD2RP — гид по Богемии, профессиям, фракциям, ремёслам и игровым системам.">
  <title>KCD2RP Wiki — Энциклопедия Богемии</title>
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <script>try{document.documentElement.dataset.theme=localStorage.getItem('kcd2rp-wiki-theme')||'light'}catch(e){document.documentElement.dataset.theme='light'}</script>
  <link rel="stylesheet" href="./style.css?v=${v}">
  <link rel="stylesheet" href="./wiki-icons.css?v=${v}">
  <link rel="stylesheet" href="./majestic-reference.css?v=${v}">
  <link rel="stylesheet" href="./reference-layout.css?v=${v}">
</head>
<body>
  <div id="app"><div class="loading">Загружаем летопись Богемии…</div></div>
  <noscript>Для работы энциклопедии включите JavaScript в браузере.</noscript>
  <script>window.KCD2RP_STATIC=true;window.KCD2RP_WIKI_BASE=location.pathname.replace(/\\/index\\.html$/,'/').replace(/\\/$/,'');</script>
  <script src="./vendor/react.min.js?v=${v}"></script>
  <script src="./vendor/react-dom.min.js?v=${v}"></script>
  <script src="./static-api.js?v=${v}"></script>
  <script src="./wiki-extra.js?v=${v}"></script>
  <script src="./wiki-icons.js?v=${v}"></script>
  <script src="./app.js?v=${v}"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');

let files = 0;
let bytes = 0;
function measure(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) measure(file);
    else { files++; bytes += fs.statSync(file).size; }
  }
}
measure(out);
console.log(`Built GitHub Pages: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB`);
console.log(`Published articles: ${published.length}; items: ${game.items.length}; recipes: ${game.recipes.length}; icons: ${icons.icons.length}`);
