/**
 * Shared types: contract between CLI and UI.
 * Only include types used by BOTH. CLI-only or UI-only types belong in their respective packages.
 */
export { DiffAction, ResourceStatus } from './result';
export { MODE } from './primitives';
export type { DiffPath, K8sKind, Mode } from './primitives';
export type { DiffItem, ResourceIdentifier, ResourceResult } from './result';
export type {
    HelmGuardReport,
    ReportConfig,
    ReportSchema,
    ReportSummary,
} from './report';
