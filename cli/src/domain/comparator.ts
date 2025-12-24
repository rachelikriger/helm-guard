import { diff, Diff } from "deep-diff";
import { minimatch } from "minimatch";
import {
  ComparisonResult,
  DIFF_ACTION,
  DiffAction as ReportDiffAction,
  DiffActionInternal,
  K8sResource,
  RESOURCE_STATUS,
} from "./types";
import { normalize } from "./normalizer";

export const compareResources = (
  helm: K8sResource[],
  live: K8sResource[],
  strict: boolean
): ComparisonResult[] => {
  const results: ComparisonResult[] = [];

  const helmMap = mapByKey(helm.map(normalize));
  const liveMap = mapByKey(live.map(normalize));

  for (const [key, helmRes] of helmMap) {
    const liveRes = liveMap.get(key);
    if (!liveRes) {
      results.push({
        resourceKey: key,
        status: RESOURCE_STATUS.MISSING_LIVE,
        differences: []
      });
      continue;
    }

    const diffs = diff<K8sResource, K8sResource>(helmRes, liveRes) ?? [];
    const differences = diffs
      .map(d => {
        const path = formatDiffPath(d.path);
        const { helmValue, liveValue } = extractDiffValues(d);
        const action = classifyDiff(path, strict);
        return {
          path,
          helmValue,
          liveValue,
          action
        };
      })
      .filter(isReportAction);

    results.push({
      resourceKey: key,
      status: differences.length ? RESOURCE_STATUS.DRIFT : RESOURCE_STATUS.MATCH,
      differences
    });
  }

  for (const key of liveMap.keys()) {
    if (!helmMap.has(key)) {
      results.push({
        resourceKey: key,
        status: RESOURCE_STATUS.MISSING_HELM,
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
  if (minimatch(path, "metadata.*")) return DIFF_ACTION.IGNORE;
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
  return new Map(
    resources.map(r => [
      `${r.kind}/${r.metadata.namespace ?? "default"}/${r.metadata.name}`,
      r
    ])
  );
};
