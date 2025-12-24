import {
  ComparisonResult,
  CountableAction,
  HelmGuardReport,
  Mode,
  ResourceStatus,
} from "./types";

export function buildReport(
  results: ComparisonResult[],
  config: {
    helmChart: string;
    namespace: string;
    strictMode: boolean;
    mode: Mode;
  }
): HelmGuardReport {
  const summary = {
    total: results.length,
    matched: countByStatus(results, "MATCH"),
    drifted: countByStatus(results, "DRIFT"),
    missingLive: countByStatus(results, "MISSING_LIVE"),
    missingHelm: countByStatus(results, "MISSING_HELM"),
    warnings: countByAction(results, "WARN"),
    failures: countByAction(results, "FAIL"),
  };

  return {
    timestamp: new Date().toISOString(),
    config,
    summary,
    results,
  };
}

function countByStatus(
  results: ComparisonResult[],
  status: ResourceStatus
): number {
  return results.filter(r => r.status === status).length;
}

function countByAction(
  results: ComparisonResult[],
  action: CountableAction
): number {
  return results.flatMap(r => r.differences ?? [])
    .filter(d => d.action === action).length;
}
