import type { PlatformDefaultRule } from './ruleTypes';
import { matchExactValue, matchEmptyObject } from './ruleMatchers';
import { BUILD_CONFIG_KINDS } from './ruleKinds';

export const buildConfigRules: PlatformDefaultRule[] = [
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
];
