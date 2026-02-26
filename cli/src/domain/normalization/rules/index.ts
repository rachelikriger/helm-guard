/**
 * Platform default rules: suppress diffs where Live has a value the cluster adds by default.
 * Only add rules for documented defaults. Avoid over-normalization—it may hide real drift.
 * Refs: Kubernetes API Reference, OpenShift Image Pull Policy docs.
 */
import { buildConfigRules } from './buildConfigRules';
import { cronJobRules } from './cronJobRules';
import { coreRules } from './coreRules';
import { metadataRules } from './metadataRules';
import { podTemplateRules } from './podTemplateRules';
import type { PlatformDefaultRule } from './ruleTypes';

export type { PlatformDefaultRule } from './ruleTypes';

export const PLATFORM_DEFAULT_RULES: PlatformDefaultRule[] = [
    ...metadataRules,
    ...buildConfigRules,
    ...cronJobRules,
    ...podTemplateRules,
    ...coreRules,
];
