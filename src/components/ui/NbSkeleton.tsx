import { cn } from "@/lib/nb";

interface NbSkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle';
}

export const NbSkeleton = ({ className, variant = 'rect' }: NbSkeletonProps) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-nb-black/10 border-[2px] border-nb-black border-dashed",
        variant === 'circle' ? "rounded-full" : "rounded-none",
        className
      )}
    />
  );
};
