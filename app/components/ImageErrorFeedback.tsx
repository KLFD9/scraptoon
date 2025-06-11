'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ImageErrorFeedbackProps {
  pageIndex: number
  onReport?: (pageIndex: number) => void
  onRetry?: (pageIndex: number) => void; // Added onRetry prop
}

const ImageErrorFeedback: React.FC<ImageErrorFeedbackProps> = ({ 
  pageIndex, 
  onReport, 
  onRetry // Added onRetry to destructuring
}) => {
  const [isReported, setIsReported] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const handleReport = () => {
    setIsReported(true)
    onReport?.(pageIndex)
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setIsVisible(false)
    }, 2000)
  }

  const handleRetry = () => {
    onRetry?.(pageIndex);
    // Reset visibility and reported state to allow the component to be shown again for a new retry attempt
    setIsVisible(true); 
    setIsReported(false); // Allow reporting again if retry also fails
  }

  if (!isVisible) return null

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-2">
      {onRetry && (
        <button 
          onClick={handleRetry}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-colors text-xs"
          aria-label="Retry loading image"
        >
          Retry
        </button>
      )}
      {!isReported ? (
        <button
          onClick={handleReport}
          className="bg-amber-600/80 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
          title="Signaler cette image manquante"
        >
          <AlertTriangle size={12} />
          <span className="hidden sm:inline">Signaler</span>
        </button>
      ) : (
        <div className="bg-green-600/80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          <span>Signalé</span>
          <button
            onClick={() => setIsVisible(false)}
            className="hover:bg-green-700/50 rounded p-0.5"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageErrorFeedback
