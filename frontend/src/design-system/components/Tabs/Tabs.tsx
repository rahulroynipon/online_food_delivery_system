'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import type { TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps } from './tabs.types';
import {
  tabsInnerRoundnessMap,
  tabsOuterRoundnessMap,
  tabsSizeStyles,
  tabsVariants,
} from './tabs.variants';
import './tabs.css';

// Re-export types for backward compatibility
export * from './tabs.types';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: 'line' | 'pill';
  size: 'sm' | 'md' | 'lg';
  rounded: 'none' | 'sm' | 'md' | 'lg' | 'full';
  ripples: {
    id: number;
    cx: number;
    cy: number;
    diameter: number;
    tabValue: string;
    color: string;
  }[];
  spawnRipple: (e: React.MouseEvent<HTMLButtonElement>, tabValue: string) => void;
  removeRipple: (id: number) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs subcomponents must be used inside a <Tabs /> wrapper.');
  }
  return context;
};

export const TabsInner = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: valueProp,
      defaultValue = '',
      onValueChange,
      items,
      variant = 'line',
      size = 'md',
      rounded = 'md',
      children,
      className,
      style,
      activeIndicatorClassName,
      activeClassName,
      inactiveClassName,
      ...props
    },
    ref
  ) => {
    const isControlled = valueProp !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
      defaultValue || (items && items.length > 0 ? items[0].value : '')
    );
    const value = isControlled ? (valueProp as string) : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
      [isControlled, onValueChange]
    );

    const [ripples, setRipples] = React.useState<
      {
        id: number;
        cx: number;
        cy: number;
        diameter: number;
        tabValue: string;
        color: string;
      }[]
    >([]);

    const spawnRipple = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>, tabValue: string) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxDist = Math.sqrt(
          Math.max(x, rect.width - x) ** 2 + Math.max(y, rect.height - y) ** 2
        );
        const diameter = maxDist * 2;
        const isSelectedTab = tabValue === value;
        const rippleColor =
          variant === 'pill'
            ? isSelectedTab
              ? 'color-mix(in srgb, var(--color-primary-foreground) 22%, transparent)'
              : 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
            : 'color-mix(in srgb, var(--color-primary) 12%, transparent)';
        setRipples((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            cx: x,
            cy: y,
            diameter,
            tabValue,
            color: rippleColor,
          },
        ]);
      },
      [value, variant]
    );

    const removeRipple = React.useCallback((id: number) => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const contextValue = React.useMemo(
      () => ({
        value,
        onValueChange: handleValueChange,
        variant,
        size,
        rounded,
        ripples,
        spawnRipple,
        removeRipple,
      }),
      [value, handleValueChange, variant, size, rounded, ripples, spawnRipple, removeRipple]
    );

    if (items) {
      return (
        <TabsContext.Provider value={contextValue}>
          <List
            ref={ref}
            className={className}
            style={style}
            activeIndicatorClassName={activeIndicatorClassName}
            {...props}
          >
            {items.map((item) => (
              <Trigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                icon={item.icon}
                activeClassName={activeClassName}
                inactiveClassName={inactiveClassName}
              >
                {item.label}
              </Trigger>
            ))}
          </List>
        </TabsContext.Provider>
      );
    }

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={className} style={style} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
(TabsInner as any).displayName = 'Tabs';

export const List = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, style, activeIndicatorClassName, ...props }, ref) => {
    const { variant, size, rounded, value } = useTabsContext();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
      left: 0,
      width: 0,
      opacity: 0,
    });

    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const activeEl = container.querySelector(`[data-value="${value}"]`) as HTMLElement;
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    }, [value, children, variant]);

    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleResize = () => {
        const activeEl = container.querySelector(`[data-value="${value}"]`) as HTMLElement;
        if (activeEl) {
          setIndicatorStyle({
            left: activeEl.offsetLeft,
            width: activeEl.offsetWidth,
            opacity: 1,
          });
        }
      };

      const observer = new ResizeObserver(handleResize);
      observer.observe(container);
      return () => observer.disconnect();
    }, [value, variant]);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      },
      [ref]
    );

    const s = tabsSizeStyles[size];

    if (variant === 'pill') {
      return (
        <div
          ref={setRefs}
          className={cn(
            tabsVariants({ variant }),
            s.pillContainer,
            tabsOuterRoundnessMap[rounded],
            className
          )}
          style={style}
          {...props}
        >
          <div
            className={cn(
              'absolute shadow-sm z-0 pointer-events-none bg-[var(--tabs-pill-active-bg,var(--color-card))]',
              tabsInnerRoundnessMap[rounded],
              activeIndicatorClassName
            )}
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.opacity,
              top: size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px',
              bottom: size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px',
              transition:
                'left 300ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms linear',
            }}
          />
          {children}
        </div>
      );
    }

    return (
      <div
        ref={setRefs}
        className={cn(tabsVariants({ variant }), s.container, className)}
        style={style}
        {...props}
      >
        <div
          className={cn(
            'absolute bottom-0 h-0.5 z-10 pointer-events-none bg-[var(--tabs-line-active-bg,var(--color-primary))]',
            activeIndicatorClassName
          )}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
            transition:
              'left 300ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms linear',
          }}
        />
        {children}
      </div>
    );
  }
);
List.displayName = 'TabsList';

