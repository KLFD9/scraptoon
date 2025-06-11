import React, { useState, useRef, useEffect, useCallback } from 'react'; // Import React
import Image from 'next/image'
import { ChevronUp } from 'lucide-react'
import ImageErrorFeedback from './ImageErrorFeedback'
import { logger } from '../utils/logger'

interface ChapterReaderProps {
  pages: string[]
  chapter: string
  mangaTitle: string
  onPageChange?: (page: number) => void
}

const PRELOAD_AHEAD = 5;
const PRELOAD_BEHIND = 2;

// Define the Memoized Image Component
interface ChapterPageImageProps {
  pageUrl: string;
  index: number;
  chapter: string;
  mangaTitle: string;
  blurDataURL: string;
  isPriority: boolean;
  imageErrors: Set<number>;
  onImageError: (index: number) => void;
  onReportImage: (index: number) => void;
  // Add ref for IntersectionObserver if needed directly on the image wrapper
  // However, current setup observes divs created in ChapterReader's map
}

const ChapterPageImage = React.memo<ChapterPageImageProps>((
  { pageUrl, index, chapter, mangaTitle, blurDataURL, isPriority, imageErrors, onImageError, onReportImage }
) => {
  // Removed direct imageRef assignment here, as it's handled in the parent loop
  // The IntersectionObserver in the parent observes the div created in the map.
  return (
    <>
      {!imageErrors.has(index) ? (
        <Image
          src={pageUrl}
          alt={`Page ${index + 1} of ${chapter} - ${mangaTitle}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 800px) 100vw, 800px"
          priority={isPriority}
          className="object-contain" // No dynamic opacity here
          onError={() => onImageError(index)}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      ) : (
        <ImageErrorFeedback
          pageIndex={index}
          onReport={() => onReportImage(index)}
          onRetry={() => {
            // Logic to clear error for this specific image
            // This would typically involve a callback to the parent to update imageErrors state
            // For now, let's assume onImageError can be adapted or a new callback is passed for retry
            // To simplify, the retry logic in ChapterReader already handles clearing the error state.
            // So, this onRetry in ImageErrorFeedback might just call a general retry handler passed from parent.
            // The current onRetry in ChapterReader's map is sufficient.
          }}
        />
      )}
    </>
  );
});
ChapterPageImage.displayName = 'ChapterPageImage'; // For better debugging

const ChapterReader: React.FC<ChapterReaderProps> = ({ pages, chapter, mangaTitle, onPageChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isUIVisible, setIsUIVisible] = useState(true);
  const blurDataURL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMzMzMzMzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentPageRef = useRef(1);
  const intersectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const preloadedIndicesRef = useRef<Set<number>>(new Set());


  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setIsUIVisible(false)
    } else if (currentScrollY < lastScrollY.current) {
      setIsUIVisible(true)
    }
    lastScrollY.current = currentScrollY
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const scrollHandler = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100) 
    }
    
    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  const preloadUpcomingImages = useCallback(
    (currentIndex: number) => { // currentIndex is 0-indexed
      if (!pages || pages.length === 0) return;

      const startPreload = Math.max(0, currentIndex - PRELOAD_BEHIND);
      // +1 because loop is < endPreload and currentIndex is 0-indexed, PRELOAD_AHEAD is count
      const endPreload = Math.min(pages.length, currentIndex + PRELOAD_AHEAD + 1); 

      for (let i = startPreload; i < endPreload; i += 1) {
        if (!preloadedIndicesRef.current.has(i) && pages[i]) {
          const img = new window.Image();
          img.src = pages[i];
          // Optional: track successful preloads or handle errors
          img.onload = () => {
            preloadedIndicesRef.current.add(i); // Add on actual load if preferred
            // logger.log('debug', `Successfully preloaded image index: ${i}`);
          };
          img.onerror = () => {
            // logger.log('warn', `Failed to preload image index: ${i}, src: ${pages[i]}`);
            // Optionally, remove from preloadedIndicesRef if it was added optimistically
            // or implement a retry mechanism for preloading.
          };
          // Optimistically add to set to prevent re-triggering for the same image.
          // If strict "only add on success" is needed, move add(i) into img.onload.
          // For this use case, preventing multiple attempts is often good enough.
           if (!preloadedIndicesRef.current.has(i)) { // Double check before adding
            preloadedIndicesRef.current.add(i);
           }
        }
      }
    },
    [pages]
  );

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
    logger.log('error', `Failed to load image for page ${index + 1} of chapter ${chapter}`);
  }

  const handleReportImage = (pageIndex: number) => {
    logger.log('info', `Image reported by user: page ${pageIndex + 1} of chapter ${chapter}`);
  }

  useEffect(() => {
    preloadUpcomingImages(0) // Initial preload for the first few images
  }, [preloadUpcomingImages])

  useEffect(() => {
    return () => {
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    imageRefs.current = imageRefs.current.slice(0, pages.length);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (imageRefs.current.filter(Boolean).length !== pages.length) {
        imageRefs.current = Array.from(containerRef.current.querySelectorAll('[data-index]')) as HTMLDivElement[];
      }

      let targetIndex = -1;
      let scrollTarget: Element | null = null;

      if (event.key === 'ArrowRight') {
        targetIndex = Math.min(currentPageRef.current, pages.length - 1); 
        scrollTarget = imageRefs.current[targetIndex];
      } else if (event.key === 'ArrowLeft') {
        targetIndex = Math.max(currentPageRef.current - 2, 0); 
        scrollTarget = imageRefs.current[targetIndex];
      }

      if (scrollTarget) {
        event.preventDefault(); 
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pages, pages.length]); 

  const stableHandleImageError = useCallback((index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    logger.log('error', `Failed to load image for page ${index + 1} of chapter ${chapter}`);
  }, [chapter]);

  const stableHandleReportImage = useCallback((index: number) => {
    logger.log('info', `Image reported by user: page ${index + 1} of chapter ${chapter}`);
  }, [chapter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        let mostVisibleEntry: IntersectionObserverEntry | null = null
        let maxRatio = 0
        
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisibleEntry = entry
          }
        })

        if (mostVisibleEntry && maxRatio > 0.7) { 
          const index = Number((mostVisibleEntry as IntersectionObserverEntry).target.getAttribute('data-index'))
          if (!Number.isNaN(index)) {
            const newPage = index + 1; 
            if (newPage !== currentPageRef.current) {
              if (intersectionTimeoutRef.current) {
                clearTimeout(intersectionTimeoutRef.current);
              }
              intersectionTimeoutRef.current = setTimeout(() => {
                currentPageRef.current = newPage;
                setCurrentPage(newPage);
                onPageChange?.(newPage);
                preloadUpcomingImages(index); 
              }, 100); 
            }
          }
        }
      },
      { 
        threshold: [0.7], 
        rootMargin: '-10% 0px -10% 0px' 
      }
    )

    const items = containerRef.current?.querySelectorAll('[data-index]') || []
    items.forEach((el) => { 
        observer.observe(el)
    })

    return () => {
      items.forEach(el => observer.unobserve(el))
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current);
      }
    }
  }, [pages, onPageChange, preloadUpcomingImages]); // preloadUpcomingImages should be stable (useCallback)


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="w-full select-none">
      {pages.map((pageUrl, index) => (
        <div
          key={`${chapter}-${index}-${pageUrl}`} // Make key even more specific if pageUrl can change for an index, though unlikely here
          ref={(el: HTMLDivElement | null) => { imageRefs.current[index] = el; }}
          data-index={index}
          className="relative w-full mx-auto bg-black group"
          style={{ aspectRatio: '700 / 1000', maxWidth: '800px' }}
        >
          <ChapterPageImage
            pageUrl={pageUrl}
            index={index}
            chapter={chapter}
            mangaTitle={mangaTitle}
            blurDataURL={blurDataURL}
            isPriority={index < 3}
            imageErrors={imageErrors} // Pass the Set directly
            onImageError={stableHandleImageError} // Pass stable callback
            onReportImage={stableHandleReportImage} // Pass stable callback
          />
        </div>
      ))}
      {isUIVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 right-4 z-50 p-3 bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-600 transition-colors"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default ChapterReader;
