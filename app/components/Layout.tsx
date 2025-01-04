'use client';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900" suppressHydrationWarning>
      {children}
    </div>
  );
} 