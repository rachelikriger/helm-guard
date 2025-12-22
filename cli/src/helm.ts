import { execSync } from "child_process";
import { parseAllDocuments } from "yaml";
import { K8sResource } from "./types";

export function renderHelmChart(
  chartPath: string,
  namespace: string
): K8sResource[] {
  const output = execSync(
    `helm template ${chartPath} --namespace ${namespace}`,
    { encoding: "utf-8" }
  );

  const resources: K8sResource[] = [];

  for (const doc of parseAllDocuments(output)) {
    const obj = doc.toJS();
    if (obj?.kind && obj?.apiVersion) {
      resources.push(obj as K8sResource);
    }
  }

  return resources;
}
