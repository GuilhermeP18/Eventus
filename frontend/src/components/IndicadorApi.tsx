interface IndicadorApiProps {
  verificando: boolean;
}

/** Indicador discreto de que a API respondeu (ou de que ainda está sendo verificada). */
export function IndicadorApi({ verificando }: IndicadorApiProps) {
  return (
    <div className="d-flex align-items-center justify-content-end gap-2 small text-muted" role="status">
      <span
        className={`d-inline-block rounded-circle ${verificando ? 'bg-secondary' : 'bg-success'}`}
        style={{ width: 8, height: 8 }}
        aria-hidden="true"
      />
      {verificando ? 'Verificando API...' : 'API online'}
    </div>
  );
}
