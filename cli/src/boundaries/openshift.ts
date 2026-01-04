import { K8sKind, K8sResource } from "../domain/types";
import { execWithContext, formatError, parseYamlDocuments as parseYamlDocumentsWithContext } from "./io";
import { isK8sResource, isRecord } from "../validation/domain";

export interface FetchOptions {
  labelSelector?: string;
  contextLabel?: string;
}

/**
 * Fetch live Kubernetes resources from OpenShift for a given namespace.
 */
export const fetchLiveResources = (
  namespace: string,
  whitelistedKinds: K8sKind[],
  options: FetchOptions = {}
): K8sResource[] => {
  if (whitelistedKinds.length === 0) {
    return [];
  }

  let yamlOutput = "";
  try {
    yamlOutput = runOcGetKinds(
      namespace,
      whitelistedKinds,
      options.labelSelector,
      options.contextLabel
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : formatError(err);
    console.error(`helm-guard warning: ${message}`);
    return [];
  }
  const documents = parseYamlDocumentsWithContext(
    yamlOutput,
    "OpenShift YAML output"
  );
  return extractK8sResources(documents);
};

/* =========================
   Helpers
   ========================= */

/**
 * Run `oc get <kinds>` and return raw YAML output
 */
const runOcGetKinds = (
  namespace: string,
  whitelistedKinds: K8sKind[],
  labelSelector?: string,
  contextLabel?: string
): string => {
  const kinds = Array.from(new Set(whitelistedKinds)).sort((a, b) =>
    a.localeCompare(b)
  );
  const args = ["get", kinds.join(","), "-n", namespace];
  if (labelSelector) {
    args.push("-l", labelSelector);
  }
  args.push("-o", "yaml");

  const contextSuffix = contextLabel ? ` (${contextLabel} mode)` : "";

  return execWithContext(
    "oc",
    args,
    `run "oc get ${kinds.join(",")}" in namespace "${namespace}"${contextSuffix}`
  );
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
