import type { PlatformDefaultRule } from './ruleTypes';

export const CONTROLLER_POD_TEMPLATE_KINDS: PlatformDefaultRule['resourceKinds'] = [
    'Deployment',
    'ReplicaSet',
    'StatefulSet',
    'DaemonSet',
    'ReplicationController',
];

export const CRONJOB_KINDS: PlatformDefaultRule['resourceKinds'] = ['CronJob'];

export const BUILD_CONFIG_KINDS: PlatformDefaultRule['resourceKinds'] = ['BuildConfig'];

export const DEPLOYMENT_KINDS: PlatformDefaultRule['resourceKinds'] = ['Deployment'];

export const ROUTE_KINDS: PlatformDefaultRule['resourceKinds'] = ['Route'];

export const SERVICE_KINDS: PlatformDefaultRule['resourceKinds'] = ['Service'];

export const STATEFULSET_KINDS: PlatformDefaultRule['resourceKinds'] = ['StatefulSet'];
