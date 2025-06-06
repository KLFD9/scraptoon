'use client';

import { useState, useEffect } from 'react';

interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  focusClassName?: string;
}

export default function FocusRing({ 
  children, 
  className = '', 
  focusClassName = 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-gray-950' 
}: FocusRingProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div
      className={`${className} ${isFocused && isKeyboardUser ? focusClassName : ''} transition-all duration-200 outline-none`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
