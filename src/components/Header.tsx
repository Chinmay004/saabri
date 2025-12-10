import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white fixed top-6 z-50 w-[70%] left-1/2 -translate-x-1/2 flex items-center justify-between px-10 py-3 rounded-full font-manrope font-semibold text-sm">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <div className="relative h-8 w-24">
          <Image
            src="/logo.webp"
            alt="Saabri Group Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-10">
        <Link 
          href="/" 
          className="text-black tracking-[0.28px]"
        >
          Home
        </Link>
        <Link 
          href="/projects" 
          className="text-[#636363] tracking-[0.28px]"
        >
          Projects
        </Link>
        <Link 
          href="/about" 
          className="text-[#636363] tracking-[0.28px]"
        >
          About Us
        </Link>
        <Link 
          href="/why-dubai" 
          className="text-[#636363] tracking-[0.28px]"
        >
          Why Dubai
        </Link>
      </nav>
    </header>
  );
}
