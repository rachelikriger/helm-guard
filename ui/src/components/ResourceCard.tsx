import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { DiffTable } from './DiffTable';
import type { ResourceResult } from '@/types/report';

interface ResourceCardProps {
  resource: ResourceResult;
  index: number;
}

function parseResourceKey(resourceKey: string): { kind: string; namespace: string; name: string } {
  const parts = resourceKey.split('/');
  if (parts.length === 3) {
    return { kind: parts[0], namespace: parts[1], name: parts[2] };
  } else if (parts.length === 2) {
    return { kind: parts[0], namespace: '', name: parts[1] };
  }
  return { kind: '', namespace: '', name: resourceKey };
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDiffs = resource.differences && resource.differences.length > 0;
  
  const { kind, namespace, name } = useMemo(
    () => parseResourceKey(resource.resourceKey),
    [resource.resourceKey]
  );

  return (
    <div 
      className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between p-4 text-left
          hover:bg-muted/30 transition-colors
          ${hasDiffs ? 'cursor-pointer' : 'cursor-default'}
        `}
        disabled={!hasDiffs}
      >
        <div className="flex items-center gap-4 min-w-0">
          <StatusBadge status={resource.status} />
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {kind}
            </span>
            <p className="font-mono text-sm text-foreground truncate">
              {namespace && (
                <span className="text-muted-foreground">{namespace}/</span>
              )}
              {name}
            </p>
          </div>
        </div>
        
        {hasDiffs && (
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {resource.differences!.length} diff{resource.differences!.length !== 1 ? 's' : ''}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        )}
      </button>

      {isExpanded && hasDiffs && (
        <div className="border-t border-border bg-muted/20 p-4">
          <DiffTable diffs={resource.differences!} />
        </div>
      )}
    </div>
  );
}
