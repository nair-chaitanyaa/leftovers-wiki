import React from 'react';
import { FaLinkedin, FaGlobe } from 'react-icons/fa';
import { FaXTwitter, FaPen } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="w-full flex flex-col sm:flex-row items-center justify-between py-6 bg-white border-t mt-8 px-4 sm:px-6 gap-4 sm:gap-0 text-center sm:text-left">
      <div className="text-gray-700 text-sm">
        Built by Chaitanyaa Nair. {' '}
        <a
          href="https://chaiaurcharcha.substack.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[#388E3C] hover:text-[#256029]"
        >
          Read here
        </a>{' '}if you want to know how I build this.
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-8">
        <a href="https://x.com/ChaitanyaaNair" target="_blank" rel="noopener noreferrer" aria-label="X">
          <FaXTwitter className="text-3xl" style={{ color: '#388E3C' }} />
        </a>
        <a href="https://www.linkedin.com/in/chaitanyaa-nair/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <FaLinkedin className="text-3xl" style={{ color: '#388E3C' }} />
        </a>
        <a href="https://chaiaurcharcha.substack.com/" target="_blank" rel="noopener noreferrer" aria-label="Substack">
          <FaPen className="text-3xl" style={{ color: '#388E3C' }} />
        </a>
        <a href="https://humdrum-olivine-678.notion.site/Hello-I-am-Chaitanyaa-1297922fb64880b98fa2d10bf679314a" target="_blank" rel="noopener noreferrer" aria-label="Website">
          <FaGlobe className="text-3xl" style={{ color: '#388E3C' }} />
        </a>
      </div>
    </footer>
  );
} 