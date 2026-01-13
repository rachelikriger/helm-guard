import { DiffPath, K8sKind } from '@helm-guard/shared';
import { PLATFORM_DEFAULT_RULES } from './platformDefaultRules';
import { PlatformDefaultRule } from './types';

export const shouldSuppressDiff = (
    resourceKind: K8sKind,
    path: DiffPath,
    helmValue: unknown,
    liveValue: unknown,
    rules: PlatformDefaultRule[] = PLATFORM_DEFAULT_RULES,
): boolean => {
    if (helmValue !== undefined || path.length === 0) {
        return false;
    }

    for (const rule of rules) {
        if (!pathMatches(rule.path, path)) {
            continue;
        }
        if (rule.resourceKinds && !rule.resourceKinds.includes(resourceKind)) {
            continue;
        }
        if (!rule.matcher(liveValue)) {
            continue;
        }
        return true;
    }

    return false;
};

const pathMatches = (rulePath: DiffPath, path: DiffPath): boolean => {
    if (rulePath === path) {
        return true;
    }

    if (!rulePath.includes('*')) {
        return false;
    }

    const pattern = escapeRegExp(rulePath).replace(/\\\*/g, '[0-9]+');
    return new RegExp(`^${pattern}$`).test(path);
};

const escapeRegExp = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
