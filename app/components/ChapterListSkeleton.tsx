'use client';

import React from 'react';
import SkeletonLoader from './SkeletonLoader'; // Assuming SkeletonLoader is a generic shimmer component

const ChapterListSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto p-4 animate-pulse">
      {/* Header Section: Manga Title and Cover */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/3">
          <SkeletonLoader className="w-full h-96 rounded-lg" />
        </div>
        <div className="md:w-2/3 space-y-4">
          <SkeletonLoader className="h-10 w-3/4 rounded" /> {/* Manga Title */}
          <SkeletonLoader className="h-6 w-1/2 rounded" /> {/* Author/Artist */}
          <div className="flex gap-2 mt-2">
            <SkeletonLoader className="h-4 w-16 rounded-full" /> {/* Genre Tag */}
            <SkeletonLoader className="h-4 w-20 rounded-full" /> {/* Genre Tag */}
            <SkeletonLoader className="h-4 w-12 rounded-full" /> {/* Genre Tag */}
          </div>
          <SkeletonLoader className="h-24 w-full rounded mt-2" /> {/* Synopsis */}
          <div className="flex gap-4 mt-4">
            <SkeletonLoader className="h-10 w-32 rounded-md" /> {/* Read Button */}
            <SkeletonLoader className="h-10 w-32 rounded-md" /> {/* Favorite Button */}
          </div>
        </div>
      </div>

      {/* Chapter List Section */}
      <div className="space-y-3">
        <SkeletonLoader className="h-8 w-1/4 rounded mb-4" /> {/* "Chapters" Heading */}
        {[...Array(10)].map((_, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-md">
            <SkeletonLoader className="h-6 w-3/5 rounded" /> {/* Chapter Title/Number */}
            <SkeletonLoader className="h-6 w-1/5 rounded" /> {/* Chapter Date/Read Icon */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterListSkeleton;
