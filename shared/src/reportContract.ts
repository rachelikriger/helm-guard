export type Mode = 'bootstrap' | 'helm-managed';

export type K8sKind = string;

export const DiffAction = {
    WARN: 'WARN',
    FAIL: 'FAIL',
} as const;

export type DiffAction = (typeof DiffAction)[keyof typeof DiffAction];

export const ResourceStatus = {
    MATCH: 'MATCH',
    DRIFT: 'DRIFT',
    MISSING_LIVE: 'MISSING_LIVE',
    MISSING_HELM: 'MISSING_HELM',
} as const;

export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];

export type DiffPath = string;

export interface DiffItem {
    path: DiffPath;
    helmValue?: unknown;
    liveValue?: unknown;
    action: DiffAction;
}

export interface ResourceIdentifier {
    kind: K8sKind;
    namespace: string;
    name: string;
}

export interface ResourceResult {
    resourceKey: string;
    status: ResourceStatus;
    differences: DiffItem[];
}

export interface ReportConfig {
    helmChart: string;
    namespace: string;
    strictMode: boolean;
    mode: Mode;
    releaseName?: string;
    valuesFiles?: string[];
    whitelistedKinds?: K8sKind[];
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

export interface ReportSchema {
    schemaVersion: 1;
    timestamp: string;
    config: ReportConfig;
    summary: ReportSummary;
    results: ResourceResult[];
}

export type HelmGuardReport = ReportSchema;
