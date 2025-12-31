import { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  variant?: 'default' | 'match' | 'drift' | 'missing-live' | 'missing-helm' | 'warn' | 'fail';
  description?: string;
  className?: string;
  iconClassName?: string;
}

const variantStyles = {
  default: 'bg-muted text-foreground',
  match: 'bg-status-match text-status-match',
  drift: 'bg-status-drift text-status-drift',
  'missing-live': 'bg-status-missing-live text-status-missing-live',
  'missing-helm': 'bg-status-missing-helm text-status-missing-helm',
  warn: 'bg-action-warn text-action-warn',
  fail: 'bg-action-fail text-action-fail',
};

export function SummaryCard({
  label,
  value,
  icon,
  variant = 'default',
  description,
  className,
  iconClassName,
}: SummaryCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="min-h-[28px]">
            {description && (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {description}
              </p>
            )}
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground font-mono">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${styles} ${iconClassName ?? ''}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
