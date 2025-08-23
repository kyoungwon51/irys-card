'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #50fed6 0%, #3dd5c0 25%, #2bbfaa 50%, #1aa994 75%, #0d9488 100%)'
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* IRYS Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Image 
              src="/iryslogo.png" 
              alt="IRYS" 
              width={300}
              height={75}
              className="w-72 h-auto"
            />
          </div>
        </div>
        
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
