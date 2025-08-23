'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface TwitterProfile {
  username: string;
  displayName: string;
  profileImage: string;
  bio: string;
  followers: number;
  following: number;
}

export default function TwitterCardGenerator() {
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 기본 카드 표시
  useEffect(() => {
    setProfile({
      username: 'Zeck',
      displayName: 'Zeck',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zeck&accessories=eyepatch&accessoriesColor=262e33&clothingGraphic=diamond&eyes=surprised&eyebrows=raisedExcited&facialHair=moustacheMagnum&facialHairColor=2c1b18&hairColor=2c1b18&hatColor=3c4f5c&mouth=twinkle&skinColor=light&top=hat',
      bio: "Big Poster. Active on X. Can be smart, funny, chaotic or loud. Mastery in the art of shitposting.",
      followers: 8542,
      following: 432
    });
  }, []);

  const downloadCard = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${profile?.username}-monad-card.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Card Preview */}
      <div className="flex flex-col items-center">
        <div 
          ref={cardRef}
          className="w-80 h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #312e81 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
            <div className="absolute top-20 right-8 w-16 h-16 border border-white/15 rounded-full"></div>
            <div className="absolute bottom-20 left-6 w-12 h-12 border border-white/10 rounded-full"></div>
            <div className="absolute bottom-32 right-12 w-8 h-8 border border-white/20 rounded-full"></div>
          </div>

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{profile.displayName}</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-white text-lg">✨</span>
            </div>
          </div>

          {/* Profile Image */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 bg-gradient-to-br from-purple-400 to-blue-600 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                  <Image
                    src={profile.profileImage}
                    alt={profile.displayName}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-4 h-4 text-yellow-300">✨</div>
              <div className="absolute -bottom-1 -left-2 w-3 h-3 text-blue-300">💫</div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="relative z-10 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔥</span>
                </div>
                <span className="text-white font-medium">Big Poster</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="text-center mb-4">
              <p className="text-white/80 text-sm font-medium tracking-wide">
                MONAD CARDS
              </p>
              <p className="text-white/60 text-xs mt-1">
                "A token of appreciation for Crypto Twitter"
              </p>
            </div>
            <div className="flex justify-center">
              <div className="bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <span>Signed in as</span>
                  <span className="text-purple-300">{profile.username}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Decorative sparkles */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-8 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-150"></div>
          <div className="absolute top-1/3 left-4 w-1 h-1 bg-purple-300/40 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-2/3 right-6 w-1 h-1 bg-blue-300/40 rounded-full animate-pulse delay-700"></div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadCard}
          className="mt-6 px-8 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <span>⬇️</span>
          카드 다운로드
        </button>

        {/* Card Info */}
        <div className="text-center text-white/70 mt-6 max-w-md">
          <p className="mb-2">🎨 Monad Cards 스타일의 트위터 카드</p>
          <p className="text-sm">나중에 실제 트위터 연결 기능이 추가될 예정입니다</p>
        </div>
      </div>
    </div>
  );
}
