import type { PlatformDefaultRule } from './ruleTypes';
import {
    matchExactValue,
    matchNullOrEmpty,
    matchNullValue,
    matchObjectWithNullCreationTimestamp,
    matchObjectWithRestartedAt,
} from './ruleMatchers';
import { CONTROLLER_POD_TEMPLATE_KINDS } from './ruleKinds';

export const podTemplateRules: PlatformDefaultRule[] = [
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
        path: 'spec.template.spec.containers.*.ports.*.protocol',
        matches: matchExactValue('TCP'),
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
];
