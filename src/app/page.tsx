'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="container mx-auto px-4 py-2">
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
