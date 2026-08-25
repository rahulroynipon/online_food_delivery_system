import * as React from 'react';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

export interface ResponsiveSide {
  mobile?: DrawerSide;
  tablet?: DrawerSide;
  desktop?: DrawerSide;
}

export type DrawerVariant = 'temporary' | 'persistent' | 'permanent';

export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | number | string;

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: DrawerSide | ResponsiveSide;
  variant?: DrawerVariant;
  size?: DrawerSize;
  responsive?: boolean;
  defaultSide?: DrawerSide;
  children?: React.ReactNode;
}

export interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

export interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export interface DrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
