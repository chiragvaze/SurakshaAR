#!/usr/bin/env node
/*
 * Zero-dependency static server for local development and phone testing.
 *   npm start                 -> http://127.0.0.1:5173
 *   npm run start:lan         -> listen on all interfaces (open from a phone on the same Wi-Fi)
 *   node tools/serve.js --port 8080
 * Sends a strict Content-Security-Policy so any accidental external request is blocked.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const PORT = Number(arg('port', process.env.PORT || 5173));
const HOST = arg('host', '127.0.0.1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};
const BLOCKED = /^(node_modules|tests|tools)(\/|$)|(^|\/)\./;

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');

const server = http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  } catch (e) {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (rel === '') rel = 'index.html';
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || BLOCKED.test(rel.replace(/\\/g, '/'))) {
    res.writeHead(404).end('Not found');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`SurakshaAR web app: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
  if (HOST === '0.0.0.0') console.log('Listening on all interfaces: open http://<this-computer-LAN-IP>:' + PORT + '/ on the phone.');
});
