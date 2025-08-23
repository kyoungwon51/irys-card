'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';

export default function Home() {
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #50fed6 0%, #3dd5c0 25%, #2bbfaa 50%, #1aa994 75%, #0d9488 100%)'
    }}>
      <div className="container mx-auto px-4 py-8">
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
