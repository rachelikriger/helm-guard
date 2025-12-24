import { compareResources } from "./comparator";
import { renderHelmChart } from "./helm";
import { fetchLiveResources } from "./openshift";
import { ComparisonResult } from "./types";

interface ComparisonParams {
  chart: string;
  namespace: string;
  strict: boolean;
}

/**
 * Default bootstrap comparison: render Helm chart, fetch all live resources, compare.
 */
export function runBootstrapComparison(
  params: ComparisonParams
): ComparisonResult[] {
  const helmResources = renderHelmChart(params.chart, params.namespace);
  const liveResources = fetchLiveResources(params.namespace);
  return compareResources(helmResources, liveResources, params.strict);
}

/**
 * Placeholder for helm-managed strategy.
 * TODO: implement helm-managed comparison (filter to Helm-managed resources or helm diff).
 */
export function runHelmManagedComparison(
  _params: ComparisonParams
): ComparisonResult[] {
  throw new Error("helm-managed mode is not implemented yet");
}
