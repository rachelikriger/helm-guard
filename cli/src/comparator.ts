import { diff } from "deep-diff";
import { minimatch } from "minimatch";
import { ComparisonResult, DiffAction, K8sResource } from "./types";
import { normalize } from "./normalizer";

export function compareResources(
  helm: K8sResource[],
  live: K8sResource[],
  strict: boolean
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  const helmMap = mapByKey(helm.map(normalize));
  const liveMap = mapByKey(live.map(normalize));

  for (const [key, helmRes] of helmMap) {
    const liveRes = liveMap.get(key);
    if (!liveRes) {
      results.push({ resourceKey: key, status: "MISSING_LIVE", differences: [] });
      continue;
    }

    const diffs = diff(helmRes, liveRes) ?? [];
    const differences = diffs.map(d => ({
      path: d.path?.join(".") ?? "",
      helmValue: (d as any).lhs,
      liveValue: (d as any).rhs,
      action: classifyDiff(d.path?.join(".") ?? "", strict)
    })).filter(d => d.action !== "IGNORE");

    results.push({
      resourceKey: key,
      status: differences.length ? "DRIFT" : "MATCH",
      differences
    });
  }

  for (const key of liveMap.keys()) {
    if (!helmMap.has(key)) {
      results.push({ resourceKey: key, status: "MISSING_HELM", differences: [] });
    }
  }

  return results;
}

function classifyDiff(path: string, strict: boolean): DiffAction {
  if (minimatch(path, "metadata.*")) return "IGNORE";
  if (!strict) return "WARN";
  return "FAIL";
}

function mapByKey(resources: K8sResource[]): Map<string, K8sResource> {
  return new Map(
    resources.map(r => [
      `${r.kind}/${r.metadata.namespace ?? "default"}/${r.metadata.name}`,
      r
    ])
  );
}
