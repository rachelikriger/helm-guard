import { PlatformDefaultRule } from './types';
import {
    matchDefaultRollingUpdateStrategy,
    matchEmptyObject,
    matchExactValue,
    matchNullValue,
    matchObjectWithNullCreationTimestamp,
} from './matchers';

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

export const PLATFORM_DEFAULT_RULES: PlatformDefaultRule[] = [
    // Metadata defaults
    {
        path: 'metadata.creationTimestamp',
        reason: 'System-generated fields can appear as null in API responses.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'metadata.annotations',
        reason: 'Kubernetes often materializes empty annotations maps.',
        matcher: matchEmptyObject,
        expectation: '{}',
    },
    {
        path: 'metadata.labels.app.kubernetes.io/managed-by',
        reason: 'Helm-added ownership metadata should not trigger drift when omitted.',
        matcher: matchExactValue('Helm'),
        expectation: '"Helm"',
    },
    // Generic spec defaults
    {
        path: 'spec.nodeSelector',
        reason: 'Absent nodeSelector can be materialized as null.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'spec.strategy',
        resourceKinds: DEPLOYMENT_KINDS,
        reason: 'Deployment default rolling update strategy.',
        matcher: matchDefaultRollingUpdateStrategy,
        expectation: '{type: "RollingUpdate", rollingUpdate: {maxSurge: "25%", maxUnavailable: "25%"}}',
    },
    // BuildConfig defaults (OpenShift)
    {
        path: 'spec.failedBuildsHistoryLimit',
        resourceKinds: BUILD_CONFIG_KINDS,
        reason: 'OpenShift default failed build history limit.',
        matcher: matchExactValue(5),
        expectation: '5',
    },
    {
        path: 'spec.successfulBuildsHistoryLimit',
        resourceKinds: BUILD_CONFIG_KINDS,
        reason: 'OpenShift default successful build history limit.',
        matcher: matchExactValue(5),
        expectation: '5',
    },
    {
        path: 'spec.runPolicy',
        resourceKinds: BUILD_CONFIG_KINDS,
        reason: 'OpenShift default BuildConfig run policy.',
        matcher: matchExactValue('Serial'),
        expectation: '"Serial"',
    },
    {
        path: 'spec.postCommit',
        resourceKinds: BUILD_CONFIG_KINDS,
        reason: 'Empty postCommit hook is equivalent to no postCommit.',
        matcher: matchEmptyObject,
        expectation: '{}',
    },
    // CronJob history defaults
    {
        path: 'spec.failedJobsHistoryLimit',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default failed job history for CronJob.',
        matcher: matchExactValue(1),
        expectation: '1',
    },
    {
        path: 'spec.successfulJobHistoryLimit',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default successful job history for CronJob.',
        matcher: matchExactValue(3),
        expectation: '3',
    },
    // CronJob jobTemplate defaults
    {
        path: 'spec.jobTemplate.metadata',
        resourceKinds: CRONJOB_KINDS,
        reason: 'JobTemplate metadata may contain only a null creationTimestamp.',
        matcher: matchObjectWithNullCreationTimestamp,
        expectation: '{creationTimestamp: null}',
    },
    {
        path: 'spec.jobTemplate.metadata.creationTimestamp',
        resourceKinds: CRONJOB_KINDS,
        reason: 'JobTemplate creationTimestamp is system-generated.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.dnsPolicy',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default DNS policy for CronJob pod templates.',
        matcher: matchExactValue('ClusterFirst'),
        expectation: '"ClusterFirst"',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.schedulerName',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default scheduler name for CronJob pods.',
        matcher: matchExactValue('default-scheduler'),
        expectation: '"default-scheduler"',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.securityContext',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Absent pod securityContext is represented as an empty object.',
        matcher: matchEmptyObject,
        expectation: '{}',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.terminationGracePeriodSeconds',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default termination grace period for CronJob pods.',
        matcher: matchExactValue(30),
        expectation: '30',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.terminationMessagePath',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default termination log path for CronJob pods.',
        matcher: matchExactValue('/dev/termination-log'),
        expectation: '"/dev/termination-log"',
    },
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.terminationMessagePolicy',
        resourceKinds: CRONJOB_KINDS,
        reason: 'Kubernetes default termination message policy for CronJob pods.',
        matcher: matchExactValue('File'),
        expectation: '"File"',
    },
    // Pod template defaults
    {
        path: 'spec.template.metadata',
        reason: 'Pod template metadata may contain only a null creationTimestamp.',
        matcher: matchObjectWithNullCreationTimestamp,
        expectation: '{creationTimestamp: null}',
    },
    {
        path: 'spec.template.metadata.creationTimestamp',
        reason: 'Pod template creationTimestamp is system-generated.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'spec.template.spec.dnsPolicy',
        reason: 'Kubernetes default DNS policy for pod templates.',
        matcher: matchExactValue('ClusterFirst'),
        expectation: '"ClusterFirst"',
    },
    {
        path: 'spec.template.spec.restartPolicy',
        resourceKinds: CONTROLLER_POD_TEMPLATE_KINDS,
        reason: 'Controller pod templates default to Always; jobs use different defaults.',
        matcher: matchExactValue('Always'),
        expectation: '"Always"',
    },
    {
        path: 'spec.template.spec.schedulerName',
        reason: 'Kubernetes default scheduler name.',
        matcher: matchExactValue('default-scheduler'),
        expectation: '"default-scheduler"',
    },
    {
        path: 'spec.template.spec.securityContext',
        reason: 'Absent pod securityContext is represented as null.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'spec.template.spec.securityContext',
        reason: 'Absent pod securityContext is represented as an empty object.',
        matcher: matchEmptyObject,
        expectation: '{}',
    },
    {
        path: 'spec.template.spec.nodeSelector',
        reason: 'Absent nodeSelector is represented as null.',
        matcher: matchNullValue,
        expectation: 'null',
    },
    {
        path: 'spec.template.spec.terminationGracePeriodSeconds',
        reason: 'Kubernetes default termination grace period.',
        matcher: matchExactValue(30),
        expectation: '30',
    },
    {
        path: 'spec.template.spec.containers.*.terminationMessagePath',
        reason: 'Kubernetes default termination log path.',
        matcher: matchExactValue('/dev/termination-log'),
        expectation: '"/dev/termination-log"',
    },
    {
        path: 'spec.template.spec.containers.*.terminationMessagePolicy',
        reason: 'Kubernetes default termination message policy.',
        matcher: matchExactValue('File'),
        expectation: '"File"',
    },
    {
        path: 'spec.template.spec.containers.*.imagePullPolicy',
        reason: 'Kubernetes default imagePullPolicy when tag is latest or omitted (no inference).',
        matcher: matchExactValue('Always'),
        expectation: '"Always"',
    },
];
