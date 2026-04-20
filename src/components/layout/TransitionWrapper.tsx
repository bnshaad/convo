'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

export const TransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    // Avoid synchronous setState in effect for better performance/linting
    requestAnimationFrame(() => {
      setTransitionStage('fadeOut');
    });
  }, [pathname]);

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, children]);

  return (
    <div
      style={{
        transition: 'opacity 150ms ease-in-out',
        opacity: transitionStage === 'fadeIn' ? 1 : 0,
      }}
      className="flex flex-col min-h-screen"
    >
      {displayChildren}
    </div>
  );
};
