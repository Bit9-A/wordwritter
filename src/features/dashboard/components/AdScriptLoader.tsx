'use client';

import { useEffect, useRef } from 'react';

interface AdScriptLoaderProps {
  className?: string;
  scriptUrl: string;
}

/**
 * AdScriptLoader
 * Dynamically injects an ad script that uses d.scripts[d.scripts.length - 1] logic.
 */
export function AdScriptLoader({ className = "", scriptUrl }: AdScriptLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create the script element
    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    
    // Instead of setting src directly, we wrap the loader logic 
    // to ensure 'l' (the current script) is found correctly.
    // We append the script element to the DOM, then set its text content.
    
    script.textContent = `
      (function(ehz){
        var d = document,
            s = d.createElement('script'),
            l = d.scripts[d.scripts.length - 1];
        s.settings = ehz || {};
        s.src = "${scriptUrl.replace(/"/g, '\\"')}";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.parentNode.insertBefore(s, l);
      })({})
    `;

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup: remove the scripts if component unmounts
      // Note: the loader script inserts ANOTHER script (s), 
      // which we don't have a direct reference to here easily, 
      // but usually these are meant to stay or be handled by the provider.
      if (containerRef.current?.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [scriptUrl]);

  return (
    <div ref={containerRef} className={`ad-script-container flex justify-center items-center min-h-[50px] ${className}`} />
  );
}
