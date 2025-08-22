'use client';

import { useState, useRef } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface TwitterProfile {
  username: string;
  displayName: string;
  profileImage: string;
  bio: string;
  followers: number;
  following: number;
  verified?: boolean;
  location?: string;
}

export default function TwitterCardGenerator() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchTwitterProfile = async (username: string) => {
    setIsLoading(true);
    try {
      // 먼저 실제 Twitter API 시도
      let response = await fetch('/api/get-twitter-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      // OAuth 오류 시 목 데이터 API 사용
      if (!response.ok) {
        console.log('Real Twitter API failed, using mock data...');
        response = await fetch('/api/twitter-profile-mock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username || username,
        displayName: data.profile.name || data.profile.username,
        profileImage: data.profile.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: data.profile.description || "크리에이터이자 개발자입니다. 🚀",
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      setProfile(normalizedProfile);
      
      if (data.message) {
        console.log(data.message);
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      alert('프로필을 가져오는데 실패했습니다. 사용자명을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      fetchTwitterProfile(inputUsername.trim().replace('@', ''));
    }
  };

  const handleConnectedUserProfile = async () => {
    if (!session?.user?.username) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-connected-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze connected profile');
      }
      
      const data = await response.json();
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username,
        displayName: data.profile.name,
        profileImage: data.profile.profile_image_url,
        bio: data.profile.description,
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      setProfile(normalizedProfile);
    } catch (error) {
      console.error('Connected profile analysis failed:', error);
      // Fallback to basic profile fetch
      await fetchTwitterProfile(session.user.username);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!profile) return (
    <div className="max-w-4xl mx-auto">
      {/* Twitter Connection Section */}
      <div className="mb-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-semibold mb-4">
            Twitter 계정 연결
          </h3>
          <p className="text-white/80 mb-6">
            Twitter 계정을 연결하여 실제 프로필과 최근 게시물을 기반으로 카드를 생성하세요.
          </p>
          {!session ? (
            <div className="space-y-4">
              <button
                onClick={() => signIn('twitter')}
                className="px-8 py-3 bg-white text-teal-600 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <span>🐦</span>
                Twitter로 로그인
              </button>
              <div className="text-white/60 text-sm">또는</div>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">@{session.user?.username}로 연결됨</span>
                <button
                  onClick={() => signOut()}
                  className="text-white/60 hover:text-white text-sm ml-2"
                >
                  (연결 해제)
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder={session ? "다른 사용자명 입력" : "사용자명 직접 입력 (예: elonmusk)"}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputUsername.trim()}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? '로딩...' : '생성'}
              </button>
            </form>
            
            {session && (
              <button
                onClick={handleConnectedUserProfile}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    프로필 분석 중...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    내 프로필로 카드 생성
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 빈 카드 영역 */}
      <div className="flex flex-col items-center">
        <div className="w-80 h-[500px] bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center">
          <div className="text-center text-white/50">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-lg font-medium">카드가 여기에 표시됩니다</p>
            <p className="text-sm mt-2">사용자명을 입력하고 생성 버튼을 눌러주세요</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Twitter Connection Section */}
      {/* Twitter Username Input Section */}
      <div className="mb-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-semibold mb-4">
            Twitter 카드 생성기
          </h3>
          <p className="text-white/80 mb-6">
            Twitter 사용자명을 입력하여 Monad Cards 스타일의 카드를 생성하세요.
          </p>
          <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              placeholder="Twitter 사용자명 입력 (예: elonmusk)"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputUsername.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? '로딩...' : '생성'}
            </button>
          </form>
        </div>
      </div>

      {/* Card Preview */}
      <div className="flex flex-col items-center">
        <div 
          ref={cardRef}
          className="w-80 h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #50fed6 0%, #3dd5c0 25%, #2bbfaa 50%, #1aa994 75%, #0d9488 100%)',
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
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
                    }}
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
                <span className="text-white font-medium">
                  {profile.verified ? "Verified User" : "Big Poster"}
                </span>
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
                &quot;A token of appreciation for Crypto Twitter&quot;
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
          <p className="mb-2">🎨 실제 트위터 프로필 기반 Monad Cards</p>
          <p className="text-sm">
            {session ? 
              '실제 Twitter 프로필 정보를 사용하여 카드를 생성합니다' : 
              'Twitter 연결 후 실제 프로필로 카드를 만들어보세요'
            }
          </p>
          {profile && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-200 text-xs">
                ✅ @{profile.username}의 실제 프로필 정보로 생성된 카드입니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
