import { CheckCircle2, GitCompare, CloudOff, FileQuestion } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { ResourceStatus } from '@/types/report';

interface StatusBadgeProps {
  status: ResourceStatus;
  scopeNote?: string;
}

const statusConfig: Record<ResourceStatus, { label: string; className: string; icon: typeof CheckCircle2; help: string }> = {
  MATCH: {
    label: 'Match',
    className: 'bg-status-match text-status-match',
    icon: CheckCircle2,
    help: 'Helm and live resources match after normalization.',
  },
  DRIFT: {
    label: 'Drift',
    className: 'bg-status-drift text-status-drift',
    icon: GitCompare,
    help: 'Helm and live resources differ after normalization.',
  },
  MISSING_LIVE: {
    label: 'Missing Live',
    className: 'bg-status-missing-live text-status-missing-live',
    icon: CloudOff,
    help: 'Rendered by Helm but not found in the cluster.',
  },
  MISSING_HELM: {
    label: 'Missing Helm',
    className: 'bg-status-missing-helm text-status-missing-helm',
    icon: FileQuestion,
    help: 'Present in the cluster but absent from Helm render.',
  },
};

export function StatusBadge({ status, scopeNote }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const tooltipText = scopeNote
    ? `${config.help} ${scopeNote}`
    : config.help;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-help ${config.className}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
