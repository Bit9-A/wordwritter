'use client';

import { useId } from 'react';

interface AdScriptLoaderProps {
  className?: string;
  scriptUrl: string;
}

/**
 * AdScriptLoader
 * Renders a script element with a loader function that inserts another script 
 * before itself. This is common for ad providers.
 */
export function AdScriptLoader({ className = "", scriptUrl }: AdScriptLoaderProps) {
  const id = useId();
  
  return (
    <div id={`ad-container-${id}`} className={`ad-script-container transition-all hover:scale-[1.01] ${className}`}>
      <script
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
    </div>
  );
}
