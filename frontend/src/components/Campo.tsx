import type { InputHTMLAttributes } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string;
  /** Texto de apoio embaixo do campo. */
  dica?: string;
}

export function Campo({ label, erro, dica, ...props }: CampoProps) {
  return (
    <div className="mb-3">
      <label htmlFor={props.name} className="form-label">
        {label}
      </label>
      <input id={props.name} className={`form-control${erro ? ' is-invalid' : ''}`} {...props} />
      <div className="invalid-feedback">{erro}</div>
      {dica && <div className="form-text">{dica}</div>}
    </div>
  );
}
