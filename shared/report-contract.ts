export const REPORT_SCHEMA_VERSION = 1 as const;

export type Mode = "bootstrap" | "helm-managed";

export type DiffAction = "WARN" | "FAIL";

export type ResourceStatus =
  | "MATCH"
  | "DRIFT"
  | "MISSING_LIVE"
  | "MISSING_HELM";

export type DiffPathSegment =
  | { type: "field"; name: string }
  | { type: "index"; index: number };

export type DiffPath = ReadonlyArray<DiffPathSegment>;

export interface ResourceIdentifier {
  kind: string;
  namespace: string;
  name: string;
}

export interface DiffItem {
  path: DiffPath;
  helmValue?: unknown;
  liveValue?: unknown;
  action: DiffAction;
}

export interface ResourceResult {
  resource: ResourceIdentifier;
  status: ResourceStatus;
  differences: DiffItem[];
}

export interface ReportConfig {
  helmChart: string;
  namespace: string;
  strictMode: boolean;
  mode: Mode;
  releaseName?: string;
  valuesFiles?: string[];
  includeKinds?: string[];
}

export interface ReportSelection {
  helmKinds: string[];
  additionalKinds: string[];
  comparedKinds: string[];
}

export type NormalizationRuleId =
  | "podSpec.dnsPolicy"
  | "container.terminationMessagePath"
  | "container.terminationMessagePolicy"
  | "service.spec.type"
  | "service.port.protocol"
  | "container.imagePullPolicy.always";

type PodSpecRule = {
  id: "podSpec.dnsPolicy";
  target: "PodSpec";
  field: "dnsPolicy";
  defaultValue: "ClusterFirst";
};

type ContainerRule =
  | {
      id: "container.terminationMessagePath";
      target: "Container";
      field: "terminationMessagePath";
      defaultValue: "/dev/termination-log";
    }
  | {
      id: "container.terminationMessagePolicy";
      target: "Container";
      field: "terminationMessagePolicy";
      defaultValue: "File";
    }
  | {
      id: "container.imagePullPolicy.always";
      target: "Container";
      field: "imagePullPolicy";
      defaultValue: "Always";
    };

type ServiceRule =
  | {
      id: "service.spec.type";
      target: "ServiceSpec";
      field: "type";
      defaultValue: "ClusterIP";
    }
  | {
      id: "service.port.protocol";
      target: "ServicePort";
      field: "protocol";
      defaultValue: "TCP";
    };

export type NormalizationRule = (PodSpecRule | ContainerRule | ServiceRule) & {
  description: string;
  rationale: string;
};

export interface NormalizationResult {
  rule: NormalizationRule;
  suppressedCount: number;
}

export interface ReportNormalizationSummary {
  totalSuppressed: number;
  rules: NormalizationResult[];
}

export interface ReportSummary {
  total: number;
  matched: number;
  drifted: number;
  missingLive: number;
  missingHelm: number;
  warnings: number;
  failures: number;
}

export interface ReportSchema {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  timestamp: string;
  config: ReportConfig;
  selection: ReportSelection;
  normalization: ReportNormalizationSummary;
  summary: ReportSummary;
  results: ResourceResult[];
}

export type HelmGuardReport = ReportSchema;
