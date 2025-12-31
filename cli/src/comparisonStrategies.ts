import { compareResources } from "./domain/comparator";
import { renderHelmChart } from "./boundaries/helm";
import { fetchLiveResources } from "./boundaries/openshift";
import { ComparisonResult, HelmRenderOptions, MODE } from "./domain/types";

interface ComparisonParams {
  chart: string;
  namespace: string;
  strict: boolean;
  helmRenderOptions: HelmRenderOptions;
}

/**
 * Default bootstrap comparison: render Helm chart, fetch all live resources, compare.
 */
export const runBootstrapComparison = (
  params: ComparisonParams
): ComparisonResult[] => {
  const helmResources = renderHelmChart(
    params.chart,
    params.namespace,
    params.helmRenderOptions
  );
  const liveResources = fetchLiveResources(params.namespace, {
    contextLabel: MODE.BOOTSTRAP,
  });
  return compareResources(
    helmResources,
    liveResources,
    params.strict,
    params.namespace
  );
};

/**
 * Placeholder for helm-managed strategy.
 * TODO: implement helm-managed comparison (filter to Helm-managed resources or helm diff).
 */
export const runHelmManagedComparison = (
  _params: ComparisonParams
): ComparisonResult[] => {
  throw new Error(`${MODE.HELM_MANAGED} mode is not implemented yet`);
};
