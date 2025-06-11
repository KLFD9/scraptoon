'use client';

import { useEffect, useRef, useState } from 'react';

interface VirtualizedGridProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export default function VirtualizedGrid({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
}: VirtualizedGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const itemsPerRow = 6; // Adjust based on your grid
  const rowHeight = itemHeight;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const visibleItems = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col;
      if (index < items.length) {
        visibleItems.push({
          item: items[index],
          index,
          row,
          col,
          top: row * rowHeight,
        });
      }
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: `${(index % itemsPerRow) * (100 / itemsPerRow)}%`,
              width: `${100 / itemsPerRow}%`,
              height: rowHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
