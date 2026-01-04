import { diff, Diff } from "deep-diff";
import {
  ComparisonResult,
  DIFF_ACTION,
  DiffActionInternal,
  K8sResource,
  ResourceStatus,
} from "./types";
import { normalize } from "./normalizer";
import { shouldSuppressDiff } from "./applyPlatformDefaults";
export const compareResources = (
  helm: K8sResource[],
  live: K8sResource[],
  strict: boolean,
  targetNamespace: string
): ComparisonResult[] => {
  const results: ComparisonResult[] = [];

  const helmResources = helm
    .map(normalize)
    .map(resource => applyNamespaceFallback(resource, targetNamespace));
  const liveResources = live
    .map(normalize)
    .filter(resource => isNamespaceMatch(resource, targetNamespace));

  const helmMap = mapByKey(helmResources);
  const liveMap = mapByKey(liveResources);

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
        differences: []
      });
      continue;
    }

    const diffs = diff<K8sResource, K8sResource>(helmRes, liveRes) ?? [];
    const differences = diffs
      .map(d => {
        const path = formatDiffPath(d.path);
        const { helmValue, liveValue } = extractDiffValues(d);
        if (shouldSuppressDiff(path, helmValue, liveValue)) {
          return {
            path,
            helmValue,
            liveValue,
            action: DIFF_ACTION.IGNORE
          };
        }
        const action = classifyDiff(path, strict);
        return {
          path,
          helmValue,
          liveValue,
          action
        };
      })
      .filter(isReportAction)
      .sort((a, b) => a.path.localeCompare(b.path));

    results.push({
      resourceKey: key,
      status: differences.length ? ResourceStatus.DRIFT : ResourceStatus.MATCH,
      differences
    });
  }

  for (const key of liveKeys) {
    if (!helmMap.has(key)) {
      results.push({
        resourceKey: key,
        status: ResourceStatus.MISSING_HELM,
        differences: []
      });
    }
  }

  return results;
};

const extractDiffValues = (diffEntry: Diff<K8sResource, K8sResource>): {
  helmValue?: unknown;
  liveValue?: unknown;
} => {
  if (diffEntry.kind === "A") {
    return {
      helmValue: extractArraySide(diffEntry.item, "lhs"),
      liveValue: extractArraySide(diffEntry.item, "rhs")
    };
  }

  return {
    helmValue: "lhs" in diffEntry ? diffEntry.lhs : undefined,
    liveValue: "rhs" in diffEntry ? diffEntry.rhs : undefined
  };
};

const extractArraySide = (
  entry: Diff<K8sResource, K8sResource>,
  side: "lhs" | "rhs"
): unknown => {
  if (side === "lhs" && "lhs" in entry) return entry.lhs;
  if (side === "rhs" && "rhs" in entry) return entry.rhs;
  return undefined;
};

const classifyDiff = (path: string, strict: boolean): DiffActionInternal => {
  if (!strict) return DIFF_ACTION.WARN;
  return DIFF_ACTION.FAIL;
};

type ReportableAction = Exclude<DiffActionInternal, typeof DIFF_ACTION.IGNORE>;

const isReportAction = <T extends { action: DiffActionInternal }>(
  diff: T
): diff is T & { action: ReportableAction } => diff.action !== DIFF_ACTION.IGNORE;

const formatDiffPath = (path: Array<string | number> | undefined): string => {
  if (!Array.isArray(path)) return "";
  return path.map(segment => String(segment)).join(".");
};

const mapByKey = (resources: K8sResource[]): Map<string, K8sResource> => {
  return new Map(resources.map(r => [buildResourceKey(r), r]));
};

const buildResourceKey = (resource: K8sResource): string => {
  const kind = resource.kind.trim();
  const name = resource.metadata.name.trim();
  const namespace = resource.metadata.namespace?.trim() ?? "";
  return `${kind}/${namespace}/${name}`;
};

const isNamespaceMatch = (
  resource: K8sResource,
  targetNamespace: string
): boolean => {
  const namespace = resource.metadata.namespace?.trim();
  return namespace === targetNamespace.trim();
};

const applyNamespaceFallback = (
  resource: K8sResource,
  targetNamespace: string
): K8sResource => {
  if (resource.metadata.namespace && resource.metadata.namespace.trim().length > 0) {
    return resource;
  }

  return {
    ...resource,
    metadata: {
      ...resource.metadata,
      namespace: targetNamespace.trim(),
    },
  };
};
