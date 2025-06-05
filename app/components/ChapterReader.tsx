'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface ChapterReaderProps {
  pages: string[]
  title: string
  chapter: string
  mangaTitle: string
  onPageChange?: (page: number) => void
}

const ChapterReader: React.FC<ChapterReaderProps> = ({ pages, title, chapter, mangaTitle, onPageChange }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const totalPages = pages.length
  const containerRef = useRef<HTMLDivElement>(null)

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
    <div className="relative min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-sm text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">{mangaTitle}</h1>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm">Chapitre {chapter}{title && ` - ${title}`}</p>
            <p className="text-sm">Page {currentPage}/{totalPages}</p>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(loadedImages.size / totalPages) * 100}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1">
              {loadedImages.size}/{totalPages} pages chargées
            </p>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="container mx-auto pt-24 pb-8 space-y-4">
        {pages.map((url, index) => {
          const isLoaded = loadedImages.has(index)
          const hasError = imageErrors.has(index)
          return (
            <div key={url} data-index={index} className="relative flex justify-center">
              {hasError ? (
                <div className="bg-gray-800 text-white p-8 text-center rounded-lg w-full">
                  <p>Erreur de chargement de l&apos;image {index + 1}</p>
                  <p className="text-sm text-gray-400 mt-2 break-words">URL: {url}</p>
                </div>
              ) : (
                <Image
                  src={url}
                  alt={`Page ${index + 1}`}
                  width={800}
                  height={1200}
                  className={`max-w-full h-auto ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  loading="lazy"
                  unoptimized
                />
              )}
              {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                  <div className="animate-pulse text-gray-400 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2" />
                    <p>Chargement page {index + 1}...</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg p-2">
          <button
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retour en haut
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChapterReader
