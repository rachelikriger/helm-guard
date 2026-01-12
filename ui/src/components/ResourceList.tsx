import { ResourceCard } from './ResourceCard';
import type { ResourceResult } from '@/types/report';

interface ResourceListProps {
    namespaceResults: ResourceResult[];
    totalResults: number;
    namespaceLabel?: string;
}

export function ResourceList({ namespaceResults, totalResults, namespaceLabel }: ResourceListProps) {
    if (namespaceResults.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                    {totalResults === 0 ? 'No resources in report' : 'No namespace resources match the current filters'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    {totalResults === 0
                        ? 'Helm render or live OpenShift query returned no resources.'
                        : 'Adjust filters to review namespace-scoped resources.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                    Namespace resources{namespaceLabel ? ` (${namespaceLabel})` : ''}
                </h3>
            </div>
            <p className="text-sm text-muted-foreground">
                Showing {namespaceResults.length} of {totalResults} namespace resources
            </p>
            <p className="text-xs text-muted-foreground">
                Resources are derived from Helm template output and live OpenShift resources. Filters apply to
                namespace-scoped resources only.
            </p>
            <div className="space-y-2">
                {namespaceResults.map((result, index) => (
                    <ResourceCard
                        key={result.resourceKey}
                        resource={result}
                        index={index}
                        namespaceFallback={namespaceLabel}
                    />
                ))}
            </div>
        </div>
    );
}
