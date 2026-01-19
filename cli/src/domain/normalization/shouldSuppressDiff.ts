import { DiffPath, K8sKind } from '@helm-guard/shared';
import { PLATFORM_DEFAULT_RULES } from './platformDefaultRules';
import { matchEmptyObject, matchObjectWithNullCreationTimestamp } from './matchers';
import { normalizePath } from './path';
import { PlatformDefaultRule } from './types';

export const shouldSuppressDiff = (
    resourceKind: K8sKind,
    path: DiffPath,
    helmValue: unknown,
    liveValue: unknown,
    rules: PlatformDefaultRule[] = PLATFORM_DEFAULT_RULES,
): boolean => {
    return findSuppressingRule(resourceKind, path, helmValue, liveValue, rules) !== undefined;
};

export const findSuppressingRule = (
    resourceKind: K8sKind,
    path: DiffPath,
    helmValue: unknown,
    liveValue: unknown,
    rules: PlatformDefaultRule[] = PLATFORM_DEFAULT_RULES,
): PlatformDefaultRule | undefined => {
    const normalizedPath = normalizePath(path);
    if (!isHelmOmitted(helmValue) || normalizedPath.length === 0) {
        return undefined;
    }

    for (const rule of rules) {
        const normalizedRulePath = normalizePath(rule.path);
        if (!pathMatches(normalizedRulePath, normalizedPath)) {
            continue;
        }
        if (rule.resourceKinds && !rule.resourceKinds.includes(resourceKind)) {
            continue;
        }
        if (!rule.matcher(liveValue)) {
            continue;
        }
        return rule;
    }

    return undefined;
};

const isHelmOmitted = (helmValue: unknown): boolean => {
    if (helmValue === undefined || helmValue === null) {
        return true;
    }
    if (matchEmptyObject(helmValue)) {
        return true;
    }
    return matchObjectWithNullCreationTimestamp(helmValue);
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
