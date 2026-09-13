"use client"

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // We can't use next/router events here in app router,
    // so we'll simulate loading on pathname change.
    handleStart();
    const timer = setTimeout(() => {
      handleComplete();
    }, 500); // Simulate a 500ms load time

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-1 bg-primary transition-transform duration-300 ease-out ${
        loading ? 'scale-x-100' : 'scale-x-0'
      } origin-left`}
      style={{
        transform: loading ? 'scaleX(0.8)' : 'scaleX(1)',
        transition: 'transform 0.5s ease-out',
        transformOrigin: 'left',
        willChange: 'transform',
        zIndex: 9999,
      }}
    />
  );
}
