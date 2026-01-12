import {
    DiffAction as ReportDiffAction,
    DiffItem,
    DiffPath,
    HelmGuardReport,
    K8sKind,
    Mode,
    NormalizationRule,
    ReportConfig,
    ReportSummary,
    ResourceIdentifier,
    ResourceResult,
    ResourceStatus,
} from '@helm-guard/shared';

/* =========================
   Kubernetes domain types
   ========================= */

export interface K8sResource {
    apiVersion: string;
    kind: K8sKind;
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
    setValues?: string[];
}

/* =========================
   Execution modes
   ========================= */

export const MODE = {
    BOOTSTRAP: 'bootstrap',
    HELM_MANAGED: 'helm-managed',
} as const;

/* =========================
   Diff & comparison domain
   ========================= */

export const DIFF_ACTION = {
    IGNORE: 'IGNORE',
    WARN: ReportDiffAction.WARN,
    FAIL: ReportDiffAction.FAIL,
} as const;

export type DiffActionInternal = (typeof DIFF_ACTION)[keyof typeof DIFF_ACTION];

/**
 * Actions that are meaningful for summary counters
 * (IGNORE is intentionally excluded)
 */
export type CountableAction = ReportDiffAction;

/* =========================
   Comparison results
   ========================= */

export type Difference = DiffItem;

export type ComparisonResult = ResourceResult;

/* =========================
   Report (shared contract)
   ========================= */

export type {
    HelmGuardReport,
    ReportConfig,
    ReportSummary,
    ResourceIdentifier,
    ReportDiffAction as DiffAction,
    Mode,
    K8sKind,
    NormalizationRule,
    DiffPath,
};

export { ResourceStatus };
