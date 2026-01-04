import {
  ComparisonResult,
  CountableAction,
  DIFF_ACTION,
  HelmGuardReport,
  RESOURCE_STATUS,
  ReportConfig,
  ResourceStatus,
} from "./types";

export const buildReport = (
  results: ComparisonResult[],
  config: ReportConfig
): HelmGuardReport => {
  const summary = {
    total: results.length,
    matched: countByStatus(results, RESOURCE_STATUS.MATCH),
    drifted: countByStatus(results, RESOURCE_STATUS.DRIFT),
    missingLive: countByStatus(results, RESOURCE_STATUS.MISSING_LIVE),
    missingHelm: countByStatus(results, RESOURCE_STATUS.MISSING_HELM),
    warnings: countByAction(results, DIFF_ACTION.WARN),
    failures:
      countByAction(results, DIFF_ACTION.FAIL) +
      countByStatus(results, RESOURCE_STATUS.MISSING_LIVE) +
      countByStatus(results, RESOURCE_STATUS.MISSING_HELM),
  };

  return {
    timestamp: new Date().toISOString(),
    config,
    summary,
    results,
  };
};

const countByStatus = (
  results: ComparisonResult[],
  status: ResourceStatus
): number => {
  return results.filter(r => r.status === status).length;
};

const countByAction = (
  results: ComparisonResult[],
  action: CountableAction
): number => {
  return results.flatMap(r => r.differences)
    .filter(d => d.action === action).length;
};
