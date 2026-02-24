import type { DiffPath, K8sKind } from './primitives';

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
