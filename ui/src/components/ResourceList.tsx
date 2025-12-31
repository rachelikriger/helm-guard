import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ResourceCard } from './ResourceCard';
import type { ResourceResult, ResourceStatus, DiffAction } from '@/types/report';

interface ResourceListProps {
  namespaceResults: ResourceResult[];
  clusterResults: ResourceResult[];
  searchQuery: string;
  selectedStatuses: ResourceStatus[];
  selectedActions: DiffAction[];
  includeClusterScoped: boolean;
  namespaceLabel?: string;
}

export function ResourceList({ 
  namespaceResults, 
  clusterResults,
  searchQuery, 
  selectedStatuses, 
  selectedActions,
  includeClusterScoped,
  namespaceLabel,
}: ResourceListProps) {
  const [clusterExpanded, setClusterExpanded] = useState(false);

  const filteredResults = useMemo(() => {
    return namespaceResults.filter(result => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = result.resourceKey.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(result.status)) return false;
      }

      // Action filter
      if (selectedActions.length > 0) {
        if (!result.differences || result.differences.length === 0) return false;
        const hasMatchingAction = result.differences.some(diff => 
          selectedActions.includes(diff.action)
        );
        if (!hasMatchingAction) return false;
      }

      return true;
    });
  }, [namespaceResults, searchQuery, selectedStatuses, selectedActions]);

  if (filteredResults.length === 0 && (!includeClusterScoped || clusterResults.length === 0)) {
    const hasOnlyCluster = namespaceResults.length === 0 && clusterResults.length > 0;
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          {hasOnlyCluster
            ? 'No namespace resources in report'
            : namespaceResults.length === 0 && clusterResults.length === 0
              ? 'No resources in report'
              : 'No namespace resources match the current filters'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {hasOnlyCluster
            ? 'Enable "Include cluster-scoped resources" to review informational items.'
            : namespaceResults.length === 0 && clusterResults.length === 0
              ? 'Helm render or live OpenShift query returned no resources.'
              : 'Adjust filters to review namespace-scoped resources.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Namespace resources{namespaceLabel ? ` (${namespaceLabel})` : ""}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {filteredResults.length} of {namespaceResults.length} namespace resources
      </p>
      <p className="text-xs text-muted-foreground">
        Resources are derived from Helm template output and live OpenShift resources.
        Filters apply to namespace-scoped resources only.
      </p>
      <div className="space-y-2">
        {filteredResults.map((result, index) => (
          <ResourceCard 
            key={result.resourceKey}
            resource={result}
            index={index}
            isClusterScoped={false}
            namespaceFallback={namespaceLabel}
          />
        ))}
      </div>
      {includeClusterScoped && clusterResults.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Cluster-scoped resources
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cluster-scoped resources are usually managed by the platform and do not block application deployment.
              </p>
            </div>
            <button
              onClick={() => setClusterExpanded(!clusterExpanded)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              aria-expanded={clusterExpanded}
            >
              {clusterExpanded ? "Hide" : "Show"} ({clusterResults.length})
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  clusterExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
          {clusterExpanded && (
            <div className="mt-3 space-y-2">
              {clusterResults.map((result, index) => (
                <ResourceCard
                  key={result.resourceKey}
                  resource={result}
                  index={index}
                  isClusterScoped
                  namespaceFallback={namespaceLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
