interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="alert alert-danger" role="alert">
      <p className="mb-2">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
