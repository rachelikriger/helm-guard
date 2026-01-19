import { DiffPath, K8sKind } from '@helm-guard/shared';
import { matchEmptyObject, matchObjectWithNullCreationTimestamp, PLATFORM_DEFAULT_RULES } from './platformDefaultRules';
import { semanticallyEqual } from './equality';
import { normalizePath } from './path';

export type DiffContext = Readonly<{
    resourceKind: K8sKind;
    path: DiffPath;
    helmValue: unknown;
    liveValue: unknown;
}>;

/**
 * Single authoritative gate for diff inclusion:
 * 1) valid path
 * 2) semantic equality
 * 3) platform default suppression
 */
export const shouldIncludeDiff = ({ resourceKind, path, helmValue, liveValue }: DiffContext): boolean => {
    const normalizedPath = normalizePath(path);
    if (normalizedPath.length === 0) {
        return false;
    }
    if (semanticallyEqual(helmValue, liveValue)) {
        return false;
    }
    const helmOmitted =
        helmValue === undefined ||
        helmValue === null ||
        matchEmptyObject(helmValue) ||
        matchObjectWithNullCreationTimestamp(helmValue);
    if (!helmOmitted) {
        return true;
    }

    for (const rule of PLATFORM_DEFAULT_RULES) {
        const normalizedRulePath = normalizePath(rule.path);
        if (normalizedRulePath !== normalizedPath) {
            if (!normalizedRulePath.includes('*')) {
                continue;
            }
            if (!toWildcardRegex(normalizedRulePath).test(normalizedPath)) {
                continue;
            }
        }
        if (rule.resourceKinds && !rule.resourceKinds.includes(resourceKind)) {
            continue;
        }
        if (!rule.matches(liveValue)) {
            continue;
        }
        return false;
    }

    return true;
};

const toWildcardRegex = (pattern: DiffPath): RegExp => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withWildcards = escaped.replace(/\\\*/g, '[0-9]+');
    return new RegExp(`^${withWildcards}$`);
};
