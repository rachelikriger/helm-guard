import { DiffPath, K8sKind } from '@helm-guard/shared';
import { deepEqual } from './equality';

type ValueMatcher = (value: unknown) => boolean;

export type PlatformDefaultRule = Readonly<{
    path: DiffPath;
    matches: ValueMatcher;
    resourceKinds?: readonly K8sKind[];
}>;

const matchNullOrEmpty: ValueMatcher = (value: unknown): boolean => {
    return value === null || (isPlainObject(value) && Object.keys(value).length === 0);
};

const CONTROLLER_POD_TEMPLATE_KINDS: PlatformDefaultRule['resourceKinds'] = [
    'Deployment',
    'ReplicaSet',
    'StatefulSet',
    'DaemonSet',
    'ReplicationController',
];

const CRONJOB_KINDS: PlatformDefaultRule['resourceKinds'] = ['CronJob'];

const BUILD_CONFIG_KINDS: PlatformDefaultRule['resourceKinds'] = ['BuildConfig'];

const DEPLOYMENT_KINDS: PlatformDefaultRule['resourceKinds'] = ['Deployment'];

const ROUTE_KINDS: PlatformDefaultRule['resourceKinds'] = ['Route'];

const SERVICE_KINDS: PlatformDefaultRule['resourceKinds'] = ['Service'];

const STATEFULSET_KINDS: PlatformDefaultRule['resourceKinds'] = ['StatefulSet'];

