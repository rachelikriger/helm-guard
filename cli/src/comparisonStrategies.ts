import { compareResources } from './domain/comparator';
import { renderHelmChart } from './boundaries/helm';
import { fetchLiveResources } from './boundaries/openshift';
import { normalizeResource } from './domain/normalization/resourceNormalizer';
import {
    ComparisonOutcome,
    ComparisonParams,
    K8sKind,
    K8sResource,
    MODE,
} from './domain/types';
import { deriveKindWhitelist } from './domain/kindWhitelist';

const applyNamespaceFallback = (resource: K8sResource, targetNamespace: string): K8sResource => {
    if (resource.metadata.namespace && resource.metadata.namespace.trim().length > 0) {
        return resource;
    }
    return {
        ...resource,
        metadata: {
            ...resource.metadata,
            namespace: targetNamespace.trim(),
        },
    };
};

/**
 * Default bootstrap comparison: render Helm chart, fetch whitelisted live resources, compare.
 */
export const runBootstrapComparison = async (params: ComparisonParams): Promise<ComparisonOutcome> => {
    const rawHelm = await renderHelmChart(params.chart, params.namespace, params.helmRenderOptions, MODE.BOOTSTRAP);
    const whitelistedKinds = deriveKindWhitelist(rawHelm);
    const rawLive = await fetchLiveResources(params.namespace, whitelistedKinds, MODE.BOOTSTRAP);

    const helmResources = rawHelm
        .map(normalizeResource)
        .map(r => applyNamespaceFallback(r, params.namespace));
    const liveResources = rawLive.map(normalizeResource);

    return {
        whitelistedKinds,
        results: compareResources(helmResources, liveResources, params.strict),
    };
};

/**
 * Placeholder for helm-managed strategy.
 * TODO: implement helm-managed comparison (filter to Helm-managed resources or helm diff).
 */
export const runHelmManagedComparison = async (_params: ComparisonParams): Promise<ComparisonOutcome> => {
    throw new Error(`${MODE.HELM_MANAGED} mode is not implemented yet`);
};
