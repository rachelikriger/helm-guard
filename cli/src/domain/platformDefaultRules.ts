import { NormalizationRule } from "./types";

export const PLATFORM_DEFAULT_RULES: NormalizationRule[] = [
  { path: "spec.type", defaultValue: "ClusterIP" },
  { path: "spec.sessionAffinity", defaultValue: "None" },
  { path: "spec.revisionHistoryLimit", defaultValue: 10 },
  { path: "spec.progressDeadlineSeconds", defaultValue: 600 },
];
