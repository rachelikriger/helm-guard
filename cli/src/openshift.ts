import { execFileSync } from "child_process";
import { parseAllDocuments } from "yaml";
import { K8sResource } from "./types";
import { isK8sResource } from "./validation";

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
  const documents = parseYamlDocuments(yamlOutput);
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

  try {
    return execFileSync("oc", args, { encoding: "utf-8" });
  } catch (err) {
    throw new Error(
      `Failed to run "oc get all" in namespace "${namespace}" (${mode} mode): ${formatError(err)}`
    );
  }
}

/**
 * Parse YAML string into JS objects (documents)
 */
function parseYamlDocuments(yaml: string): unknown[] {
  try {
    return parseAllDocuments(yaml)
      .map(doc => doc.toJS())
      .filter(Boolean);
  } catch (err) {
    throw new Error(
      `Failed to parse OpenShift YAML output: ${formatError(err)}`
    );
  }
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
  return (
    typeof obj === "object" &&
    obj !== null &&
    "items" in obj &&
    Array.isArray((obj as any).items)
  );
}

/**
 * Format unknown errors safely
 */
function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
