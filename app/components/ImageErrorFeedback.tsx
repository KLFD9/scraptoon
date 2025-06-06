'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ImageErrorFeedbackProps {
  pageIndex: number
  onReport?: (pageIndex: number) => void
}

const ImageErrorFeedback: React.FC<ImageErrorFeedbackProps> = ({ 
  pageIndex, 
  onReport 
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

  if (!isVisible) return null

  return (
    <div className="absolute top-2 right-2 z-10">
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
