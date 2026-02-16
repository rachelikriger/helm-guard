import { DiffPath, K8sKind } from '@helm-guard/shared';
import { K8sResource } from '../types';
import { PLATFORM_DEFAULT_RULES } from './rules';
import { semanticallyEqual } from './equality';
import { normalizePath } from './path';
import { matchEmptyObject, matchObjectWithNullCreationTimestamp } from './rules/ruleMatchers';

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
    if (isServiceTargetPortDefault(resourceKind, normalizedPath, liveValue, liveResource)) {
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

const IMAGE_PULL_POLICY_PATH = /\.containers\.(\d+)\.imagePullPolicy$/;

const isImagePullPolicyDefault = (normalizedPath: DiffPath, liveValue: unknown, liveResource: K8sResource): boolean => {
    if (!isAlwaysPolicy(liveValue)) {
        return false;
    }
    const image = getContainerImageByPath(liveResource, normalizedPath);
    return image ? isLatestOrEmptyTag(image) : false;
};

const isAlwaysPolicy = (value: unknown): boolean => {
    return typeof value === 'string' && value.toLowerCase() === 'always';
};

const getContainerImageByPath = (resource: K8sResource, path: DiffPath): string | undefined => {
    const index = extractContainerIndex(path);
    if (index === undefined) {
        return undefined;
    }
    const containers = getContainersForPath(resource, path);
    if (!containers || index >= containers.length) {
        return undefined;
    }
    const container = containers[index] as { image?: unknown };
    return typeof container?.image === 'string' ? container.image : undefined;
};

const extractContainerIndex = (path: DiffPath): number | undefined => {
    const match = IMAGE_PULL_POLICY_PATH.exec(path);
    return match ? Number(match[1]) : undefined;
};

const getContainersForPath = (resource: K8sResource, path: DiffPath): unknown[] | undefined => {
    const cronJobPrefix = 'spec.jobTemplate.spec.template.spec.containers.';
    const podTemplatePrefix = 'spec.template.spec.containers.';

    const containers = path.startsWith(cronJobPrefix)
        ? (resource.spec as { jobTemplate?: { spec?: { template?: { spec?: { containers?: unknown } } } } })?.jobTemplate?.spec
              ?.template?.spec?.containers
        : path.startsWith(podTemplatePrefix)
          ? (resource.spec as { template?: { spec?: { containers?: unknown } } })?.template?.spec?.containers
          : undefined;

    return Array.isArray(containers) ? containers : undefined;
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

const TARGET_PORT_PATH = /\.ports\.(\d+)\.targetPort$/;

const isServiceTargetPortDefault = (
    resourceKind: K8sKind,
    normalizedPath: DiffPath,
    liveValue: unknown,
    liveResource: K8sResource
): boolean => {
    if (resourceKind !== 'Service') {
        return false;
    }
    const index = extractPortIndex(normalizedPath);
    if (index === undefined) {
        return false;
    }
    const ports = getServicePorts(liveResource);
    if (!ports || index >= ports.length) {
        return false;
    }
    const portValue = (ports[index] as { port?: unknown })?.port;
    return matchesPortValue(liveValue, portValue);
};

const extractPortIndex = (path: DiffPath): number | undefined => {
    const match = TARGET_PORT_PATH.exec(path);
    return match ? Number(match[1]) : undefined;
};

const getServicePorts = (resource: K8sResource): unknown[] | undefined => {
    const ports = (resource.spec as { ports?: unknown })?.ports;
    return Array.isArray(ports) ? ports : undefined;
};

const matchesPortValue = (liveValue: unknown, portValue: unknown): boolean => {
    if (typeof portValue !== 'number') {
        return false;
    }
    if (typeof liveValue === 'number') {
        return liveValue === portValue;
    }
    if (typeof liveValue === 'string') {
        return liveValue === String(portValue);
    }
    return false;
};
