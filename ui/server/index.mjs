#!/usr/bin/env node
/**
 * Production server: static files + GitLab artifact proxy.
 */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../dist');
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
};

async function proxyToGitLab(res, targetUrl) {
    const headers = {};
    if (process.env.GITLAB_PROXY_TOKEN) headers['PRIVATE-TOKEN'] = process.env.GITLAB_PROXY_TOKEN;

    try {
        const r = await fetch(targetUrl, { headers });
        if (!r.ok && r.status === 401) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'GitLab authentication failed.', hint: 'Set GITLAB_PROXY_TOKEN for private projects.' }));
            return;
        }
        if (!r.ok) console.error(`[proxy] GitLab ${r.status} ${targetUrl}`);
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
        res.end(buf);
    } catch (err) {
        console.error('[proxy]', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy error',
            detail: err.message,
            hint: 'Ensure GitLab is reachable and GITLAB_PROXY_TOKEN is set for private projects.',
        }));
    }
}

async function serveStatic(res, pathname) {
    const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const normalized = normalize(rel);
    const filePath = join(ROOT, normalized);
    if (normalized.startsWith('..') || !filePath.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
    }

    try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        const contentType = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            try {
                const data = await readFile(join(ROOT, 'index.html'));
                res.writeHead(200, { 'Content-Type': 'text/html' }).end(data);
            } catch {
                res.writeHead(404).end();
            }
        } else {
            res.writeHead(500).end();
        }
    }
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/proxy') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid url parameter' }));
            return;
        }
        await proxyToGitLab(res, targetUrl);
        return;
    }

    await serveStatic(res, pathname);
});

server.listen(PORT, '::', () => {
    console.log(`helm-guard UI listening on port ${PORT}`);
});
