import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/nb';

export const NbInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3 bg-nb-cream text-nb-black rounded-none",
          "border-2 border-nb-black placeholder:text-nb-black/50",
          "focus:outline-none focus:ring-2 focus:ring-nb-blue focus:ring-offset-2 focus:ring-offset-nb-cream",
          className
        )}
        {...props}
      />
    );
  }
);

NbInput.displayName = "NbInput";
