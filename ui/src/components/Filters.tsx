import { X } from 'lucide-react';
import { DiffAction, ResourceStatus } from '@/types/report';

interface FiltersProps {
  selectedStatuses: ResourceStatus[];
  onStatusChange: (statuses: ResourceStatus[]) => void;
  selectedActions: DiffAction[];
  onActionChange: (actions: DiffAction[]) => void;
  onClearAll: () => void;
}

const allStatuses: ResourceStatus[] = [
  ResourceStatus.MATCH,
  ResourceStatus.DRIFT,
  ResourceStatus.MISSING_LIVE,
  ResourceStatus.MISSING_HELM,
];
const allActions: DiffAction[] = [DiffAction.WARN, DiffAction.FAIL];

const statusLabels: Record<ResourceStatus, string> = {
  [ResourceStatus.MATCH]: 'Match',
  [ResourceStatus.DRIFT]: 'Drift',
  [ResourceStatus.MISSING_LIVE]: 'Missing Live',
  [ResourceStatus.MISSING_HELM]: 'Missing Helm',
};

const statusStyles: Record<ResourceStatus, string> = {
  [ResourceStatus.MATCH]: 'border-status-match/30 bg-status-match text-status-match',
  [ResourceStatus.DRIFT]: 'border-status-drift/30 bg-status-drift text-status-drift',
  [ResourceStatus.MISSING_LIVE]: 'border-status-missing-live/30 bg-status-missing-live text-status-missing-live',
  [ResourceStatus.MISSING_HELM]: 'border-status-missing-helm/30 bg-status-missing-helm text-status-missing-helm',
};

const actionStyles: Record<DiffAction, string> = {
  [DiffAction.WARN]: 'border-action-warn/30 bg-action-warn text-action-warn',
  [DiffAction.FAIL]: 'border-action-fail/30 bg-action-fail text-action-fail',
};

export function Filters({
  selectedStatuses,
  onStatusChange,
  selectedActions,
  onActionChange,
  onClearAll,
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

  const hasActiveFilters = selectedStatuses.length > 0 || selectedActions.length > 0;

  const clearAll = () => {
    onClearAll();
  };

  return (
    <div className="space-y-4 animate-fade-in">
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
