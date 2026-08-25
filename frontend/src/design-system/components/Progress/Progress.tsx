import * as React from 'react';
import { cn } from '@/lib/utils';
import './progress.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The current value of the progress bar.
   */
  value: number;
  /**
   * The target or maximum value of the progress bar.
   * @default 100
   */
  max?: number;
  /**
   * Optional value indicating target pacing (e.g. where the progress should be at this point).
   * Renders a vertical line marker.
   */
  pacingValue?: number;
  /**
   * Visual theme color.
   * @default "primary"
   */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  /**
   * Size of the progress track.
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to display text labels showing current/target values or percentage.
   * @default false
   */
  showLabel?: boolean;
  /**
   * Position of the label.
   * @default "top"
   */
  labelPosition?: 'top' | 'bottom' | 'inline';
  /**
   * Custom label formatter function.
   */
  labelFormatter?: (value: number, max: number) => React.ReactNode;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      pacingValue,
      variant = 'primary',
      size = 'md',
      showLabel = false,
      labelPosition = 'top',
      labelFormatter,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(Math.max(0, value), max);
    const fillPercent = max > 0 ? (clampedValue / max) * 100 : 0;
    const pacingPercent = pacingValue !== undefined && max > 0 ? (pacingValue / max) * 100 : 0;

    const defaultFormatter = (v: number, m: number) => {
      const percentage = Math.round((v / m) * 100);
      return `${v.toLocaleString()} / ${m.toLocaleString()} (${percentage}%)`;
    };

    const renderedLabel = labelFormatter
      ? labelFormatter(clampedValue, max)
      : defaultFormatter(clampedValue, max);

    return (
      <div
        ref={ref}
        className={cn('progress-container', className)}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        {showLabel && labelPosition === 'top' && (
          <div className="progress-header">
            {children ? <span>{children}</span> : <div />}
            <span className="progress-label-text">{renderedLabel}</span>
          </div>
        )}

        <div className={cn('progress-track', `size-${size}`)}>
          <div
            className={cn('progress-bar-fill', `variant-${variant}`)}
            style={{ width: `${fillPercent}%` }}
          />
          {pacingValue !== undefined && pacingPercent > 0 && pacingPercent <= 100 && (
            <div
              className="progress-pacing-marker"
              style={{ left: `${pacingPercent}%` }}
              title={`Pacing Target: ${pacingValue}`}
            />
          )}
        </div>

        {showLabel && labelPosition === 'bottom' && (
          <div className="progress-header mt-1">
            {children ? <span>{children}</span> : <div />}
            <span className="progress-label-text">{renderedLabel}</span>
          </div>
        )}

        {showLabel && labelPosition === 'inline' && children && (
          <div className="progress-header mt-1">
            <span>{children}</span>
            <span className="progress-label-text">{renderedLabel}</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';
