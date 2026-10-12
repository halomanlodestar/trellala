/** @format */

type Props = { value: unknown; className?: string };

export function JsonBlock({ value, className }: Props) {
  return (
    <pre
      className={`max-h-96 overflow-auto rounded-md bg-muted p-3 font-mono text-xs ${className ?? ""}`}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
