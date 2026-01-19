import { DiffPath } from '@helm-guard/shared';

export const normalizePath = (path: DiffPath): DiffPath => {
    if (!path) {
        return '';
    }
    return path
        .split('.')
        .map(segment => segment.trim())
        .filter(segment => segment.length > 0)
        .join('.');
};

export const formatDiffPath = (segments: Array<string | number> | undefined, arrayIndex?: number): DiffPath => {
    if (!Array.isArray(segments)) {
        return '';
    }

    const parts = segments.map(segment => String(segment));
    if (typeof arrayIndex === 'number') {
        parts.push(String(arrayIndex));
    }

    return normalizePath(parts.join('.'));
};
