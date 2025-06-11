'use client';

import { useEffect } from 'react';

interface MobileScrollOptimizerProps {
  children: React.ReactNode;
  preventOverscroll?: boolean;
  smoothScroll?: boolean;
}

/**
 * Composant d'optimisation du scroll mobile
 * - Prévient l'overscroll sur iOS
 * - Active le scroll fluide
 * - Optimise les performances de scroll
 */
export default function MobileScrollOptimizer({ 
  children, 
  preventOverscroll = true, 
  smoothScroll = true 
}: MobileScrollOptimizerProps) {
  useEffect(() => {
    // Optimisations CSS pour mobile
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Optimisations scroll mobile */
        body {
          ${smoothScroll ? 'scroll-behavior: smooth;' : ''}
          ${preventOverscroll ? 'overscroll-behavior: none;' : ''}
          -webkit-overflow-scrolling: touch;
        }
        
        /* Amélioration des performances de scroll */
        * {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        /* Prévention du bounce sur iOS */
        .scroll-container {
          ${preventOverscroll ? 'overscroll-behavior-y: contain;' : ''}
          will-change: transform;
        }
        
        /* Optimisation des images pendant le scroll */
        img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
        }
        
        /* Réduction du flickering */
        .fade-in-image {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        
        .fade-in-image.loaded {
          opacity: 1;
        }
        
        /* Amélioration des transitions hover sur mobile */
        @media (hover: none) and (pointer: coarse) {
          .group:hover * {
            transition-duration: 0s !important;
          }
        }
        
        /* Préchargement optimisé */
        .preload-hint {
          content-visibility: auto;
          contain-intrinsic-size: 0 200px;
        }
      `;
      
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [preventOverscroll, smoothScroll]);

  useEffect(() => {
    // Gestion du scroll momentum sur iOS
    const handleTouchMove = (e: TouchEvent) => {
      // Prévient le comportement par défaut qui peut causer des problèmes de scroll
      if (preventOverscroll && window.scrollY <= 0 && e.touches[0].clientY > e.touches[0].clientY) {
        e.preventDefault();
      }
    };

    if (preventOverscroll) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [preventOverscroll]);

  return (
    <div className="scroll-container">
      {children}
    </div>
  );
}

/**
 * Hook pour optimiser le scroll mobile
 */
export function useMobileScrollOptimization() {
  useEffect(() => {
    // Détection mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Optimisations spécifiques mobile
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      
      // Prévention du zoom accidentel
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }

    return () => {
      // Nettoyage
      if (isMobile) {
        document.body.style.overscrollBehavior = '';
        document.documentElement.style.overscrollBehavior = '';
      }
    };
  }, []);
}
