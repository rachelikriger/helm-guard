import { DiffPath, NormalizationRule } from './types';
import { PLATFORM_DEFAULT_RULES } from './platformDefaultRules';

export const shouldSuppressDiff = (
    path: DiffPath,
    helmValue: unknown,
    liveValue: unknown,
    rules: NormalizationRule[] = PLATFORM_DEFAULT_RULES,
): boolean => {
    if (helmValue !== undefined) {
        return false;
    }

    const rule = rules.find(candidate => candidate.path === path);
    if (!rule) {
        return false;
    }

    return isDeepEqual(liveValue, rule.defaultValue);
};

const isDeepEqual = (left: unknown, right: unknown): boolean => {
    if (Object.is(left, right)) {
        return true;
    }

    if (typeof left !== typeof right) {
        return false;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        if (left.length !== right.length) {
            return false;
        }
        return left.every((value, index) => isDeepEqual(value, right[index]));
    }

    if (isPlainObject(left) && isPlainObject(right)) {
        const leftKeys = Object.keys(left).sort();
        const rightKeys = Object.keys(right).sort();
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        return leftKeys.every((key, index) => {
            if (key !== rightKeys[index]) {
                return false;
            }
            return isDeepEqual(left[key], right[key]);
        });
    }

    return false;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
