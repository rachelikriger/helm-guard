import { safeParseReport } from '@helm-guard/shared';
import type { HelmGuardReport } from '@/types/report';
import type { SafeParseReportFailure } from '@helm-guard/shared';

const PROXY_ENDPOINT = '/proxy';

async function parseProxyError(response: Response): Promise<string> {
    let msg = `Failed to fetch report (${response.status})`;
    try {
        const body = await response.json();
        const main = body.detail ?? body.error;
        if (main) msg = main;
        if (body.hint) msg += ` — ${body.hint}`;
        if (response.status === 502) console.warn('[proxy 502]', body);
    } catch {
        // Response body isn't JSON; keep generic message
    }
    return msg;
}

function formatZodError(error: SafeParseReportFailure['error']): string {
    const first = error.issues[0];
    if (!first) return 'Invalid report format';
    const path = first.path.length ? first.path.join('.') : 'root';
    return `${path}: ${first.message}`;
}

export async function fetchReportFromUrl(url: string): Promise<HelmGuardReport> {
    const response = await fetch(`${PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error(await parseProxyError(response));
    }

    const data = await response.json();
    const parsed = safeParseReport(data);
    if (!parsed.success) {
        throw new Error(formatZodError((parsed as SafeParseReportFailure).error));
    }
    return parsed.data;
}
