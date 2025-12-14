'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-white fixed top-3 md:top-6 z-50 w-[95%] md:w-[90%] lg:w-[70%] left-1/2 -translate-x-1/2 flex items-center justify-between px-4 md:px-6 lg:px-10 py-2 md:py-3 rounded-full font-manrope font-semibold text-xs md:text-sm">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <Link href="/" className="flex items-center">
          <div className="relative h-6 w-20 md:h-8 md:w-24">
            <Image
              src="/logo.webp"
              alt="Saabri Group Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-10">
        <Link 
          href="/" 
          className={`tracking-[0.28px] transition-colors ${
            isActive('/') ? 'text-black' : 'text-[#636363]'
          }`}
        >
          Home
        </Link>
        <Link 
          href="/projects" 
          className={`tracking-[0.28px] transition-colors ${
            isActive('/projects') ? 'text-black' : 'text-[#636363]'
          }`}
        >
          Projects
        </Link>
        <Link 
          href="/about" 
          className={`tracking-[0.28px] transition-colors ${
            isActive('/about') ? 'text-black' : 'text-[#636363]'
          }`}
        >
          About Us
        </Link>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden w-8 h-8 flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isMenuOpen ? (
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg py-4 px-6 flex flex-col gap-4 lg:hidden z-50">
          <Link 
            href="/" 
            className={`tracking-[0.28px] py-2 transition-colors ${
              isActive('/') ? 'text-black' : 'text-[#636363]'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/projects" 
            className={`tracking-[0.28px] py-2 transition-colors ${
              isActive('/projects') ? 'text-black' : 'text-[#636363]'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Projects
          </Link>
          <Link 
            href="/about" 
            className={`tracking-[0.28px] py-2 transition-colors ${
              isActive('/about') ? 'text-black' : 'text-[#636363]'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
        </nav>
      )}
    </header>
  );
}