export const PLATFORM_DEFAULT_RULES: PlatformDefaultRule[] = [
    // Metadata defaults
    {
        path: 'metadata.creationTimestamp',
        matches: matchNullOrTimestamp,
    },
    {
        path: 'metadata.annotations',
        matches: matchEmptyObject,
    },
    {
        path: 'metadata.labels',
        matches: matchExactObject({ 'app.kubernetes.io/managed-by': 'Helm' }),
    },
    {
        path: 'metadata.labels.app.kubernetes.io/managed-by',
        matches: matchOneOfValues('Helm', 'helm'),
    },
    {
        path: 'metadata.annotations.app.openshift.io/branch',
        matches: matchExactValue(''),
    },
    {
        path: 'metadata.annotations.app.openshift.io/commit',
        matches: matchNonEmptyString,
    },
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
    // BuildConfig defaults (OpenShift)
    {
        path: 'spec.failedBuildsHistoryLimit',
        resourceKinds: BUILD_CONFIG_KINDS,
        matches: matchExactValue(5),
    },
    {
        path: 'spec.successfulBuildsHistoryLimit',
        resourceKinds: BUILD_CONFIG_KINDS,
        matches: matchExactValue(5),
    },
    {
        path: 'spec.runPolicy',
        resourceKinds: BUILD_CONFIG_KINDS,
        matches: matchExactValue('Serial'),
    },
    {
        path: 'spec.postCommit',
        resourceKinds: BUILD_CONFIG_KINDS,
        matches: matchEmptyObject,
    },
    // CronJob defaults: history
    {
        path: 'spec.failedJobsHistoryLimit',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue(1),
    },
    {
        path: 'spec.successfulJobsHistoryLimit',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue(3),
    },
    {
        path: 'spec.concurrencyPolicy',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('Allow'),
    },
    // CronJob defaults: jobTemplate metadata
    {
        path: 'spec.jobTemplate.metadata',
        resourceKinds: CRONJOB_KINDS,
        matches: matchObjectWithNullCreationTimestamp,
    },
    {
        path: 'spec.jobTemplate.metadata.creationTimestamp',
        resourceKinds: CRONJOB_KINDS,
        matches: matchNullValue,
    },
    // CronJob defaults: jobTemplate pod template
    {
        path: 'spec.jobTemplate.spec.template.metadata',
        resourceKinds: CRONJOB_KINDS,
        matches: matchObjectWithNullCreationTimestamp,
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.dnsPolicy',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('ClusterFirst'),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.schedulerName',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('default-scheduler'),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.securityContext',
        resourceKinds: CRONJOB_KINDS,
        matches: matchEmptyObject,
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.terminationGracePeriodSeconds',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue(30),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.terminationMessagePath',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('/dev/termination-log'),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.terminationMessagePolicy',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('File'),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.resources',
        resourceKinds: CRONJOB_KINDS,
        matches: matchEmptyObject,
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.livenessProbe.successThreshold',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue(1),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.readinessProbe.successThreshold',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue(1),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.livenessProbe.httpGet.scheme',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('HTTP'),
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.readinessProbe.httpGet.scheme',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('HTTP'),
    },
    // Pod template defaults
    {
        path: 'spec.template.metadata',
        matches: matchObjectWithNullCreationTimestamp,
    },
    {
        path: 'spec.template.metadata.creationTimestamp',
        matches: matchNullValue,
    },
    {
        path: 'spec.template.spec.dnsPolicy',
        matches: matchExactValue('ClusterFirst'),
    },
    {
        path: 'spec.template.spec.restartPolicy',
        resourceKinds: CONTROLLER_POD_TEMPLATE_KINDS,
        matches: matchExactValue('Always'),
    },
    {
        path: 'spec.template.spec.schedulerName',
        matches: matchExactValue('default-scheduler'),
    },
    {
        path: 'spec.template.spec.securityContext',
        matches: matchNullOrEmpty,
    },
    {
        path: 'spec.template.spec.nodeSelector',
        matches: matchNullValue,
    },
    {
        path: 'spec.template.spec.terminationGracePeriodSeconds',
        matches: matchExactValue(30),
    },
    {
        path: 'spec.template.spec.containers.*.terminationMessagePath',
        matches: matchExactValue('/dev/termination-log'),
    },
    {
        path: 'spec.template.spec.containers.*.terminationMessagePolicy',
        matches: matchExactValue('File'),
    },
    {
        path: 'spec.template.spec.containers.*.livenessProbe.successThreshold',
        matches: matchExactValue(1),
    },
    {
        path: 'spec.template.spec.containers.*.readinessProbe.successThreshold',
        matches: matchExactValue(1),
    },
    {
        path: 'spec.template.spec.containers.*.livenessProbe.httpGet.scheme',
        matches: matchExactValue('HTTP'),
    },
    {
        path: 'spec.template.spec.containers.*.readinessProbe.httpGet.scheme',
        matches: matchExactValue('HTTP'),
    },
    {
        path: 'spec.template.spec.volumes.*.secret.defaultMode',
        matches: matchExactValue(420),
    },
    {
        path: 'spec.template.spec.volumes.*.configMap.defaultMode',
        matches: matchExactValue(420),
    },
    {
        path: 'spec.template.metadata.annotations',
        resourceKinds: CONTROLLER_POD_TEMPLATE_KINDS,
        matches: matchObjectWithRestartedAt,
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchNullValue(value: unknown): boolean {
    return value === null;
}

function matchNullOrTimestamp(value: unknown): boolean {
    return value === null || (typeof value === 'string' && value.length > 0);
}

function matchEmptyObject(value: unknown): boolean {
    return isPlainObject(value) && Object.keys(value).length === 0;
}

function matchExactValue<T extends string | number | boolean>(expected: T): ValueMatcher {
    return (value: unknown): boolean => value === expected;
}

function matchOneOfValues<T extends string | number | boolean>(...expected: T[]): ValueMatcher {
    return (value: unknown): boolean => expected.includes(value as T);
}

function matchExactObject<T extends Record<string, unknown>>(expected: T): ValueMatcher {
    return (value: unknown): boolean => deepEqual(value, expected);
}

function matchNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0;
}

function matchArrayOfStrings(value: unknown): boolean {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function matchNumber(value: unknown): boolean {
    return typeof value === 'number' && Number.isFinite(value);
}

function matchObjectWithNullCreationTimestamp(value: unknown): boolean {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && value.creationTimestamp === null;
}

function matchObjectWithRestartedAt(value: unknown): boolean {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && typeof value['kubectl.kubernetes.io/restartedAt'] === 'string';
}

function matchDefaultRollingUpdateStrategy(value: unknown): boolean {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    if (keys.length !== 2) {
        return false;
    }
    if (value.type !== 'RollingUpdate') {
        return false;
    }
    const rollingUpdate = value.rollingUpdate;
    if (!isPlainObject(rollingUpdate)) {
        return false;
    }
    const rollingKeys = Object.keys(rollingUpdate);
    if (rollingKeys.length !== 2) {
        return false;
    }
    return rollingUpdate.maxSurge === '25%' && rollingUpdate.maxUnavailable === '25%';
}
