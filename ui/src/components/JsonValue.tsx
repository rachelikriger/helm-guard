interface JsonValueProps {
  value: unknown;
  maxLength?: number;
}

export function JsonValue({ value, maxLength = 100 }: JsonValueProps) {
  const formatValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  const formatted = formatValue(value);
  const isLong = formatted.length > maxLength;
  const isMultiline = formatted.includes('\n');

  if (value === null || value === undefined) {
    return (
      <span className="text-muted-foreground italic font-mono text-sm">
        {formatted}
      </span>
    );
  }

  if (isMultiline || isLong) {
    return (
      <pre className="bg-muted/50 rounded-md p-2 text-xs font-mono overflow-x-auto max-h-32 scrollbar-thin">
        {formatted}
      </pre>
    );
  }

  return (
    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono break-all">
      {formatted}
    </code>
  );
}
