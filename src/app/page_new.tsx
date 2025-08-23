'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400">
      <div className="container mx-auto px-4 py-8">
        {/* IRYS Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Image 
              src="/irys-logo.svg" 
              alt="IRYS" 
              width={200}
              height={50}
              className="w-48 h-auto"
            />
          </div>
        </div>
        
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
