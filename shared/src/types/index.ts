/**
 * Shared types: contract between CLI and UI.
 * Only include types used by BOTH. CLI-only or UI-only types belong in their respective packages.
 */
export { DiffAction, ResourceStatus } from './result';
export type { DiffPath, K8sKind, Mode } from './common';
export type { DiffItem, ResourceIdentifier, ResourceResult } from './result';
export type {
    HelmGuardReport,
    ReportConfig,
    ReportSchema,
    ReportSummary,
} from './report';
