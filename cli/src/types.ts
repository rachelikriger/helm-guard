export interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  spec?: unknown;
  [key: string]: unknown;
}

export interface HelmGuardReport {
  timestamp: string;
  config: {
    helmChart: string;
    namespace: string;
    strictMode: boolean;
    mode: Mode;
  };
  summary: {
    total: number;
    matched: number;
    drifted: number;
    missingLive: number;
    missingHelm: number;
    warnings: number;
    failures: number;
  };
  results: ComparisonResult[];
}

export interface Difference {
  path: string;
  helmValue?: unknown;
  liveValue?: unknown;
  action: DiffAction;
}

export interface ComparisonResult {
  resourceKey: string;
  status: ResourceStatus;
  differences: Difference[];
}

export type Mode = "bootstrap" | "helm-managed";
export type DiffAction = "IGNORE" | "WARN" | "FAIL";
export type CountableAction = Extract<DiffAction, "WARN" | "FAIL">;
export type ResourceStatus =
  | "MATCH"
  | "DRIFT"
  | "MISSING_LIVE"
  | "MISSING_HELM";