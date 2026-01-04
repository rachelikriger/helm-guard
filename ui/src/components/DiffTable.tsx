import { ActionBadge } from './ActionBadge';
import { JsonValue } from './JsonValue';
import type { DiffItem, DiffPath } from '@/types/report';

interface DiffTableProps {
  diffs: DiffItem[];
}

export function DiffTable({ diffs }: DiffTableProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-2">
        No differences to display
      </p>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Path
            </th>
            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Helm Value
            </th>
            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Live Value
            </th>
            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {diffs.map((diff, index) => (
            <tr key={index} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-3 align-top">
                <code className="text-xs font-mono text-primary break-all">
                  {formatDiffPath(diff.path)}
                </code>
              </td>
              <td className="py-3 px-3 align-top max-w-xs">
                <JsonValue value={diff.helmValue} />
              </td>
              <td className="py-3 px-3 align-top max-w-xs">
                <JsonValue value={diff.liveValue} />
              </td>
              <td className="py-3 px-3 align-top">
                <ActionBadge action={diff.action} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const formatDiffPath = (path: DiffPath): string => {
  if (!path || path.length === 0) return "";

  return path
    .map(segment => {
      if (segment.type === "index") {
        return `[${segment.index}]`;
      }
      return segment.name;
    })
    .reduce((acc, part) => {
      if (part.startsWith("[")) return `${acc}${part}`;
      return acc ? `${acc}.${part}` : part;
    }, "");
};
