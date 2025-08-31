import React from 'react';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight via-sapphire to-amethyst px-2 sm:px-4">
      <div className="w-full max-w-2xl bg-midnight bg-opacity-90 rounded-3xl shadow-lg p-6 sm:p-10">
        {children}
      </div>
    </div>
  );
}