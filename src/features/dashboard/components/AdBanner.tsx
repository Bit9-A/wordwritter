'use client';

import { useEffect } from 'react';

interface AdBannerProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ className = "" }: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`ad-container overflow-hidden w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6219970220596393"
        data-ad-slot="8730014249"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
