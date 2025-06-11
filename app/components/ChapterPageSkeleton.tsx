'use client'

import React from 'react'

const ChapterPageSkeleton: React.FC = () => {
  const pagePlaceholders = Array.from({ length: 5 }, (_, i) => i); // Simulate 5 pages loading

  return (
    <div className="relative min-h-screen bg-black py-4">
      <div className="container mx-auto space-y-2">
        {pagePlaceholders.map((_, index) => (
          <div
            key={`skeleton-page-${index}`}
            className="relative flex justify-center items-center bg-gray-900 animate-pulse"
            style={{
              // Approximate aspect ratio of a manga page, adjust as needed
              // Assuming a common manga page height, e.g., 1000px, and width ~700px
              // For a responsive skeleton, we can use padding-bottom trick or fixed height
              height: '120vh', // Or a more dynamic calculation if possible
              maxHeight: '1500px', // Max height to prevent overly long skeletons
              minHeight: '800px', // Min height
              width: '100%', // Take full width of the container
            }}
          >
            {/* Optional: Add a subtle shimmer element or icon if desired */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent animate-shimmer"></div> */}
          </div>
        ))}
      </div>
      {/* Skeleton for UI elements like page number or scroll-to-top, if they are prominent */}
      {/* For now, keeping it simple with just page placeholders */}
    </div>
  )
}

export default ChapterPageSkeleton

// Optional: Add a shimmer animation to globals.css if you use the shimmer element
/*
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite linear;
}
*/
