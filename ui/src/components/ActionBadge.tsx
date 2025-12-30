import { AlertTriangle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { DiffAction } from '@/types/report';

interface ActionBadgeProps {
  action: DiffAction;
}

const actionConfig: Record<DiffAction, { label: string; className: string; icon: typeof AlertTriangle; help: string }> = {
  WARN: {
    label: 'Warn',
    className: 'bg-action-warn text-action-warn',
    icon: AlertTriangle,
    help: 'Non-breaking drift; review before deploy.',
  },
  FAIL: {
    label: 'Fail',
    className: 'bg-action-fail text-action-fail',
    icon: XCircle,
    help: 'Breaking or unsafe drift; block deployment.',
  },
};

export function ActionBadge({ action }: ActionBadgeProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-help ${config.className}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{config.help}</TooltipContent>
    </Tooltip>
  );
}
