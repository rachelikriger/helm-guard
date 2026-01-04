import { HelmRenderOptions, K8sResource } from "../domain/types";
import { execWithContext, parseYamlDocuments } from "./io";
import { isK8sResource } from "../validation/domain";

export const renderHelmChart = (
  chartPath: string,
  namespace: string,
  options: HelmRenderOptions
): K8sResource[] => {
  const args = ["template"];

  if (options.releaseName) {
    args.push(options.releaseName);
  }

  args.push(chartPath, "--namespace", namespace);

  if (options.valuesFiles) {
    for (const valuesFile of options.valuesFiles) {
      args.push("-f", valuesFile);
    }
  }

  if (options.setValues) {
    for (const setValue of options.setValues) {
      args.push("--set", setValue);
    }
  }

  const output = execWithContext(
    "helm",
    args,
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
};
