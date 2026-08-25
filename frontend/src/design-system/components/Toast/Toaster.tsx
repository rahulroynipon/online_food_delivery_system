'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { ToastItem, ToastPosition } from './toast.types';
import { Alert } from '../Alert';

interface ToasterProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  collapsible?: boolean;
  defaultPosition?: ToastPosition;
  defaultDuration?: number;
  defaultClosable?: boolean;
}

// Compute container inline styles for each position — no CSS class dependency
function getContainerStyle(pos: string, collapsible: boolean): React.CSSProperties {
  const isBottom = pos.startsWith('bottom');
  const isCenter = pos.endsWith('center');
  const isLeft = pos.endsWith('left');

  const base: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10000,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    boxSizing: 'border-box',
    ...(collapsible ? { minHeight: '80px' } : {}),
  };

  // Vertical anchor
  if (isBottom) {
    base.bottom = 0;
  } else {
    base.top = 0;
  }

  // Horizontal anchor
  if (isCenter) {
    base.left = '50%';
    base.transform = 'translateX(-50%)';
    base.alignItems = 'center';
  } else if (isLeft) {
    base.left = 0;
    base.alignItems = 'flex-start';
  } else {
    // right (default)
    base.right = 0;
    base.alignItems = 'flex-end';
  }

  return base;
}

// Animation class for the toast-inner slide-in
function getAnimationClass(pos: string): string {
  if (pos.startsWith('bottom')) return 'toast-slide-in-bottom';
  return 'toast-slide-in-top';
}

export function Toaster({
  toasts,
  onRemove,
  collapsible = true,
  defaultPosition = 'top-right',
  defaultDuration = 4000,
  defaultClosable = true,
}: ToasterProps) {
  const [mounted, setMounted] = React.useState(false);
  const [hovered, setHovered] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const positions: Record<ToastPosition, ToastItem[]> = {
    'top-left': [],
    'top-center': [],
    'top-right': [],
    'bottom-left': [],
    'bottom-center': [],
    'bottom-right': [],
  };

  toasts.forEach((toast) => {
    const pos = toast.position || defaultPosition;
    positions[pos].push(toast);
  });

  return createPortal(
    <>
      {Object.entries(positions).map(([pos, items]) => {
        if (items.length === 0) return null;

        const isPositionHovered = hovered[pos] || false;
        const isBottom = pos.startsWith('bottom');
        const dir = isBottom ? -1 : 1;

        const visibleItems = collapsible ? [...items].reverse() : items;
        const activeItems = visibleItems.filter((i) => !i.exiting);
        const containerStyle = getContainerStyle(pos, collapsible);

        return (
          <div
            key={pos}
            style={containerStyle}
            onMouseEnter={() => setHovered((prev) => ({ ...prev, [pos]: true }))}
            onMouseLeave={() => setHovered((prev) => ({ ...prev, [pos]: false }))}
          >
            {visibleItems.map((item) => {
              const itemStyle: React.CSSProperties = {};
              const activeIdx = activeItems.indexOf(item);
              const isExiting = item.exiting || activeIdx === -1;
              const idx = isExiting ? visibleItems.indexOf(item) : activeIdx;

              if (collapsible) {
                const opacity = isExiting
                  ? 0
                  : isPositionHovered
                    ? 1
                    : idx >= 3
                      ? 0
                      : 1 - idx * 0.15;

                const scale = isExiting
                  ? 0.9
                  : isPositionHovered
                    ? 1
                    : idx >= 3
                      ? 0.85
                      : 1 - idx * 0.05;

                const translateY = isExiting
                  ? (isPositionHovered ? dir * idx * 70 : dir * idx * 10) - dir * 40
                  : isPositionHovered
                    ? dir * idx * 70
                    : dir * idx * 10;

                itemStyle.position = 'absolute';
                itemStyle.left = '16px';
                itemStyle.right = '16px';
                itemStyle.width = 'auto';
                itemStyle.bottom = isBottom ? '16px' : 'auto';
                itemStyle.top = !isBottom ? '16px' : 'auto';
                itemStyle.transform = `translateY(${translateY}px) scale(${scale})`;
                itemStyle.opacity = opacity;
                itemStyle.zIndex = 100 - idx;
                itemStyle.pointerEvents = isExiting
                  ? 'none'
                  : isPositionHovered
                    ? 'auto'
                    : idx === 0
                      ? 'auto'
                      : 'none';
                itemStyle.transition =
                  'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)';
              } else if (isExiting) {
                itemStyle.opacity = 0;
                itemStyle.transform = `scale(0.9) translateY(${dir * 15}px)`;
                itemStyle.transition = 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)';
              }

              return (
                <div
                  key={item.id}
                  className={`toast-item ${isExiting ? 'exiting' : ''} ${getAnimationClass(pos)}`}
                  style={itemStyle}
                >
                  <div className="toast-inner">
                    <Alert
                      severity={item.severity || 'info'}
                      variant={item.variant || 'soft'}
                      title={item.title}
                      closable={item.closable !== undefined ? item.closable : defaultClosable}
                      duration={item.duration || defaultDuration}
                      autoClose
                      action={item.action}
                      loading={item.loading}
                      showProgress
                      className="toast-alert"
                      onClose={() => onRemove(item.id)}
                      keepMountedOnClose
                    >
                      {item.message}
                    </Alert>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>,
    document.body
  );
}

export default Toaster;
