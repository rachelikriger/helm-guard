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
   Execution modes
   ========================= */

export const MODE = {
  BOOTSTRAP: "bootstrap",
  HELM_MANAGED: "helm-managed",
} as const;

export type Mode = typeof MODE[keyof typeof MODE];

/* =========================
   Diff & comparison domain
   ========================= */

export const DIFF_ACTION = {
  IGNORE: "IGNORE",
  WARN: "WARN",
  FAIL: "FAIL",
} as const;

export type DiffAction =
  typeof DIFF_ACTION[keyof typeof DIFF_ACTION];

/**
 * Actions that are meaningful for summary counters
 * (IGNORE is intentionally excluded)
 */
export type CountableAction =
  Exclude<DiffAction, typeof DIFF_ACTION.IGNORE>;

export const RESOURCE_STATUS = {
  MATCH: "MATCH",
  DRIFT: "DRIFT",
  MISSING_LIVE: "MISSING_LIVE",
  MISSING_HELM: "MISSING_HELM",
} as const;

export type ResourceStatus =
  typeof RESOURCE_STATUS[keyof typeof RESOURCE_STATUS];

/* =========================
   Comparison results
   ========================= */

export interface Difference {
  path: string;
  helmValue?: unknown;
  liveValue?: unknown;
  action: DiffAction;
}

export interface ComparisonResult {
  resourceKey: string;
  status: ResourceStatus;
  differences: Difference[];
}

/* =========================
   Report (CLI → UI contract)
   ========================= */

export interface ReportConfig {
  helmChart: string;
  namespace: string;
  strictMode: boolean;
  mode: Mode;
}

export interface ReportSummary {
  total: number;
  matched: number;
  drifted: number;
  missingLive: number;
  missingHelm: number;
  warnings: number;
  failures: number;
}

export interface HelmGuardReport {
  timestamp: string;
  config: ReportConfig;
  summary: ReportSummary;
  results: ComparisonResult[];
}
