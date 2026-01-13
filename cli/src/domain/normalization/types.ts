import { DiffPath, K8sKind } from '@helm-guard/shared';

export type ValueMatcher = (value: unknown) => boolean;

export type PlatformDefaultRule = Readonly<{
    path: DiffPath;
    reason: string;
    matcher: ValueMatcher;
    expectation: string;
    resourceKinds?: readonly K8sKind[];
}>;
