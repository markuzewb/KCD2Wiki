/* Read-only API adapter for the static GitHub Pages build. Not loaded by server.js. */
(function () {
  'use strict';
  const scope = typeof window === 'undefined' ? globalThis : window;
  const base = String(scope.KCD2RP_WIKI_BASE || '').replace(/\/+$/, '');
  const nativeFetch = scope.fetch.bind(scope);
  const cache = new Map();
  const text = value => String(value ?? '').trim().toLocaleLowerCase('ru-RU');
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
  const readOnlyMessage = 'Версия GitHub Pages доступна только для чтения. Для редактирования запустите Node-версию Wiki.';
  const guid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

  function load(name) {
    if (!cache.has(name)) {
      const pending = nativeFetch(base + '/data/' + name + '.json', { cache: 'no-cache' })
        .then(async response => {
          if (!response.ok) throw new Error('Не удалось загрузить данные: ' + name + ' (' + response.status + ')');
          return response.json();
        })
        .catch(error => { cache.delete(name); throw error; });
      cache.set(name, pending);
    }
    return cache.get(name);
  }

  function bound(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback;
  }
  function pageOf(rows, query, defaultLimit = 24) {
    const page = bound(query.get('page'), 1, 10000, 1);
    const limit = bound(query.get('limit'), 1, 80, defaultLimit);
    return { page, limit, total: rows.length, pages: Math.max(1, Math.ceil(rows.length / limit)), rows: rows.slice((page - 1) * limit, page * limit) };
  }
  function itemImage(id, game, matches) {
    const key = String(id || '').toLowerCase();
    return game.media?.[key] || matches.items[key]?.path || null;
  }
  function itemSummary(item, game, matches) {
    const custom = game.media?.[item.id.toLowerCase()];
    return { ...item, imageUrl: itemImage(item.id, game, matches), iconMatch: custom ? null : matches.items[item.id.toLowerCase()]?.match || null };
  }
  function recipeSummary(recipe, game, matches) {
    return {
      id: recipe.id, name: recipe.name, kind: recipe.kind, craft: recipe.craft, craftName: recipe.craftName,
      level: recipe.level, amount: recipe.amount, output: recipe.output, ingredientsCount: recipe.ingredients.length,
      outputImageUrl: recipe.output?.id ? itemImage(recipe.output.id, game, matches) : null
    };
  }
  function gameData() {
    return Promise.all([load('game'), load('item-icon-map')]).then(([game, matches]) => ({ game, matches }));
  }

  async function route(url) {
    const path = url.pathname;
    const query = url.searchParams;
    if (path === '/api/content') return json(await load('content'));
    if (path === '/api/me') return json({ admin: false, readOnly: true });

    if (path === '/api/icons/meta') {
      const [icons, matches] = await Promise.all([load('icons'), load('item-icon-map')]);
      return json({ total: icons.total, categories: icons.categories, matched: matches.matchedCount, itemsInCatalog: matches.itemCount, matchTypes: matches.counts, source: icons.source });
    }
    if (path === '/api/icons') {
      const data = await load('icons');
      const category = String(query.get('category') || '').trim();
      const search = text(query.get('q'));
      if (category && !Object.prototype.hasOwnProperty.call(data.categories, category)) return json({ error: 'Неизвестный раздел иконок' }, 400);
      const rows = data.icons.filter(icon => (!category || icon.category === category) && (!search || text(icon.id + ' ' + icon.category + ' ' + icon.file).includes(search)));
      const page = pageOf(rows, query, 48);
      return json({ ...page, rows: page.rows.map(({ id, category, path, w, h }) => ({ id, category, path, width: w, height: h })) });
    }

    if (path === '/api/animations/meta') {
      const data = await load('animations');
      return json({ count: data.clips.length, families: data.families, cats: data.cats || {}, catalog: data.catalog || [], kinds: data.kinds || {}, phases: data.phases || {}, poses: data.poses || {}, source: data.source, imported: data.imported });
    }
    if (path === '/api/animations') {
      const data = await load('animations');
      const search = text(query.get('q'));
      const family = query.get('family') || '';
      const cat = query.get('cat') || '';
      const sub = query.get('sub') || '';
      const kind = query.get('kind') || '';
      const phase = query.get('phase') || '';
      const pose = query.get('pose') || '';
      const rows = data.clips.filter(clip =>
        (!search || text([clip.clip, clip.ru || '', clip.desc || '', ...(clip.tags || []), ...clip.families, ...clip.fragments].join(' ')).includes(search)) &&
        (!family || clip.families.includes(family)) &&
        (!cat || clip.cat === cat) && (!sub || clip.sub === sub) &&
        (!kind || clip.kind === kind) && (!phase || clip.phase === phase) && (!pose || clip.pose === pose));
      return json({ ...pageOf(rows, query, 30), families: data.families, cats: data.cats || {} });
    }
    const animation = path.match(/^\/api\/animations\/([^/]+)$/);
    if (animation) {
      const data = await load('animations');
      const clip = decodeURIComponent(animation[1]);
      const found = data.clips.find(row => row.clip === clip);
      return found ? json({ animation: found }) : json({ error: 'Анимация не найдена' }, 404);
    }
    if (path === '/api/maps/meta') return json(await load('maps'));

    if (path === '/api/game/meta') {
      const { game } = await gameData();
      return json({ meta: game.meta });
    }
    if (path === '/api/game/items') {
      const { game, matches } = await gameData();
      const search = text(query.get('q'));
      const role = query.get('role') || 'all';
      const cat = query.get('cat') || '';
      const rows = game.items.filter(item =>
        (!search || text([item.name, item.english, item.internal, item.id].join(' ')).includes(search)) &&
        (!cat || item.category === cat) &&
        (role !== 'result' || item.recipeOutputs) &&
        (role !== 'ingredient' || item.recipeUses) &&
        (role !== 'priced' || item.referencePrice != null)
      );
      const page = pageOf(rows, query);
      return json({ ...page, rows: page.rows.map(item => itemSummary(item, game, matches)), meta: game.meta });
    }
    if (path === '/api/game/recipes') {
      const { game, matches } = await gameData();
      const search = text(query.get('q'));
      const craft = query.get('craft') || '';
      const kind = query.get('kind') || '';
      const level = query.get('level') || '';
      const rows = game.recipes.filter(recipe =>
        (!search || text([recipe.id, recipe.name, recipe.craft, recipe.craftName, ...recipe.ingredients.map(item => item.name), ...recipe.outputs.map(item => item.name)].join(' ')).includes(search)) &&
        (!craft || recipe.craft === craft) && (!kind || recipe.kind === kind) && (!level || String(recipe.level) === level)
      );
      return json({ ...pageOf(rows, query), rows: pageOf(rows, query).rows.map(recipe => recipeSummary(recipe, game, matches)), meta: game.meta });
    }
    const item = path.match(/^\/api\/game\/items\/([^/]+)$/);
    if (item) {
      const { game, matches } = await gameData();
      const id = decodeURIComponent(item[1]).toLowerCase();
      const found = guid.test(id) && game.items.find(row => row.id.toLowerCase() === id);
      if (!found) return json({ error: 'Предмет не найден' }, 404);
      const related = game.recipes.filter(recipe => recipe.outputs.some(row => row.id === found.id) || recipe.ingredients.some(row => row.id === found.id)).slice(0, 40);
      const stats = await load('item-stats').then(data => data.items[found.id.toLowerCase()] || []).catch(() => []);
      return json({ item: { ...itemSummary(found, game, matches), stats }, related: related.map(recipe => recipeSummary(recipe, game, matches)), meta: game.meta });
    }
    const recipe = path.match(/^\/api\/game\/recipes\/([^/]+)$/);
    if (recipe) {
      const { game, matches } = await gameData();
      const id = decodeURIComponent(recipe[1]);
      const found = game.recipes.find(row => row.id === id);
      if (!found) return json({ error: 'Рецепт не найден' }, 404);
      return json({
        recipe: {
          ...found,
          outputs: found.outputs.map(row => ({ ...row, imageUrl: row.id ? itemImage(row.id, game, matches) : null })),
          ingredients: found.ingredients.map(row => ({ ...row, imageUrl: row.id ? itemImage(row.id, game, matches) : null }))
        },
        meta: game.meta
      });
    }
    return json({ error: 'В статической версии этот запрос недоступен' }, 404);
  }

  scope.KCD2RPStaticAPI = {
    async fetch(input, options = {}) {
      const method = String(options.method || 'GET').toUpperCase();
      if (method !== 'GET' && method !== 'HEAD') return json({ error: readOnlyMessage }, 403);
      try {
        const url = new URL(typeof input === 'string' ? input : input.url, 'https://wiki.local');
        if (base && (url.pathname === base || url.pathname.startsWith(base + '/'))) url.pathname = url.pathname.slice(base.length) || '/';
        if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
        const response = await route(url);
        return method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
      } catch (error) {
        return json({ error: error.message || 'Ошибка загрузки статических данных' }, 503);
      }
    }
  };
})();
