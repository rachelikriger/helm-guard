import { useMemo } from 'react';
import { ResourceCard } from './ResourceCard';
import type { ResourceResult, ResourceStatus, DiffAction } from '@/types/report';

interface ResourceListProps {
  results: ResourceResult[];
  searchQuery: string;
  selectedStatuses: ResourceStatus[];
  selectedActions: DiffAction[];
}

export function ResourceList({ 
  results, 
  searchQuery, 
  selectedStatuses, 
  selectedActions 
}: ResourceListProps) {
  const filteredResults = useMemo(() => {
    return results.filter(result => {
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
  }, [results, searchQuery, selectedStatuses, selectedActions]);

  if (filteredResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {results.length === 0 
            ? 'No resources in report' 
            : 'No resources match the current filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing {filteredResults.length} of {results.length} resources
      </p>
      <div className="space-y-2">
        {filteredResults.map((result, index) => (
          <ResourceCard 
            key={result.resourceKey}
            resource={result}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