export const Trigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  (
    {
      value: tabValue,
      disabled,
      icon,
      children,
      className,
      style,
      activeClassName,
      inactiveClassName,
      ...props
    },
    ref
  ) => {
    const { value, onValueChange, variant, size, rounded, ripples, spawnRipple, removeRipple } =
      useTabsContext();
    const isSelected = tabValue === value;
    const s = tabsSizeStyles[size];

    return (
      <button
        ref={ref}
        data-value={tabValue}
        type="button"
        disabled={disabled}
        onMouseEnter={() => !disabled}
        onMouseDown={(e) => !disabled && spawnRipple(e, tabValue)}
        onClick={() => !disabled && onValueChange(tabValue)}
        className={cn(
          'relative z-10 inline-flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none overflow-hidden',
          variant === 'pill' ? s.pillTab : cn('border-b-2 border-transparent -mb-px', s.tab),
          variant === 'pill' && tabsInnerRoundnessMap[rounded],

          // Default colors
          variant === 'pill'
            ? isSelected
              ? 'text-[var(--tabs-pill-active-text,var(--color-primary))]'
              : 'text-muted-foreground hover:text-foreground'
            : isSelected
              ? 'text-[var(--tabs-line-active-text,var(--color-primary))]'
              : 'text-muted-foreground hover:text-foreground',

          // Custom user styling overrides (merged by tailwind-merge)
          isSelected ? activeClassName : inactiveClassName,
          className
        )}
        {...props}
        style={style}
      >
        {icon && <span className="inline-flex shrink-0 relative z-10 mr-1.5">{icon}</span>}
        <span className="relative z-10">{children}</span>
        {ripples
          .filter((r) => r.tabValue === tabValue)
          .map((r) => (
            <span
              key={r.id}
              className="btn-ripple"
              style={{
                position: 'absolute',
                width: r.diameter,
                height: r.diameter,
                borderRadius: '50%',
                backgroundColor: r.color,
                pointerEvents: 'none',
                zIndex: 0,
                top: 0,
                left: 0,
                ['--btn-ripple-tx' as any]: `translate(${r.cx - r.diameter / 2}px, ${r.cy - r.diameter / 2}px)`,
                transform: `translate(${r.cx - r.diameter / 2}px, ${r.cy - r.diameter / 2}px) scale(0)`,
              }}
              onAnimationEnd={() => removeRipple(r.id)}
            />
          ))}
      </button>
    );
  }
);
Trigger.displayName = 'TabsTrigger';

export const Content = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value: tabValue, children, className, style, ...props }, ref) => {
    const { value } = useTabsContext();
    if (value !== tabValue) return null;
    return (
      <div
        ref={ref}
        data-slot="tabs-content"
        className={cn('focus-visible:outline-none', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Content.displayName = 'TabsContent';

export const Tabs = TabsInner as typeof TabsInner & {
  List: typeof List;
  Trigger: typeof Trigger;
  Content: typeof Content;
};

(Tabs as any).List = List;
(Tabs as any).Trigger = Trigger;
(Tabs as any).Content = Content;

export default Tabs;
