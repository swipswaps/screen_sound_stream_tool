
import React from 'react';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 5.447A.5.5 0 0014 5.5v9a.5.5 0 00.553.447l3-1.5a.5.5 0 000-.894l-3-1.5z" />
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="text-center">
        <div className="flex items-center justify-center gap-3">
            <CameraIcon />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-100">Screen & Sound Recorder</h1>
        </div>
      <p className="mt-3 text-lg text-gray-400">
        Record your screen and microphone with ease, right from your browser.
      </p>
    </header>
  );
};

export default Header;
