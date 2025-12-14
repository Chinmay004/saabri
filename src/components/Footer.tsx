import Link from 'next/link';
import Image from 'next/image';

// Footer - Site footer with links, contact info, and social media
const Footer = () => {
  return (
    <footer className="bg-white px-5 md:px-8 lg:px-16 xl:px-30 py-10 md:py-12 lg:py-14 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-32 xl:gap-40 justify-between items-start h-full">
        {/* Left Section */}
        <div className="flex flex-col justify-between h-full gap-6 md:gap-8 lg:gap-32 xl:gap-48">
          {/* Top - Description and Learn More */}
          
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center">
                <Image src="/logo.webp" alt="Saabri Group Logo" width={120} height={120} />
            </Link>
            <div className="flex flex-col gap-3 md:gap-4">
              <p className="font-sans text-sm md:text-base text-[#484848] leading-[1.4] w-full lg:w-[380px] xl:w-[420px]">
              Where vision meets Value
              </p>
              <div className="hidden lg:flex gap-3 items-center">
                <p className="text-xs text-white font-semibold">More about us</p>
                <div className="w-2.5 h-2.5 bg-white rounded-[10px]"></div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Social Media and Copyright - Desktop */}
          <div className="hidden lg:flex justify-between items-end w-full">
            {/* Social Media Icons */}
            <div className="flex gap-2.5">
              <div className="flex flex-col gap-2.5">
                <a href="#" className="w-6 h-6 flex items-center justify-center">
                  <Image src="/okru.svg" alt="OK.ru" width={18} height={18} />
                </a>
                <a href="#" className="w-6 h-6 flex items-center justify-center">
                  <Image src="/vk.svg" alt="VK" width={18} height={18} />
                </a>
                <a href="#" className="w-6 h-6 flex items-center justify-center">
                  <Image src="/telegram.svg" alt="Telegram" width={18} height={18} />
                </a>
              </div>
              <div className="flex flex-col justify-end gap-2.5">
                <a href="#" className="w-6 h-6 flex items-center justify-center">
                  <Image src="/facebook.svg" alt="Facebook" width={18} height={18} />
                </a>
                <a href="#" className="w-6 h-6 flex items-center justify-center">
                  <Image src="/instagram.svg" alt="Instagram" width={18} height={18} />
                </a>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="font-sans text-xs text-[#484848] leading-[1.4]">
              <p>© {new Date().getFullYear()} — Copyright</p>
              <p>All Rights reserved</p>
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex flex-col justify-between h-full gap-10 md:gap-12 lg:gap-0">
          {/* Top - Navigation Links */}
          <nav className="flex flex-row gap-8 md:gap-10 text-sm md:text-base text-[#484848] font-sans">
            <a href="/projects" className="hover:text-black transition-colors">Projects.</a>
            <a href="/about" className="hover:text-black transition-colors">About Us.</a>
          </nav>
          
          {/* Bottom - Contact and Location */}
          <div className="flex flex-col gap-6 md:gap-7 lg:gap-12 xl:gap-16">
            {/* Contact Us */}
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col font-sans text-sm md:text-sm text-[#484848] leading-[1.6]">
                <p>+91 0525664490</p>
                <p>Info@saabriazizproperties.com</p>
              </div>
            </div>
            
            {/* Location */}
            <div className="flex flex-col gap-3 md:gap-4">
              <p className="font-sans text-sm text-[#484848] leading-[1.6] w-full lg:w-[280px] xl:w-[300px]">
                Business bay, Dubai, UAE
              </p>
            </div>
          </div>
        </div>

        {/* Mobile - Social Media and Copyright */}
        <div className="flex lg:hidden justify-between items-end w-full">
          {/* Social Media Icons */}
          <div className="flex flex-col gap-4 md:gap-5 items-center lg:items-start">
            <div className="flex gap-4 md:gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/okru.svg" alt="OK.ru" width={12} height={18} />
              </a>
            </div>
            <div className="flex gap-4 md:gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/vk.svg" alt="VK" width={18} height={11} />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/facebook.svg" alt="Facebook" width={16} height={16} />
              </a>
            </div>
            <div className="flex gap-4 md:gap-5">
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/telegram.svg" alt="Telegram" width={17} height={14} />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity">
                <Image src="/instagram.svg" alt="Instagram" width={16} height={16} />
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="font-sans text-xs text-[#484848] leading-[1.4]">
            <p>© 2021 — Copyright</p>
            <p>All Rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
