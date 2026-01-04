import { REPORT_SCHEMA_VERSION } from "../../../shared/report-contract";
import type {
  DiffAction as ReportDiffAction,
  DiffItem,
  DiffPath,
  HelmGuardReport,
  Mode,
  ReportConfig,
  ReportNormalizationSummary,
  ReportSchema,
  ReportSelection,
  ReportSummary,
  ResourceIdentifier,
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

export type Difference = DiffItem;

export type ComparisonResult = ResourceResult;

export interface ComparisonOutput {
  results: ComparisonResult[];
  selection: ReportSelection;
  normalization: ReportNormalizationSummary;
}

/* =========================
   Report (shared contract)
   ========================= */

export type {
  DiffItem,
  DiffPath,
  HelmGuardReport,
  ReportSchema,
  ReportConfig,
  ReportNormalizationSummary,
  ReportSelection,
  ReportSummary,
  ResourceIdentifier,
  ResourceStatus,
  ReportDiffAction as DiffAction,
  Mode,
};

export { REPORT_SCHEMA_VERSION };
