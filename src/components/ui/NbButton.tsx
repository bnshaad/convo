import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/nb';

interface NbButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const NbButton = forwardRef<HTMLButtonElement, NbButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 font-bold uppercase transition-all duration-150",
          "border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)]",
          "hover:shadow-[6px_6px_0px_var(--nb-black)] hover:-translate-y-[2px] hover:-translate-x-[2px]",
          "active:shadow-[1px_1px_0px_var(--nb-black)] active:translate-y-[3px] active:translate-x-[3px]",
          
          variant === 'primary' && "bg-nb-coral text-nb-black",
          variant === 'secondary' && "bg-nb-blue text-white",
          variant === 'ghost' && "bg-nb-cream text-nb-black",
          className
        )}
        {...props}
      />
    );
  }
);

NbButton.displayName = "NbButton";
