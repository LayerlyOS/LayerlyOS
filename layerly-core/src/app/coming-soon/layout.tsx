import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="antialiased">
      {children}
    </div>
  );
}
