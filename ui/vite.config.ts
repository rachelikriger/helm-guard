import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';

const sendJson = (res: ServerResponse, status: number, body: object) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};

const gitlabProxy: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'GET') return next();
    const url = new URL(req.url ?? '/', 'http://_');
    if (url.pathname !== '/proxy') return next();

    const targetUrl = url.searchParams.get('url');
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        sendJson(res, 400, { error: 'Invalid url parameter' });
        return;
    }

    const headers: Record<string, string> = {};
    if (process.env.GITLAB_PROXY_TOKEN) headers['PRIVATE-TOKEN'] = process.env.GITLAB_PROXY_TOKEN;

    fetch(targetUrl, { headers })
        .then(async (r) => {
            if (!r.ok && r.status === 401) {
                sendJson(res, 401, { error: 'GitLab authentication failed.', hint: 'Set GITLAB_PROXY_TOKEN for private projects.' });
                return;
            }
            if (!r.ok) console.error(`[proxy] GitLab ${r.status} ${targetUrl}`);
            if (!res.writableEnded) {
                res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
                res.end(Buffer.from(await r.arrayBuffer()));
            }
        })
        .catch((err: unknown) => {
            if (!res.writableEnded) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('[proxy]', msg);
                sendJson(res, 502, {
                    error: 'Proxy error',
                    detail: msg,
                    hint: 'Ensure GitLab is reachable and GITLAB_PROXY_TOKEN is set for private projects.',
                });
            }
        });
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
    server: { host: '::', port: 8080 },
    plugins: [
        react(),
        { name: 'gitlab-proxy', configureServer(s) { s.middlewares.use(gitlabProxy); } },
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
