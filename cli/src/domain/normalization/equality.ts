export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const semanticallyEqual = (left: unknown, right: unknown): boolean => {
    if (left === right) {
        return true;
    }

    if (left === null || right === null || left === undefined || right === undefined) {
        return false;
    }

    if (typeof left === 'number' && typeof right === 'string') {
        return isNumericString(right) && left === Number(right);
    }
    if (typeof left === 'string' && typeof right === 'number') {
        return isNumericString(left) && right === Number(left);
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        if (left.length !== right.length) {
            return false;
        }
        return left.every((value, index) => semanticallyEqual(value, right[index]));
    }

    if (isPlainObject(left) && isPlainObject(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        return leftKeys.every(
            key => Object.prototype.hasOwnProperty.call(right, key) && semanticallyEqual(left[key], right[key]),
        );
    }

    return false;
};

const isNumericString = (value: string): boolean => {
    return /^-?\d+(\.\d+)?$/.test(value.trim());
};
