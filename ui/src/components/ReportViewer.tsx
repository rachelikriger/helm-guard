import { useMemo, useState } from 'react';
import { FileJson, Upload } from 'lucide-react';
import { ReportSummary } from './ReportSummary';
import { Filters } from './Filters';
import { ResourceList } from './ResourceList';
import type { HelmGuardReport, ResourceStatus, DiffAction } from '@/types/report';
import { classifyResourceKey } from '../../../shared/resource-scope';

interface ReportViewerProps {
  report: HelmGuardReport;
  onNewReport: () => void;
}

export function ReportViewer({ report, onNewReport }: ReportViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ResourceStatus[]>([]);
  const [selectedActions, setSelectedActions] = useState<DiffAction[]>([]);
  const [includeClusterScoped, setIncludeClusterScoped] = useState(false);

  const { namespaceResults, clusterResults } = useMemo(() => {
    const namespace: typeof report.results = [];
    const cluster: typeof report.results = [];
    for (const result of report.results) {
      const scope = classifyResourceKey(
        result.resourceKey,
        report.config?.namespace
      ).scope;
      if (scope === "cluster") {
        cluster.push(result);
      } else {
        namespace.push(result);
      }
    }
    return { namespaceResults: namespace, clusterResults: cluster };
  }, [report.results, report.config?.namespace]);

  const namespaceSummary = useMemo(() => {
    const countByStatus = (status: ResourceStatus): number =>
      namespaceResults.filter(result => result.status === status).length;
    const countByAction = (action: DiffAction): number =>
      namespaceResults
        .flatMap(result => result.differences ?? [])
        .filter(diff => diff.action === action).length;

    return {
      total: namespaceResults.length,
      matched: countByStatus("MATCH"),
      drifted: countByStatus("DRIFT"),
      missingLive: countByStatus("MISSING_LIVE"),
      missingHelm: countByStatus("MISSING_HELM"),
      warnings: countByAction("WARN"),
      failures: countByAction("FAIL"),
    };
  }, [namespaceResults]);

  const includedKinds = useMemo(() => {
    const kinds = new Set<string>();
    for (const result of namespaceResults) {
      const kind = classifyResourceKey(
        result.resourceKey,
        report.config?.namespace
      ).kind.trim();
      if (kind) {
        kinds.add(kind);
      }
    }
    return Array.from(kinds).sort();
  }, [namespaceResults, report.config?.namespace]);

  const includedResourceNames = useMemo(() => {
    const names = new Set<string>();
    for (const result of namespaceResults) {
      const name = classifyResourceKey(
        result.resourceKey,
        report.config?.namespace
      ).name.trim();
      if (name) {
        names.add(name);
      }
    }
    return Array.from(names);
  }, [namespaceResults, report.config?.namespace]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Helm Guard Report
                </h1>
                {report.config?.helmChart && (
                  <p className="text-sm text-muted-foreground">
                    Chart: <span className="font-mono">{report.config.helmChart}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onNewReport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Load New Report
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 space-y-8">
        {/* Summary Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Summary
          </h2>
          <ReportSummary 
            summary={namespaceSummary}
            helmChart={report.config?.helmChart}
            namespace={report.config?.namespace}
            timestamp={report.timestamp}
            includedKinds={includedKinds}
            includedResourceNames={includedResourceNames}
            namespaceResourceCount={namespaceResults.length}
            clusterResourceCount={clusterResults.length}
          />
        </section>

        {/* Filters Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Filters
          </h2>
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            selectedActions={selectedActions}
            onActionChange={setSelectedActions}
            includeClusterScoped={includeClusterScoped}
            onIncludeClusterScopedChange={setIncludeClusterScoped}
          />
        </section>

        {/* Resources Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Resources
          </h2>
          <ResourceList
            namespaceResults={namespaceResults}
            clusterResults={clusterResults}
            searchQuery={searchQuery}
            selectedStatuses={selectedStatuses}
            selectedActions={selectedActions}
            includeClusterScoped={includeClusterScoped}
            namespaceLabel={report.config?.namespace}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            helm-guard-report-viewer • Read-only validation report viewer
          </p>
        </div>
      </footer>
    </div>
  );
}
