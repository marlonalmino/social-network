import React, { useState } from "react";

type Props<T> = {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export default function VirtualList<T>({ items, itemHeight, height, overscan = 5, renderItem }: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const topPad = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return (
    <div style={{ height, overflowY: "auto" }} onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}>
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${topPad}px)` }}>
          {items.slice(startIndex, endIndex).map((item, i) => renderItem(item, startIndex + i))}
        </div>
      </div>
    </div>
  );
}

