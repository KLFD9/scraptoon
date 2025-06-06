'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, Clock, Star } from 'lucide-react';

interface StatsDisplayProps {
  className?: string;
}

const STATS = [
  {
    id: 'titles',
    name: 'Titres disponibles',
    value: '10,000+',
    icon: BookOpen,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'users',
    name: 'Lecteurs actifs',
    value: '50,000+',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  {
    id: 'updates',
    name: 'Mises à jour quotidiennes',
    value: '100+',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10'
  },
  {
    id: 'rating',
    name: 'Note moyenne',
    value: '4.8/5',
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  }
];

export default function StatsDisplay({ className = '' }: StatsDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-800/30 animate-pulse">
            <div className="w-8 h-8 bg-gray-700 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {STATS.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className={`p-4 rounded-lg border border-gray-700 ${stat.bgColor} backdrop-blur-sm transition-all duration-300 hover:scale-105`}
          >
            <div className={`w-8 h-8 ${stat.color} mb-3`}>
              <IconComponent className="w-full h-full" />
            </div>
            <div className="text-white font-semibold text-lg mb-1">
              {stat.value}
            </div>
            <div className="text-gray-400 text-sm">
              {stat.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
