import { CheckCircle2, GitCompare, CloudOff, FileQuestion } from 'lucide-react';
import type { ResourceStatus } from '@/types/report';

interface StatusBadgeProps {
  status: ResourceStatus;
}

const statusConfig: Record<ResourceStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  MATCH: {
    label: 'Match',
    className: 'bg-status-match text-status-match',
    icon: CheckCircle2,
  },
  DRIFT: {
    label: 'Drift',
    className: 'bg-status-drift text-status-drift',
    icon: GitCompare,
  },
  MISSING_LIVE: {
    label: 'Missing Live',
    className: 'bg-status-missing-live text-status-missing-live',
    icon: CloudOff,
  },
  MISSING_HELM: {
    label: 'Missing Helm',
    className: 'bg-status-missing-helm text-status-missing-helm',
    icon: FileQuestion,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
