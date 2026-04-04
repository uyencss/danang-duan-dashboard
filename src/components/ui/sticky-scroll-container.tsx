"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StickyScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  tableSelector?: string;
}

export function StickyScrollContainer({ 
  children, 
  className,
  tableSelector = "table"
}: StickyScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const table = container.querySelector(tableSelector);
      if (table) {
        const scrollWidth = table.scrollWidth;
        const clientWidth = container.clientWidth;
        setContentWidth(scrollWidth);
        setIsVisible(scrollWidth > clientWidth);
      }
    };

    const handleContainerScroll = () => {
      if (mirrorRef.current && container.scrollLeft !== mirrorRef.current.scrollLeft) {
        mirrorRef.current.scrollLeft = container.scrollLeft;
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    
    const table = container.querySelector(tableSelector);
    if (table) resizeObserver.observe(table);

    container.addEventListener("scroll", handleContainerScroll);
    
    // Initial sync
    setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleContainerScroll);
    };
  }, [tableSelector]);

  return (
    <div className="relative w-full">
      <div 
        ref={containerRef} 
        className={cn("overflow-x-auto scrollbar-hide", className)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          ref={mirrorRef}
          onScroll={(e) => {
            if (containerRef.current) {
              containerRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          className="sticky bottom-0 left-0 right-0 z-50 h-3 overflow-x-auto bg-white/40 backdrop-blur-sm border-t border-slate-200/50"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div style={{ width: contentWidth }} className="h-px" />
        </div>
      )}
    </div>
  );
}
