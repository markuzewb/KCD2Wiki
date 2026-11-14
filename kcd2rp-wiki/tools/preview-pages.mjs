#!/usr/bin/env node
/** Local preview under the same repository subpath used by GitHub Pages. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'pages');
const base = '/' + String(process.env.PAGES_BASE_PATH || 'KCD2Wiki').replace(/^\/+|\/+$/g, '');
const port = Number(process.env.PORT || 3082);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run build:pages first.');
http.createServer((request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end('Read-only preview'); return; }
  const pathname = new URL(request.url, 'http://preview.local').pathname;
  if (pathname === '/' || pathname === base) { response.writeHead(302, { Location: base + '/' }); response.end(); return; }
  if (!pathname.startsWith(base + '/')) { response.writeHead(404); response.end('Not found'); return; }
  let relative;
  try { relative = decodeURIComponent(pathname.slice(base.length + 1)); } catch { response.writeHead(400); response.end('Bad path'); return; }
  const file = path.resolve(root, relative || 'index.html');
  if (!file.startsWith(root + path.sep) || relative.split('/').includes('..')) { response.writeHead(403); response.end('Forbidden'); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
    const ext = path.extname(file);
    response.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).pipe(response);
  });
}).listen(port, '0.0.0.0', () => console.log(`GitHub Pages preview: http://0.0.0.0:${port}${base}/`));
