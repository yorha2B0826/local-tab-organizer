export function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return <div className="warning-list">{warnings.map((warning, index) => <div key={`${warning}-${index}`}>{warning}</div>)}</div>;
}
