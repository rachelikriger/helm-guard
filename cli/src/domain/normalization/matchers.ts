import { ValueMatcher } from './types';

export const matchNullValue: ValueMatcher = (value: unknown): boolean => value === null;

export const matchEmptyObject: ValueMatcher = (value: unknown): boolean => {
    return isPlainObject(value) && Object.keys(value).length === 0;
};

export const matchExactValue =
    <T extends string | number | boolean>(expected: T): ValueMatcher =>
    (value: unknown): boolean =>
        value === expected;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
