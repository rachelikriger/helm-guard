import { diff, Diff } from "deep-diff";
import {
  ComparisonOutput,
  ComparisonResult,
  DIFF_ACTION,
  DiffActionInternal,
  DiffPath,
  K8sResource,
  RESOURCE_STATUS,
  ResourceIdentifier,
} from "./types";
import { normalize } from "./normalizer";
import { applyPlatformDefaults } from "./applyPlatformDefaults";
import { createNormalizationTracker } from "./platformDefaultRules";
export const compareResources = (
  helm: K8sResource[],
  live: K8sResource[],
  strict: boolean,
  includeKinds: string[] = []
): ComparisonOutput => {
  const results: ComparisonResult[] = [];
  const normalizationTracker = createNormalizationTracker();

  const helmResources = helm
    .map(normalize)
    .filter(resource => hasNamespace(resource.metadata.namespace));
  const liveResources = live
    .map(normalize)
    .filter(resource => hasNamespace(resource.metadata.namespace));

  const helmKinds = uniqueKinds(helmResources);
  const additionalKinds = normalizeKindList(includeKinds);
  const comparedKinds = mergeKinds(helmKinds, additionalKinds);

  const filteredLiveResources = liveResources.filter(resource =>
    comparedKinds.includes(resource.kind.trim())
  );

  const helmMap = mapByKey(helmResources);
  const liveMap = mapByKey(filteredLiveResources);

  for (const [key, helmRes] of helmMap) {
    const liveRes = liveMap.get(key);
    if (!liveRes) {
      results.push({
        resource: buildResourceIdentifier(helmRes),
        status: RESOURCE_STATUS.MISSING_LIVE,
        differences: []
      });
      continue;
    }

    const normalizedPair = applyPlatformDefaults(
      helmRes,
      liveRes,
      normalizationTracker
    );

    const diffs =
      diff<K8sResource, K8sResource>(
        normalizedPair.helm,
        normalizedPair.live
      ) ?? [];
    const differences = diffs
      .map(d => {
        const path = toDiffPath(d);
        const { helmValue, liveValue } = extractDiffValues(d);
        const action = classifyDiff(strict);
        return {
          path,
          helmValue,
          liveValue,
          action
        };
      })
      .filter(isReportAction);

    results.push({
      resource: buildResourceIdentifier(helmRes),
      status: differences.length ? RESOURCE_STATUS.DRIFT : RESOURCE_STATUS.MATCH,
      differences
    });
  }

  for (const key of liveMap.keys()) {
    if (!helmMap.has(key)) {
      const liveResource = liveMap.get(key);
      if (!liveResource) continue;
      results.push({
        resource: buildResourceIdentifier(liveResource),
        status: RESOURCE_STATUS.MISSING_HELM,
        differences: []
      });
    }
  }

  return {
    results,
    selection: {
      helmKinds,
      additionalKinds,
      comparedKinds,
    },
    normalization: normalizationTracker.summary,
  };
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

const classifyDiff = (strict: boolean): DiffActionInternal => {
  if (!strict) return DIFF_ACTION.WARN;
  return DIFF_ACTION.FAIL;
};

type ReportableAction = Exclude<DiffActionInternal, typeof DIFF_ACTION.IGNORE>;

const isReportAction = <T extends { action: DiffActionInternal }>(
  diff: T
): diff is T & { action: ReportableAction } => diff.action !== DIFF_ACTION.IGNORE;

const mapByKey = (resources: K8sResource[]): Map<string, K8sResource> => {
  return new Map(resources.map(r => [buildResourceKey(r), r]));
};

const buildResourceKey = (resource: K8sResource): string => {
  const kind = resource.kind.trim();
  const name = resource.metadata.name.trim();
  const namespace = resource.metadata.namespace?.trim() ?? "";
  return `${kind}/${namespace}/${name}`;
};

const buildResourceIdentifier = (resource: K8sResource): ResourceIdentifier => {
  return {
    kind: resource.kind.trim(),
    namespace: resource.metadata.namespace?.trim() ?? "",
    name: resource.metadata.name.trim(),
  };
};

const hasNamespace = (namespace: string | undefined): boolean => {
  return typeof namespace === "string" && namespace.trim().length > 0;
};

const uniqueKinds = (resources: K8sResource[]): string[] => {
  const kinds = new Set<string>();
  for (const resource of resources) {
    const kind = resource.kind.trim();
    if (kind) kinds.add(kind);
  }
  return Array.from(kinds).sort();
};

const normalizeKindList = (kinds: string[]): string[] => {
  const normalized = kinds
    .map(kind => kind.trim())
    .filter(kind => kind.length > 0);
  return Array.from(new Set(normalized)).sort();
};

const mergeKinds = (helmKinds: string[], additionalKinds: string[]): string[] => {
  const merged = new Set<string>(helmKinds);
  additionalKinds.forEach(kind => merged.add(kind));
  return Array.from(merged).sort();
};

const toDiffPath = (
  diffEntry: Diff<K8sResource, K8sResource>
): DiffPath => {
  const path = Array.isArray(diffEntry.path) ? diffEntry.path : [];
  type DiffPathSegment = DiffPath[number];
  const segments: DiffPathSegment[] = path.map(segment => {
    if (typeof segment === "number") {
      return { type: "index", index: segment };
    }
    return { type: "field", name: String(segment) };
  });

  if (diffEntry.kind === "A" && typeof diffEntry.index === "number") {
    segments.push({ type: "index", index: diffEntry.index });
  }

  return segments;
};
