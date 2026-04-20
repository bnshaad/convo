import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/nb';

export const NbCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-nb-card border-[3px] border-nb-black shadow-[5px_5px_0px_var(--nb-black)]",
          className
        )}
        {...props}
      />
    );
  }
);

NbCard.displayName = "NbCard";
