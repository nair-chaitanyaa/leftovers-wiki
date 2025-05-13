import React from 'react';
import { FaTwitter, FaLinkedin, FaRegNewspaper, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaPen } from 'react-icons/fa6';
import Image from 'next/image';

// Placeholder images (add your own in /public and update the src)
const logoSrc = '/logo.png'; // Updated to use your new logo
const userImgSrc = '/vercel.svg'; // Replace with your picture later

export default function Header() {
  return (
    <header className="w-full bg-white px-4 py-4 sm:px-6 sm:py-5 flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-center relative">
        {/* Logo */}
        <div className="flex items-center justify-center sm:absolute sm:left-0 sm:justify-start gap-2 mb-2 sm:mb-0">
          <a href="https://leftovers.wiki" target="_blank" rel="noopener noreferrer" aria-label="Website">
            <Image src={logoSrc} alt="Logo" width={150} height={150} className="rounded-full w-16 h-16 sm:w-[120px] sm:h-[120px]" />
          </a>
        </div>
        {/* Title and Subtitle */}
        <div className="flex flex-col items-center justify-center w-full">
          <span className="text-4xl sm:text-5xl font-bold font-shadows-into-light" style={{ color: '#388E3C' }}>leftovers.wiki</span>
          <span className="text-xs sm:text-sm mt-1" style={{ color: '#388E3C' }}>Don't waste it. Remake it.</span>
        </div>
      </div>
    </header>
  );
} 