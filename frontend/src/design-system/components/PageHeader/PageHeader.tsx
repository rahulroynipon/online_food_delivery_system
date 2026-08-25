import * as React from 'react';
import { cn } from '@/design-system/utils/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  action,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  const displayDescription = description || subtitle;
  const displayAction = action || actions;

  const renderIcon = () => {
    if (!icon) return null;
    // Check if the icon is a component (function/object) or a React element
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="h-8 w-8 text-[var(--color-primary)] shrink-0" />;
  };

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {renderIcon()}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">
            {title}
          </h1>
          {displayDescription && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{displayDescription}</p>
          )}
        </div>
      </div>
      {displayAction && <div className="flex items-center gap-3">{displayAction}</div>}
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
