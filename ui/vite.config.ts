import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Connect } from 'vite';

const proxyMiddleware: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'GET' || !req.url?.startsWith('/proxy')) return next();

    const parsed = new URL(req.url, 'http://localhost');
    const targetUrl = parsed.searchParams.get('url');
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        res.writeHead(400).end();
        return;
    }

    const token = process.env.GITLAB_PROXY_TOKEN || parsed.searchParams.get('token');
    const headers: Record<string, string> = {};
    if (token) headers['PRIVATE-TOKEN'] = token;

    fetch(targetUrl, { headers })
        .then(async (r) => {
            if (!r.ok) {
                const text = await r.text();
                console.error(`[proxy] GitLab returned ${r.status}: ${text.slice(0, 200)}`);
            }
            res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
            const buf = await r.arrayBuffer();
            res.end(Buffer.from(buf));
        })
        .catch((err) => {
            console.error('[proxy] Fetch failed:', err.message);
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end(`Proxy error: ${err.message}`);
        });
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
    server: {
        host: '::',
        port: 8080,
    },
    plugins: [
        react(),
        {
            name: 'proxy-middleware',
            configureServer(server) {
                server.middlewares.use(proxyMiddleware);
            },
        },
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        include: ['@helm-guard/shared'],
    },
    build: {
        commonjsOptions: {
            include: [
                /node_modules/,
                /shared[\\/]dist/,
            ],
        },
    },
}));
