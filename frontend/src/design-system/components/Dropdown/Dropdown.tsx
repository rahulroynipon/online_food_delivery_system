'use client';

// Unified Dropdown Component Implementation
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/design-system/utils/utils';
import { ChevronRight } from 'lucide-react';
import type {
  DropdownGroupProps,
  DropdownHeaderProps,
  DropdownItem,
  DropdownItemProps,
  DropdownItemType,
  DropdownLabelProps,
  DropdownMenuProps,
  DropdownProps,
  DropdownSeparatorProps,
  DropdownSubmenu,
  DropdownTriggerProps,
} from './dropdown.types';
import { dropdownItemVariants, dropdownTriggerVariants } from './dropdown.variants';
import './dropdown.css';

// Re-export types for backward compatibility
export * from './dropdown.types';

interface DropdownCtx {
  open: boolean;
  toggle: () => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const Ctx = createContext<DropdownCtx | null>(null);

export const useDropdown = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error('Dropdown subcomponents must be used inside a <Dropdown />');
  }
  return context;
};

interface DefaultDropdownItemProps {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  description?: React.ReactNode;
  shortcut?: React.ReactNode;
  danger?: boolean;
}

export function DefaultDropdownItem({
  icon,
  label,
  description,
  shortcut,
  danger,
}: DefaultDropdownItemProps) {
  return (
    <div
      className={cn(
        'flex flex-1 min-w-0 gap-2.5 py-1 px-1.5',
        description ? 'items-start' : 'items-center'
      )}
    >
      {icon && (
        <span
          className={cn(
            'shrink-0 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4',
            description && 'mt-0.5',
            danger && 'text-[var(--color-danger)]'
          )}
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col min-w-0 flex-1 text-left">
        <span
          className={cn(
            'truncate text-xs font-medium transition-colors',
            danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
          )}
        >
          {label}
        </span>
        {description && (
          <span
            className={cn(
              'text-[10px] leading-tight truncate mt-0.5 transition-colors',
              danger
                ? 'text-[var(--color-danger)]/70 group-hover:text-[var(--color-danger)]/90'
                : 'text-[var(--color-muted-foreground)]'
            )}
          >
            {description}
          </span>
        )}
      </div>
      {shortcut && (
        <span
          className={cn(
            'text-[10px] tracking-widest shrink-0 ml-auto pl-4 font-sans font-medium transition-colors',
            danger
              ? 'text-[var(--color-danger)]/70 group-hover:text-[var(--color-danger)]/90'
              : 'text-[var(--color-muted-foreground)]'
          )}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}

// Helper function to render items recursively (hoisted)
function renderMenuItem(item: DropdownItemType, idx: number): React.ReactNode {
  if (item.type === 'separator' || item.type === 'divider') {
    return <Separator key={item.key || idx} />;
  }
  if (item.type === 'label') {
    return <Label key={item.key || idx}>{item.label}</Label>;
  }
  if (item.type === 'header') {
    return <Header key={item.key || idx}>{item.label}</Header>;
  }
  if ('children' in item && Array.isArray(item.children)) {
    return <SubmenuItem key={item.key || idx} item={item as DropdownSubmenu} />;
  }

  const menuItem = item as DropdownItem;

  return (
    <Item
      key={menuItem.key}
      variant={menuItem.danger ? 'danger' : 'default'}
      disabled={menuItem.disabled}
      closeOnClick={menuItem.closeOnClick !== false}
      onClick={menuItem.onClick}
    >
      {menuItem.content ? (
        menuItem.content
      ) : (
        <DefaultDropdownItem
          icon={menuItem.icon}
          label={menuItem.label}
          description={menuItem.description}
          shortcut={menuItem.shortcut}
          danger={menuItem.danger}
        />
      )}
    </Item>
  );
}

function SubmenuItem({ item }: { item: DropdownSubmenu }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={triggerRef}
    >
      <Item
        closeOnClick={false}
        variant={item.danger ? 'danger' : 'default'}
        className="justify-between"
        content={
          <div className="flex flex-1 min-w-0 items-center justify-between gap-2.5">
            <div className="flex items-center min-w-0 gap-2.5">
              {item.icon && (
                <span className="shrink-0 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                  {item.icon}
                </span>
              )}
              <span
                className={cn(
                  'truncate text-xs font-medium',
                  item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
                )}
              >
                {item.label}
              </span>
            </div>
            <ChevronRight size={12} className="shrink-0 ml-auto" />
          </div>
        }
      />

      {open && (
        <div className="absolute top-[-4px] left-full ml-1 bg-[var(--color-popover)] text-[var(--color-popover-foreground)] rounded-[var(--radius-md)] shadow-xl border border-[var(--color-border)] p-1 space-y-0.5 w-56 z-[10000] animate-in fade-in slide-in-from-left-2 duration-150">
          <div className="absolute top-0 bottom-0 -left-2 w-2 bg-transparent" />
          {item.children.map((sub, idx) => renderMenuItem(sub, idx))}
        </div>
      )}
    </div>
  );
}

export function Dropdown({ children, className, menu, style }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portals = document.querySelectorAll('[data-dropdown-portal]');
        for (const portal of Array.from(portals)) {
          if (portal.contains(e.target as Node)) {
            return;
          }
        }

        // Skip closing if clicking inside a Select dropdown portal
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.closest('.select-dropdown-transition') || target.closest('[data-select-portal]'))
        ) {
          return;
        }

        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  if (!menu) {
    return (
      <Ctx.Provider value={{ open, toggle, close, triggerRef }}>
        <div className={cn('relative inline-block', className)} ref={containerRef} style={style}>
          {children}
        </div>
      </Ctx.Provider>
    );
  }

  const items = menu.items || [];
  const align = menu.align || 'end';
  const side = menu.side || 'auto';
  const sideOffset = menu.sideOffset !== undefined ? menu.sideOffset : 6;
  const alignOffset = menu.alignOffset !== undefined ? menu.alignOffset : 0;
  const width = menu.width || 'w-56';

  return (
    <Ctx.Provider value={{ open, toggle, close, triggerRef }}>
      <div className={cn('relative inline-block', className)} ref={containerRef} style={style}>
        <Trigger>{children}</Trigger>
        <Menu
          align={align}
          side={side}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          width={width}
        >
          {items.map((item, idx) => renderMenuItem(item, idx))}
        </Menu>
      </div>
    </Ctx.Provider>
  );
}

export const Trigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { toggle, triggerRef } = useDropdown();

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as any).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      },
      [ref, triggerRef]
    );

    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: setRefs,
        onClick: (e: React.MouseEvent) => {
          const { onClick: originalOnClick } = (children as any).props;
          originalOnClick?.(e);
          toggle();
        },
        className: cn((children as any).props.className, className),
        ...props,
      });
    }

    return (
      <button
        ref={setRefs}
        type="button"
        onClick={toggle}
        className={cn(dropdownTriggerVariants(), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Trigger.displayName = 'DropdownTrigger';

export function Menu({
  children,
  className,
  align = 'end',
  side = 'auto',
  sideOffset = 6,
  alignOffset = 0,
  width = 'w-56',
}: DropdownMenuProps) {
  const { open, triggerRef } = useDropdown();
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [openDirection, setOpenDirection] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const targetElement =
      triggerRef.current.querySelector('.relative.flex.items-center.w-full.border') ||
      triggerRef.current;
    const rect = targetElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;

    const menuEl = menuRef.current;
    const dropdownHeight = menuEl ? menuEl.getBoundingClientRect().height : 220;

    let menuWidth = 224;
    if (width === 'trigger') {
      menuWidth = rect.width;
    } else if (typeof width === 'number') {
      menuWidth = width;
    } else if (typeof width === 'string' && !width.startsWith('w-')) {
      if (menuEl) {
        menuWidth = menuEl.getBoundingClientRect().width;
      }
    } else if (menuEl) {
      menuWidth = menuEl.getBoundingClientRect().width;
    }

    let resolvedSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    if (side === 'auto') {
      resolvedSide = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';
    } else {
      resolvedSide = side;
    }
    setOpenDirection(resolvedSide);

    let topVal: number | string = 'auto';
    let bottomVal: number | string = 'auto';
    let leftVal: number | string = 'auto';

    if (resolvedSide === 'top') {
      leftVal = rect.left + alignOffset;
      if (align === 'end') {
        leftVal = rect.right - menuWidth - alignOffset;
      } else if (align === 'center') {
        leftVal = rect.left + rect.width / 2 - menuWidth / 2 + alignOffset;
      }
      bottomVal = viewportHeight - rect.top + sideOffset;
    } else if (resolvedSide === 'bottom') {
      leftVal = rect.left + alignOffset;
      if (align === 'end') {
        leftVal = rect.right - menuWidth - alignOffset;
      } else if (align === 'center') {
        leftVal = rect.left + rect.width / 2 - menuWidth / 2 + alignOffset;
      }
      topVal = rect.bottom + sideOffset;
    } else if (resolvedSide === 'left') {
      leftVal = rect.left - menuWidth - sideOffset;
      topVal = rect.top + alignOffset;
      if (align === 'end') {
        bottomVal = viewportHeight - rect.bottom + alignOffset;
        topVal = 'auto';
      } else if (align === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + alignOffset;
      }
    } else if (resolvedSide === 'right') {
      leftVal = rect.right + sideOffset;
      topVal = rect.top + alignOffset;
      if (align === 'end') {
        bottomVal = viewportHeight - rect.bottom + alignOffset;
        topVal = 'auto';
      } else if (align === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + alignOffset;
      }
    }

    const finalStyle: React.CSSProperties = {
      position: 'fixed',
      left: leftVal,
      top: topVal,
      bottom: bottomVal,
      zIndex: 9999,
    };

    if (width === 'trigger') {
      finalStyle.width = rect.width;
    } else if (typeof width === 'number') {
      finalStyle.width = width;
    } else if (typeof width === 'string' && !width.startsWith('w-')) {
      finalStyle.width = width;
    }

    setDropdownStyle(finalStyle);
  }, [triggerRef, align, side, sideOffset, alignOffset, width]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const timer = setTimeout(updatePosition, 10);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const widthClassMap: Record<string, string> = {
    'w-48': 'w-48',
    'w-56': 'w-56',
    'w-64': 'w-64',
    'w-72': 'w-72',
    'w-80': 'w-80',
  };

  const menuWidthClass = typeof width === 'string' && widthClassMap[width] ? width : '';

  let originClass = 'origin-top';
  let closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';

  if (openDirection === 'top') {
    originClass = 'origin-bottom';
    closedTransformClass = 'opacity-0 translate-y-1.5 scale-[0.97]';
  } else if (openDirection === 'bottom') {
    originClass = 'origin-top';
    closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';
  } else if (openDirection === 'left') {
    originClass = 'origin-right';
    closedTransformClass = 'opacity-0 translate-x-1.5 scale-[0.97]';
  } else if (openDirection === 'right') {
    originClass = 'origin-left';
    closedTransformClass = 'opacity-0 -translate-x-1.5 scale-[0.97]';
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      data-dropdown-portal
      style={dropdownStyle}
      className={cn(
        'fixed z-[9999] dropdown-transition transform',
        'bg-[var(--color-popover)] text-[var(--color-popover-foreground)] rounded-[var(--radius-md)] shadow-xl border border-[var(--color-border)] p-1 space-y-0.5',
        originClass,
        open
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100 pointer-events-auto'
          : `${closedTransformClass} pointer-events-none`,
        menuWidthClass,
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

export function Item({
  children,
  icon: Icon,
  iconSize = 14,
  variant = 'default',
  className,
  closeOnClick = true,
  onClick,
  description,
  content,
  shortcut,
  ...props
}: DropdownItemProps) {
  const { close } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (closeOnClick) close();
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return <span className="mr-2 shrink-0 opacity-60 flex items-center">{Icon}</span>;
    }
    const Comp = Icon as any;
    return <Comp size={iconSize} className="mr-2 shrink-0 opacity-60" />;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(dropdownItemVariants({ variant }), className)}
      {...props}
    >
      {content ? (
        content
      ) : description || Icon || shortcut ? (
        <DefaultDropdownItem
          icon={Icon}
          label={children as string}
          description={description}
          shortcut={shortcut}
          danger={variant === 'danger'}
        />
      ) : (
        <>
          {renderIcon()}
          {children}
        </>
      )}
    </button>
  );
}

export function Header({ children, className, ...props }: DropdownHeaderProps) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 border-b border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Separator({ className, ...props }: DropdownSeparatorProps) {
  return (
    <div className={cn('-mx-1 my-1 border-t border-[var(--color-border)]', className)} {...props} />
  );
}

export function Group({ children, className, ...props }: DropdownGroupProps) {
  return (
    <div className={cn('p-1', className)} {...props}>
      {children}
    </div>
  );
}

export function Label({ children, className, ...props }: DropdownLabelProps) {
  return (
    <p
      className={cn(
        'px-2 py-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export interface SubMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
}

export function SubMenu({ children, label, icon, danger, className, ...props }: SubMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={triggerRef}
      {...props}
    >
      <Item
        closeOnClick={false}
        variant={danger ? 'danger' : 'default'}
        className="justify-between"
        content={
          <div className="flex flex-1 min-w-0 items-center justify-between gap-2.5">
            <div className="flex items-center min-w-0 gap-2.5">
              {icon && (
                <span className="shrink-0 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                  {icon}
                </span>
              )}
              <span
                className={cn(
                  'truncate text-xs font-medium',
                  danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
                )}
              >
                {label}
              </span>
            </div>
            <ChevronRight size={12} className="shrink-0 ml-auto" />
          </div>
        }
      />

      {open && (
        <div className="absolute top-[-4px] left-full ml-1 bg-[var(--color-popover)] text-[var(--color-popover-foreground)] rounded-[var(--radius-md)] shadow-xl border border-[var(--color-border)] p-1 space-y-0.5 w-56 z-[10000] animate-in fade-in slide-in-from-left-2 duration-150">
          <div className="absolute top-0 bottom-0 -left-2 w-2 bg-transparent" />
          {children}
        </div>
      )}
    </div>
  );
}
SubMenu.displayName = 'DropdownSubMenu';

Dropdown.Trigger = Trigger;
Dropdown.Menu = Menu;
Dropdown.Item = Item;
Dropdown.Header = Header;
Dropdown.Separator = Separator;
Dropdown.Group = Group;
Dropdown.Label = Label;
Dropdown.SubMenu = SubMenu;

export default Dropdown;
