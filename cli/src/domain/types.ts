import type {
  DiffAction as ReportDiffAction,
  HelmGuardReport,
  Mode,
  ReportConfig,
  ReportSummary,
  ResourceDiff,
  ResourceResult,
  ResourceStatus,
} from "../../../shared/report-contract";

/* =========================
   Kubernetes domain types
   ========================= */

export interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  spec?: unknown;
  [key: string]: unknown;
}

/* =========================
   Helm rendering options
   ========================= */

export interface HelmRenderOptions {
  releaseName?: string;
  valuesFiles?: string[];
}

/* =========================
   Execution modes
   ========================= */

export const MODE = {
  BOOTSTRAP: "bootstrap",
  HELM_MANAGED: "helm-managed",
} as const;

/* =========================
   Diff & comparison domain
   ========================= */

export const DIFF_ACTION = {
  IGNORE: "IGNORE",
  WARN: "WARN",
  FAIL: "FAIL",
} as const;

export type DiffActionInternal =
  typeof DIFF_ACTION[keyof typeof DIFF_ACTION];

/**
 * Actions that are meaningful for summary counters
 * (IGNORE is intentionally excluded)
 */
export type CountableAction = ReportDiffAction;

export const RESOURCE_STATUS = {
  MATCH: "MATCH",
  DRIFT: "DRIFT",
  MISSING_LIVE: "MISSING_LIVE",
  MISSING_HELM: "MISSING_HELM",
} as const;

/* =========================
   Comparison results
   ========================= */

export type Difference = ResourceDiff;

export type ComparisonResult = ResourceResult;

/* =========================
   Report (shared contract)
   ========================= */

export type {
  HelmGuardReport,
  ReportConfig,
  ReportSummary,
  ResourceStatus,
  ReportDiffAction as DiffAction,
  Mode,
};
