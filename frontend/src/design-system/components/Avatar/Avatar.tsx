import * as React from 'react';
import type { AvatarProps } from './avatar.types';

export function Avatar({ src, alt, fallback, size = 'md', className = '', ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div
      className={`relative flex shrink-0 select-none items-center justify-center rounded-full overflow-hidden ${selectedSizeClass} ${className}`}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
          {fallback}
        </div>
      )}
    </div>
  );
}
