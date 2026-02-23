/**
 * UI report types: re-exports from @helm-guard/shared.
 * UI-specific types belong here; shared types used by both CLI and UI live in @helm-guard/shared.
 */
import { DiffAction, ResourceStatus } from '@helm-guard/shared';
import type {
    DiffItem,
    DiffPath,
    HelmGuardReport,
    ReportSchema,
    ReportConfig,
    ReportSummary,
    ResourceIdentifier,
    ResourceResult,
} from '@helm-guard/shared';

export type {
    DiffItem,
    DiffPath,
    HelmGuardReport,
    ReportSchema,
    ReportConfig,
    ReportSummary,
    ResourceIdentifier,
    ResourceResult,
};

export { DiffAction, ResourceStatus };
