'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronUp } from 'lucide-react'
import ImageErrorFeedback from './ImageErrorFeedback'

interface ChapterReaderProps {
  pages: string[]
  chapter: string
  mangaTitle: string
  onPageChange?: (page: number) => void
}

const ChapterReader: React.FC<ChapterReaderProps> = ({ pages, chapter, mangaTitle, onPageChange }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [isUIVisible, setIsUIVisible] = useState(true)
  const blurDataURL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjY2NjY2NjIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4='
  const lastScrollY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentPageRef = useRef(1)
  const intersectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Stable scroll handler for UI visibility only
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setIsUIVisible(false)
    } else if (currentScrollY < lastScrollY.current) {
      setIsUIVisible(true)
    }
    lastScrollY.current = currentScrollY
  }, [])

  // Throttled scroll event
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const scrollHandler = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100) // Throttle to 100ms
    }
    
    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  const preloadedIndicesRef = useRef<Set<number>>(new Set())

  // Simple preloading - only nearby images
  const preloadUpcomingImages = useCallback(
    (index: number) => {
      const start = Math.max(0, index - 1)
      const end = Math.min(start + 2, pages.length)
      for (let i = start; i < end; i += 1) {
        if (!preloadedIndicesRef.current.has(i)) {
          const img = new window.Image()
          img.src = pages[i]
          preloadedIndicesRef.current.add(i)
        }
      }
    },
    [pages]
  )

  // Stable page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      if (page !== currentPageRef.current) {
        // Clear previous timeout
        if (intersectionTimeoutRef.current) {
          clearTimeout(intersectionTimeoutRef.current)
        }
        
        // Debounce page changes
        intersectionTimeoutRef.current = setTimeout(() => {
          currentPageRef.current = page
          setCurrentPage(page)
          onPageChange?.(page)
          preloadUpcomingImages(page - 1)
        }, 200) // 200ms debounce
      }
    },
    [onPageChange, preloadUpcomingImages]
  )

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const handleReportImage = (pageIndex: number) => {
    // Optionnel : envoyer le rapport à un service de feedback
    console.log(`Image signalée pour la page ${pageIndex + 1}`)
  }

  // Initial preload
  useEffect(() => {
    preloadUpcomingImages(0)
  }, [preloadUpcomingImages])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current)
      }
    }
  }, [])

  // Simplified Intersection Observer - less aggressive
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // Find the most visible entry
        let mostVisibleEntry: IntersectionObserverEntry | null = null
        let maxRatio = 0
        
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisibleEntry = entry
          }
        })

        if (mostVisibleEntry && maxRatio > 0.7) { // Only change when really visible
          const index = Number((mostVisibleEntry as IntersectionObserverEntry).target.getAttribute('data-index'))
          if (!Number.isNaN(index)) {
            handlePageChange(index + 1)
          }
        }
      },
      { 
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Multiple thresholds
        rootMargin: '-20% 0px -20% 0px' // More conservative margins
      }
    )

    // Observe only every other image to reduce sensitivity
    const items = containerRef.current?.querySelectorAll('[data-index]') || []
    items.forEach((el, index) => {
      if (index % 1 === 0) { // Observe all images but with higher threshold
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [pages, handlePageChange])

  return (
    <div className="relative min-h-screen bg-black"> {/* Changed background to black for immersive reading */}
      {/* Header has been removed as per user request */}

      {/* Content: Images */}
      <div ref={containerRef} className="container mx-auto pt-4 pb-16 space-y-0">
        {pages.map((url, index) => {
          const isLoaded = loadedImages.has(index)
          const hasError = imageErrors.has(index)
          
          return (
            <div 
              key={`${url}-${index}`} 
              data-index={index} 
              className="relative flex justify-center bg-black" 
              style={{ minHeight: 1200 }}
            >
              {hasError ? (
                <div className="bg-gray-800 text-white p-8 text-center rounded-lg w-full h-[60vh] flex flex-col justify-center items-center">
                  <p>Erreur de chargement de l&apos;image {index + 1}</p>
                  <p className="text-sm text-gray-400 mt-2 break-words">URL: {url}</p>
                  {/* Feedback optionnel pour signaler l'erreur */}
                  <ImageErrorFeedback 
                    pageIndex={index} 
                    onReport={handleReportImage}
                  />
                </div>
              ) : (
                <Image
                  src={url}
                  alt={`Page ${index + 1} - ${mangaTitle} - Chapitre ${chapter}`}
                  fill
                  sizes="100vw"
                  className={`object-contain transition-opacity duration-200 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  priority={index < 2}
                />
              )}
              {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black min-h-[60vh]">
                  <div className="text-gray-400 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mx-auto mb-2" />
                    <p>Chargement page {index + 1}...</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>


    </div>
  )
}

export default ChapterReader
