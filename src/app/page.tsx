'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';

export default function Home() {
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #50fed6 0%, #3dd5c0 25%, #2bbfaa 50%, #1aa994 75%, #0d9488 100%)'
    }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            IRYS CARDS
          </h1>
          <p className="text-lg text-white/90 mb-2">
            &ldquo;A token of appreciation for Crypto Twitter&rdquo;
          </p>
          <p className="text-sm text-white/80">
            Create your personalized Twitter card in Irys Cards style
          </p>
        </div>
        
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
