import Link from 'next/link';
import Image from 'next/image';

// Footer - Site footer with links, contact info, and social media
const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 px-5 md:px-8 lg:px-16 xl:px-24 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4 md:gap-5 items-center md:items-start">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/logoFooter.webp" 
                alt="Saabri Group Logo" 
                width={60} 
                height={60}
                className="transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="font-sans text-sm md:text-base text-[#484848] leading-relaxed text-center md:text-left max-w-xs">
              Where vision meets Value
            </p>
          </div>

          {/* Navigation Section */}
          <div className="flex flex-col gap-4 md:gap-5 items-center md:items-start">
            <h3 className="font-sans text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
              Navigation
            </h3>
            <nav className="flex flex-col gap-3 md:gap-4 items-center md:items-start">
              <Link 
                href="/projects" 
                className="font-sans text-sm md:text-base text-[#484848] hover:text-gray-900 transition-colors duration-200 relative group"
              >
                <span className="relative">
                  Projects
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
              <Link 
                href="/about" 
                className="font-sans text-sm md:text-base text-[#484848] hover:text-gray-900 transition-colors duration-200 relative group"
              >
                <span className="relative">
                  About Us
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full"></span>
                </span>
              </Link>
            </nav>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col gap-4 md:gap-5 items-center md:items-start">
            <h3 className="font-sans text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
              Contact
            </h3>
            <div className="flex flex-col gap-3 md:gap-4 font-sans text-sm md:text-base text-[#484848] leading-relaxed text-center md:text-left">
              <a 
                href="tel:+971525664490" 
                className="hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 group"
              >
                <svg 
                  className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+971 525664490</span>
              </a>
              <a 
                href="mailto:Info@saabriazizproperties.com" 
                className="hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 group break-all"
              >
                <svg 
                  className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Info@saabriazizproperties.com</span>
              </a>
            </div>
          </div>

          {/* Location Section */}
          <div className="flex flex-col gap-4 md:gap-5 items-center md:items-start">
            <h3 className="font-sans text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
              Location
            </h3>
            <a 
              href="https://maps.app.goo.gl/c9M737XNMtP5zACK7?g_st=ipc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-start gap-3 text-[#484848] hover:text-gray-900 transition-colors duration-200"
            >
              <svg 
                className="w-5 h-5 text-gray-900 group-hover:text-black transition-colors flex-shrink-0 mt-0.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <p className="font-sans text-sm md:text-base leading-relaxed text-center md:text-left group-hover:underline">
                Office No. 1706, Executive Bay Tower, Business Bay, Dubai
              </p>
            </a>
          </div>
        </div>

        {/* Bottom Section - Social Media and Copyright */}
        {/* <div className="border-t border-[#E5E5E5] pt-8 md:pt-10">
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-6 md:gap-8">
            <div className="flex gap-4 md:gap-5">
              <a href="#" className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
                <Image src="/okru.svg" alt="OK.ru" width={13} height={13} />
              </a>
              <a href="#" className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
                <Image src="/vk.svg" alt="VK" width={18} height={18} />
              </a>
              <a href="#" className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
                <Image src="/facebook.svg" alt="Facebook" width={18} height={18} />
              </a>
              <a href="#" className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
                <Image src="/telegram.svg" alt="Telegram" width={18} height={18} />
              </a>
              <a href="#" className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
                <Image src="/instagram.svg" alt="Instagram" width={18} height={18} />
              </a>
            </div>
            
            <div className="font-sans text-xs md:text-sm text-[#484848] leading-normal text-center md:text-left">
              <p>© {new Date().getFullYear()} — Copyright</p>
              <p>All Rights reserved</p>
            </div>
          </div>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
