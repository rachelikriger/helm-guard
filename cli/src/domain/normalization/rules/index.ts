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
