import { ComparisonResult } from "./types";

export interface HelmGuardReport {
  timestamp: string;
  config: {
    helmChart: string;
    namespace: string;
    strictMode: boolean;
  };
  summary: {
    total: number;
    matched: number;
    drifted: number;
    missingLive: number;
    missingHelm: number;
    warnings: number;
    failures: number;
  };
  results: ComparisonResult[];
}

export function buildReport(
  results: ComparisonResult[],
  config: {
    helmChart: string;
    namespace: string;
    strictMode: boolean;
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
  status: ComparisonResult["status"]
): number {
  return results.filter(r => r.status === status).length;
}

function countByAction(
  results: ComparisonResult[],
  action: "WARN" | "FAIL"
): number {
  return results.flatMap(r => r.differences ?? [])
    .filter(d => d.action === action).length;
}
