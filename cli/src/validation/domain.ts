import { K8sResource } from '../domain/types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const isK8sResource = (val: unknown): val is K8sResource => {
    if (!isRecord(val)) return false;
    if (typeof val.apiVersion !== 'string') return false;
    if (typeof val.kind !== 'string') return false;

    const meta = val.metadata;
    if (!isRecord(meta)) return false;

    const hasName = typeof meta.name === 'string' && meta.name.trim().length > 0;
    const hasGenerateName = typeof meta.generateName === 'string' && meta.generateName.trim().length > 0;
    if (!hasName && !hasGenerateName) return false;

    return true;
};
