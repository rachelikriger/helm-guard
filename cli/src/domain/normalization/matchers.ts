import { ValueMatcher } from './types';

export const matchNullValue: ValueMatcher = (value: unknown): boolean => value === null;

export const matchEmptyObject: ValueMatcher = (value: unknown): boolean => {
    return isPlainObject(value) && Object.keys(value).length === 0;
};

export const matchExactValue =
    <T extends string | number | boolean>(expected: T): ValueMatcher =>
    (value: unknown): boolean =>
        value === expected;

export const matchExactObject =
    <T extends Record<string, unknown>>(expected: T): ValueMatcher =>
    (value: unknown): boolean =>
        isDeepEqual(value, expected);

export const matchObjectWithNullCreationTimestamp: ValueMatcher = (value: unknown): boolean => {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && value.creationTimestamp === null;
};

export const matchDefaultRollingUpdateStrategy: ValueMatcher = (value: unknown): boolean => {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    if (keys.length !== 2) {
        return false;
    }
    if (value.type !== 'RollingUpdate') {
        return false;
    }
    const rollingUpdate = value.rollingUpdate;
    if (!isPlainObject(rollingUpdate)) {
        return false;
    }
    const rollingKeys = Object.keys(rollingUpdate);
    if (rollingKeys.length !== 2) {
        return false;
    }
    return rollingUpdate.maxSurge === '25%' && rollingUpdate.maxUnavailable === '25%';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isDeepEqual = (left: unknown, right: unknown): boolean => {
    if (left === right) {
        return true;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        if (left.length !== right.length) {
            return false;
        }
        return left.every((value, index) => isDeepEqual(value, right[index]));
    }

    if (isPlainObject(left) && isPlainObject(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        return leftKeys.every(key => Object.prototype.hasOwnProperty.call(right, key) && isDeepEqual(left[key], right[key]));
    }

    return false;
};
