'use client';

import TwitterCardGenerator from '@/components/TwitterCardGenerator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            MONAD CARDS
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            &ldquo;A token of appreciation for Crypto Twitter&rdquo;
          </p>
          <p className="text-sm text-gray-400">
            Monad Cards 스타일의 트위터 카드를 미리 확인해보세요
          </p>
        </div>
        
        <TwitterCardGenerator />
      </div>
    </div>
  );
}
