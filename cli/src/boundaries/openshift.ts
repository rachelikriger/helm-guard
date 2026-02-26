import { K8sKind, K8sResource } from '../domain/types';
import { runCommand, parseYamlDocuments as parseYamlDocumentsWithContext } from './io';
import { isK8sResource, isRecord } from '../validation/domain';

/**
 * Fetch live Kubernetes resources from OpenShift for a given namespace.
 */
export const fetchLiveResources = async (
    namespace: string,
    whitelistedKinds: K8sKind[],
    contextLabel?: string,
): Promise<K8sResource[]> => {
    if (whitelistedKinds.length === 0) {
        return [];
    }

    const yamlOutput = await runOcGetKinds(namespace, whitelistedKinds, contextLabel);
    const documents = parseYamlDocumentsWithContext(yamlOutput, 'OpenShift YAML output');
    return extractK8sResources(documents);
};

/* =========================
   Helpers
   ========================= */

/**
 * Run `oc get <kinds>` and return raw YAML output
 */
const runOcGetKinds = async (
    namespace: string,
    whitelistedKinds: K8sKind[],
    contextLabel?: string,
): Promise<string> => {
    const kinds = whitelistedKinds.join(',');
    const args = ['get', kinds, '-n', namespace];
    args.push('-o', 'yaml');

    const contextSuffix = contextLabel ? ` (${contextLabel} mode)` : '';

    const result = await runCommand(
        'oc',
        args,
        `run "oc get ${kinds}" in namespace "${namespace}"${contextSuffix}`,
    );
    return result.stdout;
};

/**
 * Extract valid K8s resources from parsed YAML documents
 */
const extractK8sResources = (documents: unknown[]): K8sResource[] => {
    const resources: K8sResource[] = [];

    for (const doc of documents) {
        if (hasItemsArray(doc)) {
            for (const item of doc.items) {
                if (isK8sResource(item)) {
                    resources.push(item);
                }
            }
            continue;
        }

        if (isK8sResource(doc)) {
            resources.push(doc);
        }
    }

    return resources;
};

/**
 * Type guard: object with `items: unknown[]`
 */
function hasItemsArray(obj: unknown): obj is { items: unknown[] } {
    if (!isRecord(obj)) {
        return false;
    }
    return Array.isArray(obj.items);
}
