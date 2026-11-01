type InventoryLoadStatusProps = {
  error: string;
  loading: boolean;
  loadingLabel: string;
  onRetry: () => void;
};

export default function InventoryLoadStatus({ error, loading, loadingLabel, onRetry }: InventoryLoadStatusProps) {
  if (error) return <p role="alert">{error} <button onClick={onRetry}>Retry</button></p>;
  if (loading) return <p role="status">{loadingLabel}</p>;
  return null;
}
