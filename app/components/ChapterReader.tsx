'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronUp } from 'lucide-react'

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
  const lastScrollY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) { // Scrolling down and past a certain point
      setIsUIVisible(false)
    } else if (currentScrollY < lastScrollY.current) { // Scrolling up
      setIsUIVisible(true)
    }
    lastScrollY.current = currentScrollY
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handlePageChange = useCallback((page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page)
      onPageChange?.(page)
    }
  }, [currentPage, onPageChange])

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev.add(index)))
  }

  const handleImageError = (index: number) => {
    console.error(`Erreur de chargement de l'image ${index + 1}`)
    setImageErrors(prev => new Set(prev.add(index)))
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            if (!Number.isNaN(index)) {
              handlePageChange(index + 1)
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    const items = containerRef.current?.querySelectorAll('[data-index]') || []
    items.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [pages, handlePageChange])

  return (
    <div className="relative min-h-screen bg-black"> {/* Changed background to black for immersive reading */}
      {/* Header has been removed as per user request */}

      {/* Content: Images */}
      <div ref={containerRef} className="container mx-auto pt-4 pb-16 space-y-0"> {/* Adjusted padding, no space between images */}
        {pages.map((url, index) => {
          const isLoaded = loadedImages.has(index)
          const hasError = imageErrors.has(index)
          return (
            <div key={url} data-index={index} className="relative flex justify-center bg-black"> {/* Ensure background is black */}
              {hasError ? (
                <div className="bg-gray-800 text-white p-8 text-center rounded-lg w-full h-[60vh] flex flex-col justify-center items-center">
                  <p>Erreur de chargement de l&apos;image {index + 1}</p>
                  <p className="text-sm text-gray-400 mt-2 break-words">URL: {url}</p>
                </div>
              ) : (
                <Image
                  src={url}
                  alt={`Page ${index + 1} - ${mangaTitle} - Chapitre ${chapter}`}
                  width={800} // Adjust as per your design needs
                  height={1200} // Adjust as per your design needs
                  className={`max-w-full h-auto ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  loading={index < 2 ? "eager" : "lazy"} // Conditionally set loading based on priority
                  unoptimized // If images are from external sources and already optimized
                  priority={index < 2} // Prioritize loading first few images
                />
              )}
              {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black min-h-[60vh]"> {/* Ensure loader background matches */}
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

      {/* Footer: Back to Top and other potential controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          isUIVisible ? 'translate-y-0' : 'translate-y-full'
        } bg-black/70 backdrop-blur-sm p-3 flex justify-center items-center shadow-md_top`} // shadow-md_top for a subtle top shadow
      >
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsUIVisible(true); // Ensure UI is visible when scrolling to top
          }}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-full flex items-center text-sm"
          aria-label="Retour en haut"
        >
          <ChevronUp className="h-5 w-5 mr-1" />
          Retour en haut
        </button>
        {/* Add other controls here if needed, e.g., next/prev chapter */}
      </div>
    </div>
  )
}

export default ChapterReader
