'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  shimmer,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  shimmer?: boolean;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-muted relative flex h-1.5 w-full items-center overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'size-full flex-1 rounded-full transition-all',
          'from-primary/60 via-primary to-primary/80 bg-gradient-to-r',
          shimmer && 'animate-shimmer',
        )}
        style={
          shimmer
            ? { backgroundSize: '200% 100%' }
            : { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
