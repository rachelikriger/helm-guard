/**
 * Resource cleanup only.
 * Do NOT add platform default suppression here.
 * Platform defaults live under domain/normalization.
 */

import { K8sResource } from '../types';

const IGNORED_METADATA_FIELDS = ['uid', 'resourceVersion', 'generation', 'managedFields'];

const IGNORED_METADATA_ANNOTATIONS = new Set([
    'deployment.kubernetes.io/revision',
    'kubectl.kubernetes.io/last-applied-configuration',
    'meta.helm.sh/release-name',
    'meta.helm.sh/release-namespace',
]);

type ResourceNormalizer = (resource: K8sResource) => K8sResource;

export const normalizeResource: ResourceNormalizer = (resource: K8sResource): K8sResource => {
    const clone = structuredClone(resource);

    delete clone.status;

    for (const field of IGNORED_METADATA_FIELDS) {
        delete clone.metadata[field];
    }

    if (clone.metadata.annotations) {
        for (const key of Object.keys(clone.metadata.annotations)) {
            if (key.startsWith('openshift.io')) {
                delete clone.metadata.annotations[key];
                continue;
            }
            if (IGNORED_METADATA_ANNOTATIONS.has(key)) {
                delete clone.metadata.annotations[key];
            }
        }
    }

    normalizeArrays(clone);
    return clone;
};

const normalizeArrays = (obj: unknown): void => {
    if (Array.isArray(obj)) {
        if (isSortableByName(obj)) {
            obj.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        }
        obj.forEach(normalizeArrays);
    } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(normalizeArrays);
    }
};

function isSortableByName(arr: unknown[]): arr is Array<{ name: unknown }> {
    return arr.every(isObjectWithName);
}

function isObjectWithName(value: unknown): value is { name: unknown } {
    return typeof value === 'object' && value !== null && 'name' in value;
}
