'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/nb';

interface NbModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const NbModal = ({ isOpen, onClose, title, children, className }: NbModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-nb-black/60 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={cn(
          "relative w-full max-w-lg bg-nb-cream border-[4px] border-nb-black shadow-[8px_8px_0px_var(--nb-black)] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col",
          className
        )}
        style={{ borderRadius: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-[4px] border-nb-black bg-nb-yellow">
          {title ? (
            <h2 className="font-black text-xl uppercase tracking-tight">{title}</h2>
          ) : (
            <div /> // Spacer
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 border-[3px] border-nb-black bg-white flex items-center justify-center shadow-[3px_3px_0px_var(--nb-black)] hover:shadow-[5px_5px_0px_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
