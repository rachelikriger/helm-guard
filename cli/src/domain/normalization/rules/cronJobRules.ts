import type { PlatformDefaultRule } from './ruleTypes';
import {
    matchExactValue,
    matchEmptyObject,
    matchNullValue,
    matchObjectWithNullCreationTimestamp,
} from './ruleMatchers';
import { CRONJOB_KINDS } from './ruleKinds';

export const cronJobRules: PlatformDefaultRule[] = [
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
    {
        path: 'spec.jobTemplate.spec.template.spec.containers.*.ports.*.protocol',
        resourceKinds: CRONJOB_KINDS,
        matches: matchExactValue('TCP'),
    },
];
