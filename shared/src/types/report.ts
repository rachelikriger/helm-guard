import type { Mode, K8sKind } from './common';
import type { ResourceResult } from './result';

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
