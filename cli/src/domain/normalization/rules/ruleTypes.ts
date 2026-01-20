import type { DiffPath, K8sKind } from '@helm-guard/shared';

export type PlatformDefaultRule = Readonly<{
    path: DiffPath;
    matches: (value: unknown) => boolean;
    resourceKinds?: readonly K8sKind[];
}>;
