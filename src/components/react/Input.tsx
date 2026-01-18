/**
 * SDUI Input Component
 *
 * Renders an input field with validation support using the theme system.
 */

import React, { useState } from 'react';
import type { SDUIInputComponent, SDUIRendererContext } from '../../sdui/types';
import { useCurrentTheme } from '../../sdui/theme/ThemeProvider';

export interface InputProps extends SDUIInputComponent {
  __sdui_context__?: SDUIRendererContext;
}

export function Input({
  id,
  name,
  placeholder,
  value: controlledValue,
  inputType = 'text',
  required = false,
  disabled = false,
  error: propError,
  min,
  max,
  minLength,
  maxLength,
  className = '',
  style,
  __sdui_context__,
  testId,
}: InputProps): React.ReactElement {
  const theme = useCurrentTheme();
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [touched, setTouched] = useState(false);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Get error from context or props
  const error = propError || __sdui_context__?.errors?.[id] || '';
  const showError = touched && error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setTouched(true);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <input
        id={id}
        name={name}
        type={inputType}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        data-testid={testId || `input-${id}`}
        onChange={handleChange}
        className={`sdui-input ${className}`.trim()}
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: theme.typography.fontSize.base,
          border: `1px solid ${showError ? theme.colors.error : theme.colors.border}`,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: disabled ? theme.colors.surface : theme.colors.background,
          color: theme.colors.text.primary,
          outline: 'none',
          fontFamily: theme.typography.fontFamily.sans.join(', '),
          transition: 'all 150ms ease-in-out',
          ...style,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = theme.colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}33`;
          }
        }}
        onBlur={(e) => {
          handleBlur();
          if (!disabled) {
            e.currentTarget.style.borderColor = showError ? theme.colors.error : theme.colors.border;
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      />
      {showError && (
        <span
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error,
            fontFamily: theme.typography.fontFamily.sans.join(', '),
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
