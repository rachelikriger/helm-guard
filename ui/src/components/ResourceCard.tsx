import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { DiffTable } from './DiffTable';
import type { ResourceResult } from '@/types/report';
import { classifyResourceKey } from '../../../shared/resource-scope';

interface ResourceCardProps {
  resource: ResourceResult;
  index: number;
  isClusterScoped?: boolean;
  namespaceFallback?: string;
}

export function ResourceCard({
  resource,
  index,
  isClusterScoped,
  namespaceFallback,
}: ResourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const diffCount = resource.differences?.length ?? 0;
  const hasDiffs = diffCount > 0;

  const parsed = useMemo(
    () => classifyResourceKey(resource.resourceKey, namespaceFallback),
    [resource.resourceKey, namespaceFallback]
  );
  const isCluster = isClusterScoped ?? parsed.scope === "cluster";
  const scopeNote = isCluster
    ? "Cluster-scoped - informational only."
    : parsed.inferredNamespace
      ? "Namespace inferred from report configuration."
      : parsed.legacyKey
        ? "Scope inferred from legacy resource key."
        : undefined;

  return (
    <div 
      className={`bg-card border border-border rounded-lg overflow-hidden animate-fade-in ${
        isCluster ? "border-border/60 bg-card/60" : ""
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className={`
          w-full flex items-center justify-between p-4 text-left
          hover:bg-muted/30 transition-colors
          cursor-pointer
        `}
      >
        <div className="flex items-center gap-4 min-w-0">
          <StatusBadge
            status={resource.status}
            scopeNote={scopeNote}
          />
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {parsed.kind}
            </span>
            {isCluster && (
              <span className="ml-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                Cluster-scoped
              </span>
            )}
            <p className={`font-mono text-sm truncate ${isCluster ? "text-muted-foreground" : "text-foreground"}`}>
              {parsed.namespace && (
                <span className="text-muted-foreground">{parsed.namespace}/</span>
              )}
              {parsed.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {hasDiffs ? `${diffCount} diff${diffCount !== 1 ? 's' : ''}` : 'No diffs'}
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-muted/20 p-4">
          {hasDiffs ? (
            <DiffTable diffs={resource.differences!} />
          ) : (
            <p className="text-sm text-muted-foreground italic py-2">
              {resource.status === 'MATCH'
                ? 'No differences after normalization.'
                : 'No differences recorded for this resource.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
