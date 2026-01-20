import type { PlatformDefaultRule } from './ruleTypes';
import { matchExactObject, matchExactValue, matchNonEmptyString, matchNullOrTimestamp, matchOneOfValues, matchEmptyObject } from './ruleMatchers';

export const metadataRules: PlatformDefaultRule[] = [
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
];
