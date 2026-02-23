/**
 * CLI domain types: CLI-specific types + re-exports of shared types used by CLI.
 * Types used only by CLI stay here; shared types used by both CLI and UI live in @helm-guard/shared.
 */
import {
    DiffAction as ReportDiffAction,
    DiffItem,
    HelmGuardReport,
    K8sKind,
    Mode,
    ReportConfig,
    ReportSummary,
    ResourceResult,
    ResourceStatus,
} from '@helm-guard/shared';

/* =========================
   Kubernetes domain types (CLI-only)
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

export interface CliOptions {
    chart: string;
    namespace: string;
    mode?: Mode | string;
    strict: boolean;
    release?: string;
    values: string[];
    set: string[];
    output?: string;
}

export type ComparisonParams = Pick<CliOptions, 'chart' | 'namespace' | 'strict'> & {
    helmRenderOptions: HelmRenderOptions;
};

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

export interface ComparisonOutcome {
    results: ComparisonResult[];
    whitelistedKinds: K8sKind[];
}

/* =========================
   Re-exports from shared
   ========================= */

export type {
    HelmGuardReport,
    ReportConfig,
    ReportSummary,
    ReportDiffAction as DiffAction,
    Mode,
    K8sKind,
};

export { ResourceStatus };
