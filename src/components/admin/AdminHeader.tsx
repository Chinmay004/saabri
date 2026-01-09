'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function AdminHeader() {
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const { user } = useAuth();
  
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/enquiries', label: 'Enquiries' },
    ...(user?.role === 'ADMIN' ? [
      { href: '/admin/users', label: 'Users' },
    ] : []),
  ];

  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
        <div className="flex-1 flex items-center">
          <Link href="/admin/dashboard" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="flex-shrink-0">
              <Image
                src="/logoFooter.webp"
                alt="Saabri"
                width={60}
                height={60}
                className="h-8 sm:h-9 w-auto"
                priority
              />
            </div>
            <span className="text-gray-900 font-semibold text-xs sm:text-sm hidden sm:inline font-manrope">Admin Panel</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="text-gray-800 hover:text-gray-900 text-base font-medium transition-colors font-manrope"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 font-manrope"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col divide-y divide-gray-100 px-4 py-2 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded text-sm transition-colors block font-manrope"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

