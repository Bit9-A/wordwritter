'use client';

import { useEffect, useRef } from 'react';

interface AdScriptImperativeProps {
  className?: string;
  scriptUrl: string;
}

export function AdScriptImperative({ className = "", scriptUrl }: AdScriptImperativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.src = scriptUrl;

    // Custom logic from the provided script: insert before the script element itself
    // In React, we can't easily get the "current script" using d.scripts[d.scripts.length - 1] 
    // because React might be batching or the order might be different.
    // However, the script provided is mostly a loader.
    
    // We'll append it to our container.
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current?.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [scriptUrl]);

  return (
    <div ref={containerRef} className={`ad-script-container ${className}`} />
  );
}
