'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import { Loader2 } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'elevated' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

interface CardContextProps {
  size: 'sm' | 'md' | 'lg';
  variant: 'default' | 'outline' | 'elevated' | 'ghost';
}

const CardContext = React.createContext<CardContextProps>({
  size: 'md',
  variant: 'default',
});

const useCardContext = () => React.useContext(CardContext);

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      hoverable = false,
      clickable = false,
      loading = false,
      rounded = 'md',
      children,
      style,
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [coords, setCoords] = React.useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = React.useState(false);

    const roundnessMap = {
      none: 'rounded-[var(--radius-none)]',
      sm: 'rounded-[var(--radius-sm)]',
      md: 'rounded-[var(--radius-md)]',
      lg: 'rounded-[var(--radius-lg)]',
      full: 'rounded-[var(--radius-full)]',
    };

    const variantClasses = {
      default: 'bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm',
      outline: 'bg-[var(--color-card)] border border-[var(--color-border)]',
      elevated: 'bg-[var(--color-card)] border border-[var(--color-border)]/50 shadow-md',
      ghost: 'bg-transparent border border-transparent shadow-none',
    };

    const hoverClasses = hoverable
      ? {
          default:
            'hover:border-[var(--color-border)]/80 hover:-translate-y-0.5 transition-transform duration-200',
          outline: 'hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-muted)]/5',
          elevated: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
          ghost: 'hover:bg-[var(--color-muted)]/10',
        }[variant]
      : '';

    const clickClasses = clickable
      ? 'cursor-pointer active:scale-[0.99] active:translate-y-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2'
      : '';

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      onMouseMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) setIsHovered(false);
      onMouseLeave?.(e);
    };

    return (
      <CardContext.Provider value={{ size, variant }}>
        <div
          ref={ref}
          className={cn(
            'group/card relative flex flex-col text-[var(--color-card-foreground)] overflow-hidden transition-colors duration-200',
            roundnessMap[rounded],
            variantClasses[variant],
            hoverClasses,
            clickClasses,
            loading && 'pointer-events-none select-none',
            className
          )}
          style={style}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          {/* Spotlight gradient using dynamic inline coordinates and CSS variables */}
          {hoverable && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0 z-0',
                isHovered && 'opacity-100'
              )}
              style={{
                background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 80%)`,
                borderRadius: 'inherit',
              }}
            />
          )}

          {/* Spotlight border gradient using dynamic inline coordinates and CSS variables */}
          {hoverable && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0 z-10',
                isHovered && 'opacity-100'
              )}
              style={{
                background: `radial-gradient(220px circle at ${coords.x}px ${coords.y}px, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent 80%)`,
                borderRadius: 'inherit',
                border: '1px solid color-mix(in srgb, var(--color-primary) 22%, transparent)',
              }}
            />
          )}

          <div className="relative z-10 flex flex-col h-full w-full">{children}</div>

          {loading && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-[var(--color-card)]/65 backdrop-blur-[1px] z-50 transition-all',
                roundnessMap[rounded]
              )}
            >
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          )}
        </div>
      </CardContext.Provider>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size } = useCardContext();
    const paddingClasses = {
      sm: 'p-4 pb-2 gap-0.5',
      md: 'p-6 pb-3 gap-1',
      lg: 'p-8 pb-4 gap-1.5',
    }[size];

    return <div ref={ref} className={cn('flex flex-col', paddingClasses, className)} {...props} />;
  }
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { size } = useCardContext();
    const titleSizes = {
      sm: 'text-xs font-semibold tracking-tight',
      md: 'text-sm font-semibold tracking-tight',
      lg: 'text-base font-bold tracking-tight',
    }[size];

    return (
      <h3
        ref={ref}
        className={cn(
          'text-[var(--color-foreground)] font-heading leading-tight',
          titleSizes,
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { size } = useCardContext();
  const descSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }[size];

  return (
    <p
      ref={ref}
      className={cn('text-[var(--color-muted-foreground)] leading-normal', descSizes, className)}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size } = useCardContext();
    const paddingClasses = {
      sm: 'px-4 pb-4 pt-0',
      md: 'px-6 pb-6 pt-0',
      lg: 'px-8 pb-8 pt-0',
    }[size];

    return <div ref={ref} className={cn('flex-1', paddingClasses, className)} {...props} />;
  }
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size } = useCardContext();
    const paddingClasses = {
      sm: 'p-4 pt-0',
      md: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    }[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-4 border-t border-[var(--color-border)]/20 pt-4 mt-auto',
          paddingClasses,
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

const CardSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'horizontal' | 'vertical';
  }
>(({ className, orientation = 'horizontal', ...props }, ref) => {
  const { size } = useCardContext();

  const marginClasses =
    orientation === 'horizontal'
      ? {
          sm: '-mx-4',
          md: '-mx-6',
          lg: '-mx-8',
        }[size]
      : '';

  return (
    <div
      ref={ref}
      role="separator"
      className={cn(
        orientation === 'horizontal'
          ? 'h-[1px] w-auto bg-[var(--color-border)]/25'
          : 'w-[1px] h-auto self-stretch bg-[var(--color-border)]/25',
        marginClasses,
        className
      )}
      {...props}
    />
  );
});
CardSeparator.displayName = 'CardSeparator';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardSeparator };
