import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Connect } from 'vite';

const gitlabProxy: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'GET' || !req.url?.startsWith('/proxy')) return next();

    const targetUrl = new URL(req.url ?? '', 'http://_').searchParams.get('url');
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        res.writeHead(400).end();
        return;
    }

    const headers: Record<string, string> = {};
    if (process.env.GITLAB_PROXY_TOKEN) headers['PRIVATE-TOKEN'] = process.env.GITLAB_PROXY_TOKEN;

    fetch(targetUrl, { headers })
        .then(async (r) => {
            if (!r.ok) console.error(`[proxy] GitLab ${r.status}`);
            res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
            res.end(Buffer.from(await r.arrayBuffer()));
        })
        .catch((err) => {
            console.error('[proxy]', err.message);
            res.writeHead(502, { 'Content-Type': 'text/plain' }).end(`Proxy error: ${err.message}`);
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
