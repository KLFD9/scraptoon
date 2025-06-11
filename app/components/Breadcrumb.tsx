'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        href="/"
        className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Accueil</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4 text-gray-600" />
          
          {item.current || !item.href ? (
            <span className="text-gray-300 font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
