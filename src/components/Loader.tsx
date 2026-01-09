"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Loader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  // Don't show loader on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    // Minimum display time for smooth experience
    const minDisplayTime = 2000; // 3 seconds
    const startTime = Date.now();

    const hideLoader = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setIsLoading(false);
        }, 500); // Wait for fade-out animation
      }, remaining);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader);
      return () => window.removeEventListener("load", hideLoader);
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative animate-fade-in">
        <Image
          src="/logoFooter.webp"
          alt="Saabri Group Logo"
          width={120}
          height={120}
          className="animate-logo-subtle"
          priority
          unoptimized={true}
        />
      </div>
    </div>
  );
}
