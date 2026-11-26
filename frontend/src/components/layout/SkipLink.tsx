import React from 'react';

export const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-brand focus:text-white focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
  >
    Skip to main content
  </a>
);
