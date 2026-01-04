import { 
  Box, 
  CheckCircle2, 
  GitCompare, 
  CloudOff, 
  FileQuestion, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import type { ReportSummary as ReportSummaryType } from '@/types/report';

interface ReportSummaryProps {
  summary: ReportSummaryType;
  helmChart?: string;
  namespace?: string;
  timestamp?: string;
  includedKinds?: string[];
  includedResourceNames?: string[];
  namespaceResourceCount?: number;
}

const formatKindList = (kinds: string[]): string => {
  if (kinds.length === 0) return "None detected";
  const visible = kinds.slice(0, 6);
  const remaining = kinds.length - visible.length;
  return remaining > 0
    ? `${visible.join(", ")} and ${remaining} more`
    : visible.join(", ");
};

const formatResourceNameList = (names: string[], maxVisible = 3): string => {
  if (names.length === 0) return "None detected";
  const visible = names.slice(0, maxVisible);
  const remaining = names.length - visible.length;
  return remaining > 0
    ? `${visible.join(", ")} (+${remaining} more)`
    : visible.join(", ");
};

export function ReportSummary({
  summary,
  helmChart,
  namespace,
  timestamp,
  includedKinds = [],
  includedResourceNames = [],
  namespaceResourceCount = summary.total,
}: ReportSummaryProps) {
  const summaryMessage =
    summary.failures > 0
      ? "Deployment is blocked: failures detected in the desired vs live state."
      : summary.warnings > 0
        ? "Deployment is not blocked, but review warnings before proceeding."
        : "No warnings or failures detected. Safe to proceed.";

  return (
    <div className="space-y-4 animate-fade-in">
      {(helmChart || namespace || timestamp) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
          {helmChart && (
            <span>
              Chart: <span className="text-foreground font-mono">{helmChart}</span>
            </span>
          )}
          {namespace && (
            <span>
              Namespace: <span className="text-foreground font-mono">{namespace}</span>
            </span>
          )}
          {timestamp && (
            <span>
              Generated: <span className="text-foreground">{new Date(timestamp).toLocaleString()}</span>
            </span>
          )}
          {includedKinds.length > 0 && (
            <span>
              Kinds: <span className="text-foreground">{formatKindList(includedKinds)}</span>
            </span>
          )}
          {includedResourceNames.length > 0 && (
            <span>
              Resource names:{" "}
              <span className="text-foreground">
                {formatResourceNameList(includedResourceNames)}
              </span>
            </span>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground">
          Compared Helm-rendered manifests to live OpenShift resources in the target namespace.
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Resource Coverage
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Resources compared"
          value={namespaceResourceCount}
          icon={<Box className="w-4 h-4" />}
          description="Namespace resources compared (Helm render + live)."
          variant="default"
        />
        <SummaryCard
          label="Matched"
          value={summary.matched}
          icon={<CheckCircle2 className="w-4 h-4" />}
          description="Helm and live resources match after normalization."
          variant="match"
        />
        <SummaryCard
          label="Drifted"
          value={summary.drifted}
          icon={<GitCompare className="w-4 h-4" />}
          description="Helm and live resources differ after normalization."
          variant="drift"
        />
        <SummaryCard
          label="Missing Live"
          value={summary.missingLive}
          icon={<CloudOff className="w-4 h-4" />}
          description="Rendered by Helm but not found in the cluster."
          variant="missing-live"
        />
        <SummaryCard
          label="Missing Helm"
          value={summary.missingHelm}
          icon={<FileQuestion className="w-4 h-4" />}
          description="Present in the cluster but absent from Helm render."
          variant="missing-helm"
        />
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
          Change Severity
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          <SummaryCard
            label="Warnings"
            value={summary.warnings}
            icon={<AlertTriangle className="w-4 h-4" />}
            description="Non-breaking drift; review before deploy."
            variant="warn"
            className={summary.failures === 0 ? "opacity-85" : ""}
            iconClassName={summary.failures === 0 ? "opacity-80" : ""}
          />
          <SummaryCard
            label="Failures"
            value={summary.failures}
            icon={<XCircle className="w-4 h-4" />}
            description="Breaking or unsafe drift; block deployment."
            variant="fail"
            className={summary.failures > 0 ? "ring-1 ring-action-fail/40 border-action-fail/40" : ""}
          />
        </div>
      </div>
      <p className="text-sm text-foreground border-t border-border pt-3">
        {summaryMessage}
      </p>
    </div>
  );
}
