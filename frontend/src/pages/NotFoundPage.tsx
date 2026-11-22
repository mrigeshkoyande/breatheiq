import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col items-center justify-center p-6 text-center">
      <img src="/logo-mark.webp" alt="Logo" className="w-16 h-16 rounded-2xl mb-6 shadow-sm" />
      <h1 className="font-heading font-extrabold text-5xl text-[#182A29]">404</h1>
      <h2 className="font-heading font-bold text-xl text-[#0F766E] mt-2">Atmospheric Zone Uncharted</h2>
      <p className="text-sm text-[#64748B] max-w-sm mt-2 mb-6">
        The route or telemetry coordinate you requested does not exist in our active station registry.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Clean Sanctuary</Button>
      </Link>
    </div>
  );
};
