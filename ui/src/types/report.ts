export type ResourceStatus = 'MATCH' | 'DRIFT' | 'MISSING_LIVE' | 'MISSING_HELM';
export type DiffAction = 'WARN' | 'FAIL';

export interface ResourceDiff {
  path: string;
  helmValue: unknown;
  liveValue: unknown;
  action: DiffAction;
}

export interface ResourceResult {
  resourceKey: string;
  status: ResourceStatus;
  differences: ResourceDiff[];
}

export interface ReportConfig {
  helmChart: string;
  namespace: string;
  strictMode: boolean;
  mode?: 'bootstrap' | 'helm-managed';
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

export interface HelmGuardReport {
  timestamp: string;
  config: ReportConfig;
  summary: ReportSummary;
  results: ResourceResult[];
}
