import { compareResources } from "./domain/comparator";
import { renderHelmChart } from "./boundaries/helm";
import { fetchLiveResources } from "./boundaries/openshift";
import { ComparisonResult, HelmRenderOptions, K8sKind, MODE } from "./domain/types";
import { deriveKindWhitelist } from "./domain/kindWhitelist";

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

/**
 * Default bootstrap comparison: render Helm chart, fetch whitelisted live resources, compare.
 */
export const runBootstrapComparison = async (
  params: ComparisonParams
): Promise<ComparisonOutcome> => {
  const helmResources = await renderHelmChart(
    params.chart,
    params.namespace,
    params.helmRenderOptions
  );
  const whitelistedKinds = deriveKindWhitelist(helmResources);
  const liveResources = await fetchLiveResources(params.namespace, whitelistedKinds, {
    contextLabel: MODE.BOOTSTRAP,
  });
  return {
    whitelistedKinds,
    results: compareResources(
    helmResources,
    liveResources,
    params.strict,
    params.namespace
    ),
  };
};

/**
 * Placeholder for helm-managed strategy.
 * TODO: implement helm-managed comparison (filter to Helm-managed resources or helm diff).
 */
export const runHelmManagedComparison = async (
  _params: ComparisonParams
): Promise<ComparisonOutcome> => {
  throw new Error(`${MODE.HELM_MANAGED} mode is not implemented yet`);
};
