'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — Forms (Input, Select, Switch, OTPInput). Styles in src/styles/tad.css. */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  mono?: boolean;
}

export function Input({
  label,
  hint,
  error,
  required = false,
  icon = null,
  suffix = null,
  mono = false,
  id,
  className = '',
  ...rest
}: InputProps) {
  const fieldId = id || (label ? `f-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const inputCls = cn(
    'tad-input',
    mono && 'tad-input--mono',
    !!icon && 'tad-input--has-icon',
    !!suffix && 'tad-input--has-suffix',
  );
  return (
    <div className={cn('tad-field', error && 'tad-field--error', className)}>
      {label && (
        <label className="tad-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="tad-field__req">*</span>}
        </label>
      )}
      <div className="tad-input-wrap">
        {icon && <span className="tad-input__icon">{icon}</span>}
        <input id={fieldId} className={inputCls} aria-invalid={!!error} required={required} {...rest} />
        {suffix && <span className="tad-input__suffix">{suffix}</span>}
      </div>
      {(hint || error) && <span className="tad-field__hint">{error || hint}</span>}
    </div>
  );
}

export type SelectOption = string | { value: string; label: string };

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md';
  options?: SelectOption[];
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Select({
  label,
  size = 'md',
  options = [],
  id,
  className = '',
  children,
  ...rest
}: SelectProps) {
  const fieldId = id || (label ? `s-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="tad-select-wrap">
      {label && <label className="tad-select-wrap__label" htmlFor={fieldId}>{label}</label>}
      <div className="tad-select-field">
        <select id={fieldId} className={cn('tad-select', size === 'sm' && 'tad-select--sm', className)} {...rest}>
          {options.map((o) => {
            const value = typeof o === 'string' ? o : o.value;
            const text = typeof o === 'string' ? o : o.label;
            return <option key={value} value={value}>{text}</option>;
          })}
          {children}
        </select>
        <span className="tad-select__chevron"><Chevron /></span>
      </div>
    </div>
  );
}

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Switch({ label, size = 'md', className = '', children, ...rest }: SwitchProps) {
  return (
    <label className={cn('tad-switch', size === 'sm' && 'tad-switch--sm', className)}>
      <input type="checkbox" role="switch" {...rest} />
      <span className="tad-switch__track"><span className="tad-switch__thumb" /></span>
      {(label || children) && <span className="tad-switch__label">{label || children}</span>}
    </label>
  );
}

export interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  size = 'md',
  autoFocus = false,
  className = '',
}: OTPInputProps) {
  const [internal, setInternal] = React.useState('');
  const code = value !== undefined ? value : internal;
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const set = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const handle = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    const arr = code.split('');
    arr[i] = digit;
    const next = arr.join('').slice(0, length);
    set(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (digits) {
      set(digits);
      refs.current[Math.min(digits.length, length - 1)]?.focus();
    }
  };

  return (
    <div
      className={cn('tad-otp', size === 'sm' && 'tad-otp--sm', error && 'tad-otp--error', className)}
      onPaste={onPaste}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={cn('tad-otp__cell', code[i] && 'tad-otp__cell--filled')}
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={code[i] || ''}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
