import equal from 'fast-deep-equal';
import { isPlainObject } from '../equality';

export const matchNullValue = (value: unknown): boolean => {
    return value === null;
};

export const matchNullOrTimestamp = (value: unknown): boolean => {
    return value === null || (typeof value === 'string' && value.length > 0);
};

export const matchEmptyObject = (value: unknown): boolean => {
    return isPlainObject(value) && Object.keys(value).length === 0;
};

export const matchNullOrEmpty = (value: unknown): boolean => {
    return value === null || matchEmptyObject(value);
};

export const matchExactValue = <T extends string | number | boolean>(expected: T) => {
    return (value: unknown): boolean => value === expected;
};

export const matchOneOfValues = <T extends string | number | boolean>(...expected: T[]) => {
    return (value: unknown): boolean => expected.includes(value as T);
};

export const matchExactObject = <T extends Record<string, unknown>>(expected: T) => {
    return (value: unknown): boolean => equal(value, expected);
};

export const matchNonEmptyString = (value: unknown): boolean => {
    return typeof value === 'string' && value.length > 0;
};

export const matchArrayOfStrings = (value: unknown): boolean => {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
};

export const matchNumber = (value: unknown): boolean => {
    return typeof value === 'number' && Number.isFinite(value);
};

export const matchObjectWithNullCreationTimestamp = (value: unknown): boolean => {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && value.creationTimestamp === null;
};

export const matchObjectWithRestartedAt = (value: unknown): boolean => {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && typeof value['kubectl.kubernetes.io/restartedAt'] === 'string';
};

export const matchDefaultRollingUpdateStrategy = (value: unknown): boolean => {
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
