import { diff, Diff } from 'deep-diff';
import { ComparisonResult, DIFF_ACTION, DiffActionInternal, K8sResource, ResourceStatus } from './types';
import { shouldIncludeDiff } from './normalization/shouldIncludeDiff';
import { fromSegmentsToPath } from './normalization/path';
export const compareResources = (
    helm: K8sResource[],
    live: K8sResource[],
    strict: boolean,
): ComparisonResult[] => {
    const results: ComparisonResult[] = [];

    const helmMap = mapByKey(helm);
    const liveMap = mapByKey(live);

    const helmKeys = Array.from(helmMap.keys()).sort((a, b) => a.localeCompare(b));
    const liveKeys = Array.from(liveMap.keys()).sort((a, b) => a.localeCompare(b));

    for (const key of helmKeys) {
        const helmRes = helmMap.get(key);
        if (!helmRes) {
            continue;
        }
        const liveRes = liveMap.get(key);
        if (!liveRes) {
            results.push({
                resourceKey: key,
                status: ResourceStatus.MISSING_LIVE,
                differences: [],
            });
            continue;
        }

        // Diff lifecycle: deep-diff candidate -> format path -> shouldIncludeDiff gate -> report entry.
        const diffs = diff<K8sResource, K8sResource>(helmRes, liveRes) ?? [];
        const differences = diffs
            .map(d => {
                const path = fromSegmentsToPath(d.path, d.kind === 'A' ? d.index : undefined);
                const { helmValue, liveValue } = extractDiffValues(d);
                if (!shouldIncludeDiff({ resourceKind: helmRes.kind, liveResource: liveRes, path, helmValue, liveValue })) {
                    return {
                        path,
                        helmValue,
                        liveValue,
                        action: DIFF_ACTION.IGNORE,
                    };
                }
                const action = classifyDiff(path, strict);
                return {
                    path,
                    helmValue,
                    liveValue,
                    action,
                };
            })
            .filter(isReportAction)
            .sort((a, b) => a.path.localeCompare(b.path));

        results.push({
            resourceKey: key,
            status: differences.length ? ResourceStatus.DRIFT : ResourceStatus.MATCH,
            differences,
        });
    }

    for (const key of liveKeys) {
        if (!helmMap.has(key)) {
            results.push({
                resourceKey: key,
                status: ResourceStatus.MISSING_HELM,
                differences: [],
            });
        }
    }

    return results;
};

const extractDiffValues = (
    diffEntry: Diff<K8sResource, K8sResource>,
): {
    helmValue?: unknown;
    liveValue?: unknown;
} => {
    if (diffEntry.kind === 'A') {
        return {
            helmValue: extractArraySide(diffEntry.item, 'lhs'),
            liveValue: extractArraySide(diffEntry.item, 'rhs'),
        };
    }

    return {
        helmValue: 'lhs' in diffEntry ? diffEntry.lhs : undefined,
        liveValue: 'rhs' in diffEntry ? diffEntry.rhs : undefined,
    };
};

const extractArraySide = (entry: Diff<K8sResource, K8sResource>, side: 'lhs' | 'rhs'): unknown => {
    if (side === 'lhs' && 'lhs' in entry) return entry.lhs;
    if (side === 'rhs' && 'rhs' in entry) return entry.rhs;
    return undefined;
};

const classifyDiff = (_path: string, strict: boolean): DiffActionInternal =>
    strict ? DIFF_ACTION.FAIL : DIFF_ACTION.WARN;

type ReportableAction = Exclude<DiffActionInternal, typeof DIFF_ACTION.IGNORE>;

const isReportAction = <T extends { action: DiffActionInternal }>(diff: T): diff is T & { action: ReportableAction } =>
    diff.action !== DIFF_ACTION.IGNORE;

const mapByKey = (resources: K8sResource[]): Map<string, K8sResource> => {
    return new Map(resources.map(r => [buildResourceKey(r), r]));
};

const buildResourceKey = (resource: K8sResource): string => {
    const kind = resource.kind.trim();
    const name = resource.metadata.name.trim();
    const namespace = resource.metadata.namespace?.trim() ?? '';
    return `${kind}/${namespace}/${name}`;
};
