'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface GenreCardProps {
  name: string;
  icon: string;
  color: string;
  description: string;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  popularityLevel?: 'low' | 'medium' | 'high';
}

export default function GenreCard({
  name,
  icon,
  color,
  description,
  onClick,
  size = 'medium',
  showStats = false,
  popularityLevel = 'medium'
}: GenreCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    small: 'p-2 text-xs',
    medium: 'p-3 text-sm',
    large: 'p-4 text-base'
  };

  const iconSizeClasses = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const popularityIndicator = {
    low: '🔥',
    medium: '🔥🔥',
    high: '🔥🔥🔥'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden flex items-center gap-3 ${sizeClasses[size]} rounded-xl bg-gray-800/60 border border-gray-700/30 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-gray-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50`}
    >
      {/* Animated Background Gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${color} transition-all duration-500 ${
          isHovered ? 'opacity-15 scale-110' : 'opacity-0 scale-100'
        }`} 
      />
      
      {/* Sparkle Effects */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <Sparkles 
              key={i}
              className={`absolute w-3 h-3 text-white/20 animate-pulse`}
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
                animationDelay: `${i * 200}ms`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Icon Container */}
      <div className="relative z-10 flex-shrink-0">
        <div 
          className={`${iconSizeClasses[size]} transition-all duration-300 ${
            isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
          }`}
        >
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-left flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-white transition-colors truncate">
            {name}
          </h5>
          {showStats && (
            <span className="text-xs opacity-60 flex-shrink-0">
              {popularityIndicator[popularityLevel]}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors truncate">
          {description}
        </p>
      </div>
      
      {/* Arrow Icon */}
      <div className="relative z-10 flex-shrink-0">
        <ArrowRight 
          className={`w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-all duration-300 ${
            isHovered ? 'translate-x-1 scale-110' : 'translate-x-0 scale-100'
          }`} 
        />
      </div>
      
      {/* Shine Effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-all duration-700 transform ${
          isHovered ? 'translate-x-full' : '-translate-x-full'
        }`}
        style={{ 
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          width: '200%'
        }}
      />
    </button>
  );
}
