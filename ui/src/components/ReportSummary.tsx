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
}

export function ReportSummary({ summary, helmChart, namespace, timestamp }: ReportSummaryProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {(helmChart || namespace || timestamp) && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
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
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <SummaryCard
          label="Total"
          value={summary.total}
          icon={<Box className="w-4 h-4" />}
          variant="default"
        />
        <SummaryCard
          label="Matched"
          value={summary.matched}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="match"
        />
        <SummaryCard
          label="Drifted"
          value={summary.drifted}
          icon={<GitCompare className="w-4 h-4" />}
          variant="drift"
        />
        <SummaryCard
          label="Missing Live"
          value={summary.missingLive}
          icon={<CloudOff className="w-4 h-4" />}
          variant="missing-live"
        />
        <SummaryCard
          label="Missing Helm"
          value={summary.missingHelm}
          icon={<FileQuestion className="w-4 h-4" />}
          variant="missing-helm"
        />
        <SummaryCard
          label="Warnings"
          value={summary.warnings}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="warn"
        />
        <SummaryCard
          label="Failures"
          value={summary.failures}
          icon={<XCircle className="w-4 h-4" />}
          variant="fail"
        />
      </div>
    </div>
  );
}
