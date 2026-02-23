import { compareResources } from './domain/comparator';
import { renderHelmChart } from './boundaries/helm';
import { fetchLiveResources } from './boundaries/openshift';
import { normalizeResource } from './domain/normalization/resourceNormalizer';
import { ComparisonResult, HelmRenderOptions, K8sKind, K8sResource, MODE } from './domain/types';
import { deriveKindWhitelist } from './domain/kindWhitelist';

interface ComparisonParams {
    chart: string;
    namespace: string;
    strict: boolean;
    helmRenderOptions: HelmRenderOptions;
}

interface ComparisonOutcome {
    results: ComparisonResult[];
    whitelistedKinds: K8sKind[];
}

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

const isNamespaceMatch = (resource: K8sResource, targetNamespace: string): boolean => {
    const namespace = resource.metadata.namespace?.trim();
    return namespace === targetNamespace.trim();
};

/**
 * Default bootstrap comparison: render Helm chart, fetch whitelisted live resources, compare.
 */
export const runBootstrapComparison = async (params: ComparisonParams): Promise<ComparisonOutcome> => {
    const rawHelm = await renderHelmChart(params.chart, params.namespace, params.helmRenderOptions);
    const whitelistedKinds = deriveKindWhitelist(rawHelm);
    const rawLive = await fetchLiveResources(params.namespace, whitelistedKinds, {
        contextLabel: MODE.BOOTSTRAP,
    });

    const helmResources = rawHelm
        .map(normalizeResource)
        .map(r => applyNamespaceFallback(r, params.namespace));
    const liveResources = rawLive
        .map(normalizeResource)
        .filter(r => isNamespaceMatch(r, params.namespace));

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
