import fs from 'fs';
import { HelmRenderOptions, MODE, Mode } from '../domain/types';

export const parseMode = (value: unknown): Mode => {
    if (value === MODE.BOOTSTRAP || value === MODE.HELM_MANAGED) return value;
    throw new Error(`Invalid CLI input: Mode must be either "${MODE.BOOTSTRAP}" or "${MODE.HELM_MANAGED}"`);
};

export const validateChartAndNamespace = (chart: string, namespace: string): void => {
    if (!chart || !fs.existsSync(chart)) {
        throw new Error(`Invalid CLI input: Chart path does not exist: ${chart}`);
    }

    if (!namespace || !namespace.trim()) {
        throw new Error('Invalid CLI input: Namespace is required and cannot be empty');
    }
};

export const validateHelmRenderOptions = (
    releaseName?: string,
    valuesFiles?: string[],
    setValues?: string[],
): HelmRenderOptions => {
    const options: HelmRenderOptions = {};

    if (releaseName !== undefined) {
        const name = typeof releaseName === 'string' ? releaseName : String(releaseName ?? '');
        if (!name.trim()) {
            throw new Error('Invalid CLI input: Release name must be a non-empty string');
        }
        if (/\s/.test(name)) {
            throw new Error(
                'Invalid CLI input: Release name cannot contain spaces (must follow Kubernetes DNS-1123)',
            );
        }
        options.releaseName = name;
    }

    if (valuesFiles && valuesFiles.length > 0) {
        for (const valuesFile of valuesFiles) {
            if (!fs.existsSync(valuesFile)) {
                throw new Error(`Invalid CLI input: Values file does not exist: ${valuesFile}`);
            }
        }
        options.valuesFiles = valuesFiles;
    }

    if (setValues && setValues.length > 0) {
        for (const setValue of setValues) {
            if (!setValue.trim()) {
                throw new Error('Invalid CLI input: --set values must be non-empty');
            }
        }
        options.setValues = setValues;
    }

    return options;
};
