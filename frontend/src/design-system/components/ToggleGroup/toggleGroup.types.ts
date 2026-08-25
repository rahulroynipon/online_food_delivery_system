import * as React from 'react';

export type ToggleGroupSize = 'xs' | 'sm' | 'md' | 'lg';
export type ToggleGroupVariant = 'outline' | 'filled' | 'pill' | 'ghost';
export type ToggleGroupRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

// ── Group ────────────────────────────────────────────────────────────────────

export interface ToggleGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  /** Selection behaviour */
  type: 'single' | 'multiple';
  /** Controlled value */
  value?: string | string[];
  /** Uncontrolled initial value */
  defaultValue?: string | string[];
  /** Fires on every change */
  onValueChange?: (value: string | string[]) => void;
  size?: ToggleGroupSize;
  variant?: ToggleGroupVariant;
  rounded?: ToggleGroupRounded;
  disabled?: boolean;
  /** Whether all items can be deselected (single mode: deselects; multiple mode: can remove last) */
  allowEmpty?: boolean;
  /** Full-width block layout instead of inline-flex */
  fullWidth?: boolean;
  children?: React.ReactNode;
  items?: ToggleGroupItemOption[];
  activeClassName?: string;
  inactiveClassName?: string;
}

// ── Item ─────────────────────────────────────────────────────────────────────

export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  /** Icon shown to the left of children */
  icon?: React.ReactNode;
  activeClassName?: string;
  inactiveClassName?: string;
}

export interface ToggleGroupItemOption extends Omit<ToggleGroupItemProps, 'children'> {
  label: React.ReactNode;
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface ToggleGroupContextType {
  type: 'single' | 'multiple';
  value: string | string[];
  onItemSelect: (itemValue: string) => void;
  size: ToggleGroupSize;
  variant: ToggleGroupVariant;
  rounded: ToggleGroupRounded;
  disabled?: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
}
