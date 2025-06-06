'use client';

import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';
  delay?: number;
  className?: string;
}

export default function AnimatedSection({ 
  children, 
  animation = 'fade-up', 
  delay = 0,
  className = '' 
}: AnimatedSectionProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });

  const animationClasses = {
    'fade-up': {
      initial: 'opacity-0 translate-y-8',
      animate: 'opacity-100 translate-y-0'
    },
    'fade-in': {
      initial: 'opacity-0',
      animate: 'opacity-100'
    },
    'slide-left': {
      initial: 'opacity-0 -translate-x-8',
      animate: 'opacity-100 translate-x-0'
    },
    'slide-right': {
      initial: 'opacity-0 translate-x-8',
      animate: 'opacity-100 translate-x-0'
    },
    'scale': {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100'
    }
  };

  const { initial, animate } = animationClasses[animation];
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ease-out ${
        isVisible ? animate : initial
      } ${className}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms'
      }}
    >
      {children}
    </div>
  );
}
