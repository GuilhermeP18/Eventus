interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="card-eventus text-center text-muted">
      <p className="mb-0">{message}</p>
    </div>
  );
}
