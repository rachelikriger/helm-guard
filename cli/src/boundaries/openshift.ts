import { K8sResource } from "../domain/types";
import { execWithContext, parseYamlDocuments as parseYamlDocumentsWithContext } from "./io";
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
  options: FetchOptions = {}
): K8sResource[] => {
  const yamlOutput = runOcGetAll(
    namespace,
    options.labelSelector,
    options.contextLabel
  );
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
 * Run `oc get all` and return raw YAML output
 */
const runOcGetAll = (
  namespace: string,
  labelSelector?: string,
  contextLabel?: string
): string => {
  const args = ["get", "all", "-n", namespace];
  if (labelSelector) {
    args.push("-l", labelSelector);
  }
  args.push("-o", "yaml");

  const contextSuffix = contextLabel ? ` (${contextLabel} mode)` : "";

  return execWithContext(
    "oc",
    args,
    `run "oc get all" in namespace "${namespace}"${contextSuffix}`
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
