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

export type DiffAction = "IGNORE" | "WARN" | "FAIL";

export interface Difference {
  path: string;
  helmValue?: unknown;
  liveValue?: unknown;
  action: DiffAction;
}

export interface ComparisonResult {
  resourceKey: string;
  status: "MATCH" | "DRIFT" | "MISSING_LIVE" | "MISSING_HELM";
  differences: Difference[];
}
