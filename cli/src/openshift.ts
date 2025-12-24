import { K8sResource } from "./types";
import { execWithContext, parseYamlDocuments as parseYamlDocumentsWithContext } from "./io";
import { isK8sResource, isRecord } from "./validation";

export interface FetchOptions {
  mode?: "bootstrap" | "helm-managed";
}

/**
 * Fetch live Kubernetes resources from OpenShift for a given namespace.
 * In helm-managed mode, only resources managed by Helm are returned.
 */
export function fetchLiveResources(
  namespace: string,
  options: FetchOptions = {}
): K8sResource[] {
  const mode = options.mode ?? "bootstrap";
  const yamlOutput = runOcGetAll(namespace, mode);
  const documents = parseYamlDocumentsWithContext(
    yamlOutput,
    "OpenShift YAML output"
  );
  return extractK8sResources(documents);
}

/* =========================
   Helpers
   ========================= */

/**
 * Run `oc get all` and return raw YAML output
 */
function runOcGetAll(
  namespace: string,
  mode: "bootstrap" | "helm-managed"
): string {
  const args = ["get", "all", "-n", namespace];
  if (mode === "helm-managed") {
    args.push("-l", "app.kubernetes.io/managed-by=Helm");
  }
  args.push("-o", "yaml");

  return execWithContext(
    "oc",
    args,
    `run "oc get all" in namespace "${namespace}" (${mode} mode)`
  );
}

/**
 * Extract valid K8s resources from parsed YAML documents
 */
function extractK8sResources(documents: unknown[]): K8sResource[] {
  const resources: K8sResource[] = [];

  for (const doc of documents) {
    // Case 1: document has `items` array (List)
    if (hasItemsArray(doc)) {
      for (const item of doc.items) {
        if (isK8sResource(item)) {
          resources.push(item);
        }
      }
      continue;
    }

    // Case 2: document itself is a single resource
    if (isK8sResource(doc)) {
      resources.push(doc);
    }
  }

  return resources;
}

/**
 * Type guard: object with `items: unknown[]`
 */
function hasItemsArray(obj: unknown): obj is { items: unknown[] } {
  if (!isRecord(obj)) {
    return false;
  }
  return Array.isArray(obj.items);
}
