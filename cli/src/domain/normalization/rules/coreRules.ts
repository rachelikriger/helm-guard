import type { PlatformDefaultRule } from './ruleTypes';
import {
    matchArrayOfStrings,
    matchDefaultRollingUpdateStrategy,
    matchExactObject,
    matchExactValue,
    matchNonEmptyString,
    matchNullValue,
    matchNumber,
    matchOneOfValues,
} from './ruleMatchers';
import { DEPLOYMENT_KINDS, ROUTE_KINDS, SERVICE_KINDS, STATEFULSET_KINDS } from './ruleKinds';

export const coreRules: PlatformDefaultRule[] = [
    // Generic spec defaults
    {
        path: 'spec.nodeSelector',
        matches: matchNullValue,
    },
    {
        path: 'spec.strategy',
        resourceKinds: DEPLOYMENT_KINDS,
        matches: matchDefaultRollingUpdateStrategy,
    },
    {
        path: 'spec.progressDeadlineSeconds',
        resourceKinds: DEPLOYMENT_KINDS,
        matches: matchExactValue(600),
    },
    {
        path: 'spec.revisionHistoryLimit',
        resourceKinds: DEPLOYMENT_KINDS,
        matches: matchExactValue(10),
    },
    // StatefulSet defaults
    {
        path: 'spec.revisionHistoryLimit',
        resourceKinds: STATEFULSET_KINDS,
        matches: matchExactValue(10),
    },
    {
        path: 'spec.persistentVolumeClaimRetentionPolicy',
        resourceKinds: STATEFULSET_KINDS,
        matches: matchExactObject({ whenDeleted: 'Retain', whenScaled: 'Retain' }),
    },
    // Service defaults
    {
        path: 'spec.clusterIP',
        resourceKinds: SERVICE_KINDS,
        matches: matchNonEmptyString,
    },
    {
        path: 'spec.clusterIPs',
        resourceKinds: SERVICE_KINDS,
        matches: matchArrayOfStrings,
    },
    {
        path: 'spec.internalTrafficPolicy',
        resourceKinds: SERVICE_KINDS,
        matches: matchOneOfValues('Cluster', 'Local'),
    },
    {
        path: 'spec.ipFamilyPolicy',
        resourceKinds: SERVICE_KINDS,
        matches: matchOneOfValues('SingleStack', 'PreferDualStack', 'RequireDualStack'),
    },
    {
        path: 'spec.sessionAffinity',
        resourceKinds: SERVICE_KINDS,
        matches: matchExactValue('None'),
    },
    {
        path: 'spec.type',
        resourceKinds: SERVICE_KINDS,
        matches: matchExactValue('ClusterIP'),
    },
    {
        path: 'spec.ipFamilies',
        resourceKinds: SERVICE_KINDS,
        matches: matchArrayOfStrings,
    },
    {
        path: 'spec.ports.*.protocol',
        resourceKinds: SERVICE_KINDS,
        matches: matchExactValue('TCP'),
    },
    {
        path: 'spec.ports.*.nodePort',
        resourceKinds: SERVICE_KINDS,
        matches: matchNumber,
    },
    // Route defaults (OpenShift)
    {
        path: 'spec.host',
        resourceKinds: ROUTE_KINDS,
        matches: matchNonEmptyString,
    },
    {
        path: 'spec.to.weight',
        resourceKinds: ROUTE_KINDS,
        matches: matchExactValue(100),
    },
    {
        path: 'spec.wildcardPolicy',
        resourceKinds: ROUTE_KINDS,
        matches: matchExactValue('None'),
    },
];
