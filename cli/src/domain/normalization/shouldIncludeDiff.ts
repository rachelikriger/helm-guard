import { DiffPath, K8sKind } from '@helm-guard/shared';
import { K8sResource } from '../types';
import { PLATFORM_DEFAULT_RULES } from './platformDefaultRules';
import { semanticallyEqual } from './equality';
import { normalizePath } from './path';

export type DiffContext = Readonly<{
    resourceKind: K8sKind;
    liveResource: K8sResource;
    path: DiffPath;
    helmValue: unknown;
    liveValue: unknown;
}>;

/**
 * Single authoritative gate for diff inclusion:
 * 1) valid path
 * 2) semantic equality
 * 3) platform default suppression
 */
export const shouldIncludeDiff = ({ resourceKind, liveResource, path, helmValue, liveValue }: DiffContext): boolean => {
    const normalizedPath = normalizePath(path);
    if (normalizedPath.length === 0) {
        return false;
    }
    if (semanticallyEqual(helmValue, liveValue)) {
        return false;
    }
    const helmOmitted =
        helmValue === undefined ||
        helmValue === null ||
        matchEmptyObject(helmValue) ||
        matchObjectWithNullCreationTimestamp(helmValue);
    if (!helmOmitted) {
        return true;
    }

    // Context-dependent suppression: imagePullPolicy defaults depend on the container image tag.
    if (isImagePullPolicyDefault(normalizedPath, liveValue, liveResource)) {
        return false;
    }

    for (const rule of PLATFORM_DEFAULT_RULES) {
        const normalizedRulePath = normalizePath(rule.path);
        if (normalizedRulePath !== normalizedPath) {
            if (!normalizedRulePath.includes('*')) {
                continue;
            }
            if (!toWildcardRegex(normalizedRulePath).test(normalizedPath)) {
                continue;
            }
        }
        if (rule.resourceKinds && !rule.resourceKinds.includes(resourceKind)) {
            continue;
        }
        if (!rule.matches(liveValue)) {
            continue;
        }
        return false;
    }

    return true;
};

const toWildcardRegex = (pattern: DiffPath): RegExp => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withWildcards = escaped.replace(/\\\*/g, '[0-9]+');
    return new RegExp(`^${withWildcards}$`);
};

const matchEmptyObject = (value: unknown): boolean => {
    return isPlainObject(value) && Object.keys(value).length === 0;
};

const matchObjectWithNullCreationTimestamp = (value: unknown): boolean => {
    if (!isPlainObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 1 && value.creationTimestamp === null;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const IMAGE_PULL_POLICY_PATH = /\.containers\.(\d+)\.imagePullPolicy$/;

const isImagePullPolicyDefault = (normalizedPath: DiffPath, liveValue: unknown, liveResource: K8sResource): boolean => {
    if (!isAlwaysPolicy(liveValue)) {
        return false;
    }
    const image = getContainerImage(liveResource, normalizedPath);
    if (!image) {
        return false;
    }
    return isLatestOrEmptyTag(image);
};

const isAlwaysPolicy = (value: unknown): boolean => {
    return typeof value === 'string' && value.toLowerCase() === 'always';
};

const getContainerImage = (resource: K8sResource, path: DiffPath): string | undefined => {
    const cronJobPrefix = 'spec.jobTemplate.spec.template.spec.containers.';
    const podTemplatePrefix = 'spec.template.spec.containers.';
    let containers: unknown;

    if (path.startsWith(cronJobPrefix)) {
        containers = (resource.spec as { jobTemplate?: { spec?: { template?: { spec?: { containers?: unknown } } } } })?.jobTemplate?.spec
            ?.template?.spec?.containers;
    } else if (path.startsWith(podTemplatePrefix)) {
        containers = (resource.spec as { template?: { spec?: { containers?: unknown } } })?.template?.spec?.containers;
    } else {
        return undefined;
    }

    if (!Array.isArray(containers)) {
        return undefined;
    }
    const index = extractContainerIndex(path);
    if (index === undefined || index < 0 || index >= containers.length) {
        return undefined;
    }
    const container = containers[index] as { image?: unknown };
    return typeof container?.image === 'string' ? container.image : undefined;
};

const extractContainerIndex = (path: DiffPath): number | undefined => {
    const match = IMAGE_PULL_POLICY_PATH.exec(path);
    if (!match) {
        return undefined;
    }
    return Number(match[1]);
};

const isLatestOrEmptyTag = (image: string): boolean => {
    if (image.includes('@')) {
        return false;
    }
    const lastSlash = image.lastIndexOf('/');
    const lastColon = image.lastIndexOf(':');
    if (lastColon > lastSlash) {
        const tag = image.slice(lastColon + 1);
        return tag === '' || tag === 'latest';
    }
    return true;
};
