import { AlertTriangle, XCircle } from 'lucide-react';
import type { DiffAction } from '@/types/report';

interface ActionBadgeProps {
  action: DiffAction;
}

const actionConfig: Record<DiffAction, { label: string; className: string; icon: typeof AlertTriangle }> = {
  WARN: {
    label: 'Warn',
    className: 'bg-action-warn text-action-warn',
    icon: AlertTriangle,
  },
  FAIL: {
    label: 'Fail',
    className: 'bg-action-fail text-action-fail',
    icon: XCircle,
  },
};

export function ActionBadge({ action }: ActionBadgeProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
