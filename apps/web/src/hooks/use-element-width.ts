"use client";

import { useCallback, useRef, useState } from "react";

/** Live content width of an element; 0 until it has mounted. */
export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    if (!node) return;
    observer.current = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.current.observe(node);
  }, []);
  return [ref, width] as const;
}
