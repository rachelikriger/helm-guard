import { Search, X } from 'lucide-react';
import { Switch } from './ui/switch';
import type { ResourceStatus, DiffAction } from '@/types/report';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatuses: ResourceStatus[];
  onStatusChange: (statuses: ResourceStatus[]) => void;
  selectedActions: DiffAction[];
  onActionChange: (actions: DiffAction[]) => void;
  includeClusterScoped: boolean;
  onIncludeClusterScopedChange: (value: boolean) => void;
}

const allStatuses: ResourceStatus[] = ['MATCH', 'DRIFT', 'MISSING_LIVE', 'MISSING_HELM'];
const allActions: DiffAction[] = ['WARN', 'FAIL'];

const statusLabels: Record<ResourceStatus, string> = {
  MATCH: 'Match',
  DRIFT: 'Drift',
  MISSING_LIVE: 'Missing Live',
  MISSING_HELM: 'Missing Helm',
};

const statusStyles: Record<ResourceStatus, string> = {
  MATCH: 'border-status-match/30 bg-status-match text-status-match',
  DRIFT: 'border-status-drift/30 bg-status-drift text-status-drift',
  MISSING_LIVE: 'border-status-missing-live/30 bg-status-missing-live text-status-missing-live',
  MISSING_HELM: 'border-status-missing-helm/30 bg-status-missing-helm text-status-missing-helm',
};

const actionStyles: Record<DiffAction, string> = {
  WARN: 'border-action-warn/30 bg-action-warn text-action-warn',
  FAIL: 'border-action-fail/30 bg-action-fail text-action-fail',
};

export function Filters({
  searchQuery,
  onSearchChange,
  selectedStatuses,
  onStatusChange,
  selectedActions,
  onActionChange,
  includeClusterScoped,
  onIncludeClusterScopedChange,
}: FiltersProps) {
  const toggleStatus = (status: ResourceStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const toggleAction = (action: DiffAction) => {
    if (selectedActions.includes(action)) {
      onActionChange(selectedActions.filter(a => a !== action));
    } else {
      onActionChange([...selectedActions, action]);
    }
  };

  const hasActiveFilters = searchQuery || selectedStatuses.length > 0 || selectedActions.length > 0;

  const clearAll = () => {
    onSearchChange('');
    onStatusChange([]);
    onActionChange([]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by resource name, kind, or namespace..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Status:</span>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(status => {
            const isSelected = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                  ${isSelected 
                    ? statusStyles[status]
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }
                `}
              >
                {statusLabels[status]}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground uppercase tracking-wider ml-4">Action:</span>
        <div className="flex flex-wrap gap-2">
          {allActions.map(action => {
            const isSelected = selectedActions.includes(action);
            return (
              <button
                key={action}
                onClick={() => toggleAction(action)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                  ${isSelected 
                    ? actionStyles[action]
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }
                `}
              >
                {action}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Switch
            checked={includeClusterScoped}
            onCheckedChange={onIncludeClusterScopedChange}
            aria-label="Include cluster-scoped resources"
          />
          <span className="text-xs text-muted-foreground">
            Include cluster-scoped resources
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
