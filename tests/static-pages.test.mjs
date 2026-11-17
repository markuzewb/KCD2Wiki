import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist', 'pages');
const readData = name => JSON.parse(fs.readFileSync(path.join(dist, 'data', name + '.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'public', 'static-api.js'), 'utf8');

function adapter(base = '') {
  const requests = [];
  const scope = {
    KCD2RP_WIKI_BASE: base,
    fetch: async url => {
      requests.push(String(url));
      const name = new URL(String(url), 'https://wiki.local').pathname.match(/\/data\/([a-z-]+)\.json$/)?.[1];
      if (!name) return new Response('Not found', { status: 404 });
      return new Response(fs.readFileSync(path.join(dist, 'data', name + '.json')), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  };
  vm.runInNewContext(source, { window: scope, URL, URLSearchParams, Response, console });
  return { api: scope.KCD2RPStaticAPI, requests };
}
async function get(api, url) {
  const response = await api.fetch(url);
  return { status: response.status, body: await response.json() };
}

test('Pages artifact contains only allowlisted data and a subpath-safe shell', () => {
  assert.ok(fs.existsSync(path.join(dist, '.nojekyll')));
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /window\.KCD2RP_STATIC=true/);
  assert.match(html, /static-api\.js/);
  for (const [, file] of html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) assert.ok(fs.existsSync(path.join(dist, file)), file);
  for (const file of ['.env', 'server.js', 'seed.json', 'data/wiki.json', 'demo.html']) assert.equal(fs.existsSync(path.join(dist, file)), false, file);
  const content = readData('content');
  assert.ok(content.articles.length > 0);
  assert.ok(content.articles.every(article => article.published === true));
  assert.equal(readData('game').meta.sourceHashes, undefined);
});

test('home loads only published content and remains read-only', async () => {
  const { api, requests } = adapter();
  const content = await get(api, '/api/content');
  assert.equal(content.status, 200);
  assert.deepEqual(content.body, readData('content'));
  assert.deepEqual(await get(api, '/api/me'), { status: 200, body: { admin: false, readOnly: true } });
  assert.deepEqual(requests, ['/data/content.json']);
  for (const url of ['/api/login', '/api/articles', '/api/maps/markers', '/api/admin/game-catalog']) {
    const response = await api.fetch(url, { method: 'POST' });
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /только для чтения/);
  }
});

test('item search, filters, pagination, details and icon files work', async () => {
  const { api } = adapter();
  const game = readData('game');
  const matches = readData('item-icon-map');
  const list = await get(api, '/api/game/items?role=priced&page=2&limit=5');
  assert.equal(list.status, 200);
  assert.equal(list.body.page, 2);
  assert.equal(list.body.rows.length, 5);
  assert.ok(list.body.rows.every(item => item.referencePrice != null));
  const id = Object.keys(matches.items)[0];
  const detail = await get(api, '/api/game/items/' + id);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.item.id, id);
  assert.equal(detail.body.item.imageUrl, matches.items[id].path);
  assert.ok(fs.existsSync(path.join(dist, detail.body.item.imageUrl.slice(1))));
  assert.ok(Array.isArray(detail.body.related));
  const search = game.items.find(item => item.recipeOutputs > 0);
  const found = await get(api, '/api/game/items?role=result&q=' + encodeURIComponent(search.name));
  assert.ok(found.body.rows.some(item => item.id === search.id));
  assert.equal((await get(api, '/api/game/items/00000000-0000-0000-0000-000000000000')).status, 404);
});

test('recipe filters and ingredient details work', async () => {
  const { api } = adapter();
  const game = readData('game');
  const recipe = game.recipes.find(row => row.ingredients.length && row.outputs.length);
  const list = await get(api, '/api/game/recipes?limit=5&craft=' + encodeURIComponent(recipe.craft) + '&kind=' + encodeURIComponent(recipe.kind) + '&level=' + recipe.level);
  assert.equal(list.status, 200);
  assert.ok(list.body.total > 0);
  assert.ok(list.body.rows.every(row => row.craft === recipe.craft && row.kind === recipe.kind && row.level === recipe.level));
  const detail = await get(api, '/api/game/recipes/' + encodeURIComponent(recipe.id));
  assert.equal(detail.status, 200);
  assert.equal(detail.body.recipe.id, recipe.id);
  assert.equal(detail.body.recipe.ingredients.length, recipe.ingredients.length);
  assert.equal((await get(api, '/api/game/recipes/no-such-recipe')).status, 404);
});

test('icon gallery and animation reference retain search and pagination', async () => {
  const { api } = adapter();
  const icons = readData('icons');
  const meta = await get(api, '/api/icons/meta');
  assert.equal(meta.body.total, icons.icons.length);
  const gallery = await get(api, '/api/icons?category=items&page=2&limit=5');
  assert.equal(gallery.body.rows.length, 5);
  assert.ok(gallery.body.rows.every(icon => icon.category === 'items'));
  assert.equal((await get(api, '/api/icons?category=invalid')).status, 400);
  const animations = readData('animations');
  const animationMeta = await get(api, '/api/animations/meta');
  assert.equal(animationMeta.body.count, animations.clips.length);
  const clip = animations.clips[0];
  const list = await get(api, '/api/animations?limit=5&q=' + encodeURIComponent(clip.clip));
  assert.ok(list.body.rows.some(row => row.clip === clip.clip));
  const detail = await get(api, '/api/animations/' + encodeURIComponent(clip.clip));
  assert.equal(detail.body.animation.clip, clip.clip);
});

test('map assets are not published and unknown API routes fail cleanly', async () => {
  const { api } = adapter('/KCD2Wiki');
  assert.ok(!fs.existsSync(path.join(dist, 'maps')));
  assert.ok(!fs.existsSync(path.join(dist, 'data', 'maps.json')));
  assert.equal((await get(api, '/api/unknown')).status, 404);
});
