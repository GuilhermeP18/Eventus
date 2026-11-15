import type { InputHTMLAttributes } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string;
}

export function Campo({ label, erro, ...props }: CampoProps) {
  return (
    <div className="mb-3">
      <label htmlFor={props.name} className="form-label">
        {label}
      </label>
      <input id={props.name} className={`form-control${erro ? ' is-invalid' : ''}`} {...props} />
      <div className="invalid-feedback">{erro}</div>
    </div>
  );
}
