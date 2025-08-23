'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400">
      <div className="container mx-auto px-4 py-8">
        {/* IRYS Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 bg-gradient-to-br from-emerald-300 to-teal-500 rounded-3xl shadow-2xl flex items-center justify-center">
              <span className="text-6xl font-bold text-black tracking-wider transform -skew-x-12">
                IRYS
              </span>
            </div>
          </div>
        </div>
        
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
