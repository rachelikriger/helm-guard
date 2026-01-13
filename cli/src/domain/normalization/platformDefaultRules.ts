import { PlatformDefaultRule } from './types';
import { matchEmptyObject, matchExactValue, matchNullValue } from './matchers';

const CONTROLLER_POD_TEMPLATE_KINDS: PlatformDefaultRule['resourceKinds'] = [
    'Deployment',
    'ReplicaSet',
    'StatefulSet',
    'DaemonSet',
    'ReplicationController',
];

export const PLATFORM_DEFAULT_RULES: PlatformDefaultRule[] = [
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
