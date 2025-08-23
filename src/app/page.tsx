'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#50fed6' }}>
      <div className="container mx-auto px-4 py-0">
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
