import type { SelectHTMLAttributes } from 'react';

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

interface CampoSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  opcoes: readonly OpcaoSelect[];
  /** Texto da opção vazia inicial. */
  placeholder?: string;
  erro?: string;
}

export function CampoSelect({ label, opcoes, placeholder = 'Selecione', erro, ...props }: CampoSelectProps) {
  return (
    <div className="mb-3">
      <label htmlFor={props.name} className="form-label">
        {label}
      </label>
      <select id={props.name} className={`form-select${erro ? ' is-invalid' : ''}`} {...props}>
        <option value="">{placeholder}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      <div className="invalid-feedback">{erro}</div>
    </div>
  );
}
