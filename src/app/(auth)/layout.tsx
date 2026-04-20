import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FFF8F0] p-4 min-h-screen">
      {children}
    </div>
  );
}
