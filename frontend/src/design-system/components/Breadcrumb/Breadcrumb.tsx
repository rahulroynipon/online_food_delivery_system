'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/design-system/utils/utils';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Dropdown } from '../Dropdown';

// Types
export interface BreadcrumbItemData {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<'nav'> {
  items?: BreadcrumbItemData[];
  maxItems?: number;
  separator?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// ── Compound Components ──────────────────────────────────────────────────────

export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<'ol'>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-[var(--color-muted-foreground)]',
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  href?: string;
}

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, href, ...props }, ref) => {
    const compClass = cn(
      'transition-colors hover:text-[var(--color-foreground)] font-medium flex items-center gap-1',
      className
    );

    if (href) {
      return <Link ref={ref as any} to={href} className={compClass} {...props} />;
    }

    return (
      <span ref={ref as any} className={cn('cursor-default', compClass)} {...(props as any)} />
    );
  }
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

export const BreadcrumbCurrent = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn(
      'font-semibold text-[var(--color-foreground)] flex items-center gap-1',
      className
    )}
    {...props}
  />
));
BreadcrumbCurrent.displayName = 'BreadcrumbCurrent';

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn(
      '[&>svg]:w-3.5 [&>svg]:h-3.5 flex items-center justify-center text-slate-400 select-none',
      className
    )}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export interface BreadcrumbEllipsisProps extends React.ComponentPropsWithoutRef<'button'> {
  items?: BreadcrumbItemData[];
}

export const BreadcrumbEllipsis = ({
  className,
  items = [],
  ...props
}: BreadcrumbEllipsisProps) => {
  if (items.length === 0) {
    return (
      <span
        role="presentation"
        aria-hidden="true"
        className={cn('flex h-9 w-9 items-center justify-center', className)}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More</span>
      </span>
    );
  }

  const dropdownItems = items.map((item) => ({
    key: item.href || String(item.label),
    label: typeof item.label === 'string' ? item.label : '',
    content: item.href ? (
      <Link to={item.href} className="flex items-center gap-2 w-full">
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        <span className="truncate">{item.label}</span>
      </Link>
    ) : (
      <span className="flex items-center gap-2 w-full text-slate-500">
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        <span className="truncate">{item.label}</span>
      </span>
    ),
  }));

  return (
    <Dropdown
      menu={{
        items: dropdownItems,
        align: 'start',
        width: 'w-40',
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 hover:text-[var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          className
        )}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Toggle menu</span>
      </button>
    </Dropdown>
  );
};
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

// ── Main Component ───────────────────────────────────────────────────────────

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      items,
      maxItems = 5,
      separator = <ChevronRight />,
      size = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'text-xs [&_svg]:h-3 [&_svg]:w-3',
      md: 'text-sm [&_svg]:h-3.5 [&_svg]:w-3.5',
      lg: 'text-base [&_svg]:h-4 [&_svg]:w-4',
    };

    // If child-based API is used
    if (!items) {
      return (
        <nav
          ref={ref}
          aria-label="breadcrumb"
          className={cn(sizeClasses[size], className)}
          {...props}
        >
          {children}
        </nav>
      );
    }

    // Auto collapse handling if data API is used
    const renderItems = () => {
      const total = items.length;
      if (total <= maxItems || maxItems < 3) {
        return items.map((item, idx) => {
          const isLast = idx === total - 1;
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbCurrent>
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                  </BreadcrumbCurrent>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
            </React.Fragment>
          );
        });
      }

      // Collapse logic (keep first item, show ellipsis dropdown with intermediate, keep last 2 items)
      const firstItem = items[0];
      const lastItems = items.slice(total - 2);
      const collapsedItems = items.slice(1, total - 2);

      return (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink href={firstItem.href}>
              {firstItem.icon && <span className="shrink-0">{firstItem.icon}</span>}
              {firstItem.label}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>

          <BreadcrumbItem>
            <BreadcrumbEllipsis items={collapsedItems} />
          </BreadcrumbItem>
          <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>

          {lastItems.map((item, idx) => {
            const isLast = idx === 1;
            return (
              <React.Fragment key={idx}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbCurrent>
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      {item.label}
                    </BreadcrumbCurrent>
                  ) : (
                    <BreadcrumbLink href={item.href}>
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
              </React.Fragment>
            );
          })}
        </>
      );
    };

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn(sizeClasses[size], className)}
        {...props}
      >
        <BreadcrumbList>{renderItems()}</BreadcrumbList>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';
