import { execFileSync } from "child_process";
import { parseAllDocuments } from "yaml";
import { K8sResource } from "./types";
import { isK8sResource } from "./validation";

export function renderHelmChart(
  chartPath: string,
  namespace: string
): K8sResource[] {
  let output: string;

  try {
    output = execFileSync(
      "helm",
      ["template", chartPath, "--namespace", namespace],
      { encoding: "utf-8" }
    );
  } catch (err) {
    throw new Error(
      `Failed to run "helm template" for chart ${chartPath} in namespace ${namespace}: ${fmt(err)}`
    );
  }

  const resources: K8sResource[] = [];

  try {
    for (const doc of parseAllDocuments(output)) {
      const obj = doc.toJS();
      if (isK8sResource(obj)) {
        resources.push(obj);
      }
    }
  } catch (err) {
    throw new Error(
      `Failed to parse Helm output as YAML for chart ${chartPath}: ${fmt(err)}`
    );
  }

  return resources;
}

function fmt(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
