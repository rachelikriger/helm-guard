import { execFileSync } from "child_process";
import { parseAllDocuments } from "yaml";
import { K8sResource } from "./types";
import { isK8sResource } from "./validation";

export function fetchLiveResources(namespace: string): K8sResource[] {
  let output: string;

  try {
    output = execFileSync(
      "oc",
      ["get", "all", "-n", namespace, "-o", "yaml"],
      { encoding: "utf-8" }
    );
  } catch (err) {
    throw new Error(
      `Failed to run "oc get all" in namespace ${namespace}: ${fmt(err)}`
    );
  }

  const resources: K8sResource[] = [];

  try {
    for (const doc of parseAllDocuments(output)) {
      const obj = doc.toJS();

      if (!obj) continue;

      const items = (obj as { items?: unknown }).items;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (isK8sResource(item)) {
            resources.push(item);
          }
        }
        continue;
      }

      if (isK8sResource(obj)) {
        resources.push(obj);
      }
    }
  } catch (err) {
    throw new Error(
      `Failed to parse OpenShift YAML output for namespace ${namespace}: ${fmt(err)}`
    );
  }

  return resources;
}

function fmt(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
