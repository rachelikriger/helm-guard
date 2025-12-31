import {
  ComparisonResult,
  CountableAction,
  DIFF_ACTION,
  HelmGuardReport,
  RESOURCE_STATUS,
  ReportConfig,
  ResourceStatus,
} from "./types";
import { classifyResourceKey } from "../../../shared/resource-scope";

export const buildReport = (
  results: ComparisonResult[],
  config: ReportConfig
): HelmGuardReport => {
  const namespaceResults = results.filter(result => {
    const scope = classifyResourceKey(result.resourceKey, config.namespace).scope;
    return scope !== "cluster";
  });
  const summary = {
    total: namespaceResults.length,
    matched: countByStatus(namespaceResults, RESOURCE_STATUS.MATCH),
    drifted: countByStatus(namespaceResults, RESOURCE_STATUS.DRIFT),
    missingLive: countByStatus(namespaceResults, RESOURCE_STATUS.MISSING_LIVE),
    missingHelm: countByStatus(namespaceResults, RESOURCE_STATUS.MISSING_HELM),
    warnings: countByAction(namespaceResults, DIFF_ACTION.WARN),
    failures: countByAction(namespaceResults, DIFF_ACTION.FAIL),
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
