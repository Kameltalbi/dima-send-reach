import { ReactNode } from "react";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      {children}
    </div>
  );
}
