import * as React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
