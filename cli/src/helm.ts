import { K8sResource } from "./types";
import { execWithContext, parseYamlDocuments } from "./io";
import { isK8sResource } from "./validation";

export function renderHelmChart(
  chartPath: string,
  namespace: string
): K8sResource[] {
  const output = execWithContext(
    "helm",
    ["template", chartPath, "--namespace", namespace],
    `run "helm template" for chart ${chartPath} in namespace ${namespace}`
  );

  const resources: K8sResource[] = [];

  const documents = parseYamlDocuments(
    output,
    `Helm output as YAML for chart ${chartPath}`
  );

  for (const doc of documents) {
    if (isK8sResource(doc)) {
      resources.push(doc);
    }
  }

  return resources;
}
