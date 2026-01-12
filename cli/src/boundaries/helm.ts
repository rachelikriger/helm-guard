import { HelmRenderOptions, K8sResource } from '../domain/types';
import { runCommand, parseYamlDocuments } from './io';
import { isK8sResource } from '../validation/domain';

export const renderHelmChart = async (
    chartPath: string,
    namespace: string,
    options: HelmRenderOptions,
): Promise<K8sResource[]> => {
    const args = ['template'];

    if (options.releaseName) {
        args.push(options.releaseName);
    }

    args.push(chartPath, '--namespace', namespace);

    if (options.valuesFiles) {
        for (const valuesFile of options.valuesFiles) {
            args.push('-f', valuesFile);
        }
    }

    if (options.setValues) {
        for (const setValue of options.setValues) {
            args.push('--set', setValue);
        }
    }

    const result = await runCommand(
        'helm',
        args,
        `run "helm template" for chart ${chartPath} in namespace ${namespace}`,
    );

    const resources: K8sResource[] = [];

    const documents = parseYamlDocuments(result.stdout, `Helm output as YAML for chart ${chartPath}`);

    for (const doc of documents) {
        if (isK8sResource(doc)) {
            resources.push(doc);
        }
    }

    return resources;
};
