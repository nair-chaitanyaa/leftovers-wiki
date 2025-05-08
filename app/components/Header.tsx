import React from 'react';
import { FaTwitter, FaLinkedin, FaRegNewspaper, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaPen } from 'react-icons/fa6';
import Image from 'next/image';

// Placeholder images (add your own in /public and update the src)
const logoSrc = '/logo.png'; // Updated to use your new logo
const userImgSrc = '/vercel.svg'; // Replace with your picture later

export default function Header() {
  return (
    <header className="w-full relative flex flex-col items-center justify-center px-6 py-5 bg-white">
      <div className="w-full flex items-center justify-center relative">
        {/* Logo */}
        <div className="absolute left-0 flex items-center gap-2">
          <a href="https://leftovers.wiki" target="_blank" rel="noopener noreferrer" aria-label="Website">
            <Image src={logoSrc} alt="Logo" width={120} height={120} className="rounded-full" />
          </a>
        </div>
        {/* Title and Subtitle */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: '#388E3C' }}>leftovers.wiki</span>
          <span className="text-base mt-1" style={{ color: '#388E3C' }}>Enter your leftover food and discover what you can make</span>
        </div>
      </div>
    </header>
  );
} 