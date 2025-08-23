'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
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

// 20개의 스프라이트 설명
const spriteDescriptions = [
  { name: "Brave Sprite", description: "Fearless spirit, always charging forward" },
  { name: "Curious Sprite", description: "Explorer of mysteries, seeker of hidden truths" },
  { name: "Playful Sprite", description: "Brings fun and laughter wherever they go" },
  { name: "Loyal Sprite", description: "A true companion who never leaves your side" },
  { name: "Shy Sprite", description: "Quiet presence, gentle soul in the background" },
  { name: "Energetic Sprite", description: "A spark of endless motion and excitement" },
  { name: "Gentle Sprite", description: "Soft heart, always careful and kind" },
  { name: "Clever Sprite", description: "Quick mind, puzzle-solver, sharp thinker" },
  { name: "Cheerful Sprite", description: "Sunshine in sprite form, always smiling" },
  { name: "Serious Sprite", description: "Focused, disciplined, and steady-minded" },
  { name: "Mischievous Sprite", description: "Trickster spirit with a playful grin" },
  { name: "Caring Sprite", description: "A sprite that heals with kindness" },
  { name: "Bold Sprite", description: "Dares to leap where others hesitate" },
  { name: "Patient Sprite", description: "Calm watcher of time, steady as stone" },
  { name: "Adventurous Sprite", description: "Restless wanderer, always chasing horizons" },
  { name: "Calm Sprite", description: "Brings peace like still water in chaos" },
  { name: "Proud Sprite", description: "Holds dignity high, shining with confidence" },
  { name: "Helpful Sprite", description: "A guiding hand when times get hard" },
  { name: "Independent Sprite", description: "Walks their own path, strong and free" },
  { name: "Friendly Sprite", description: "Open arms, warm smile, endless connections" }
];

// 사용자 아이디 기반 스프라이트 설명 선택 함수
const getSpriteDescriptionByUsername = (username: string) => {
  if (!username || username.length < 2) {
    return spriteDescriptions[0]; // 기본값
  }
  
  // 첫 번째와 두 번째 문자의 유니코드 값 계산
  const firstCharCode = username.charCodeAt(0);
  const secondCharCode = username.charCodeAt(1);
  
  // (첫번째문자 유니코드 + 두번째문자 유니코드) % 20
  const index = (firstCharCode + secondCharCode) % 20;
  
  return spriteDescriptions[index];
};

// 초기 랜덤 스프라이트 (프로필이 없을 때만 사용)
const getRandomSpriteDescription = () => {
  return spriteDescriptions[Math.floor(Math.random() * spriteDescriptions.length)];
};

export default function TwitterCardGenerator() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [hasTwitterCredentials, setHasTwitterCredentials] = useState(false);
  const [currentSprite, setCurrentSprite] = useState(getRandomSpriteDescription());
  
  // 마우스 움직임 효과를 위한 state
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);

  // 마우스 움직임에 따른 카드 틸트 효과
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // 회전 강도 조절 (값이 클수록 더 많이 기울어짐)
    const rotateX = (mouseY / (rect.height / 2)) * -10;
    const rotateY = (mouseX / (rect.width / 2)) * 10;
    
    setCardRotation({ x: rotateX, y: rotateY });
  };
  
  const handleMouseLeave = () => {
    setCardRotation({ x: 0, y: 0 });
  };

  // OAuth 상태 확인
  useEffect(() => {
    const checkOAuthStatus = async () => {
      try {
        const response = await fetch('/api/oauth-status');
        const data = await response.json();
        setHasTwitterCredentials(data.hasTwitterCredentials);
      } catch (error) {
        console.error('Failed to check OAuth status:', error);
        setHasTwitterCredentials(false);
      }
    };
    
    checkOAuthStatus();
  }, []);

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
      console.log('API Response:', data); // 디버깅용
      console.log('Profile from API:', data.profile);
      console.log('ProfileImage field:', data.profile?.profileImage);
      console.log('Profile_image_url field:', data.profile?.profile_image_url);
      
      // 이미지 URL을 고해상도로 변환하는 함수
      const getHighQualityImageUrl = (imageUrl: string) => {
        if (!imageUrl) return imageUrl;
        // Twitter 이미지 URL에서 _normal을 _400x400으로 변경하여 고해상도 이미지 가져오기
        return imageUrl.replace('_normal', '_400x400');
      };
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username || username,
        displayName: data.profile.name || data.profile.displayName || data.profile.username,
        profileImage: getHighQualityImageUrl(data.profile.profileImage || data.profile.profile_image_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=50fed6`,
        bio: data.profile.description || "Creator and developer passionate about technology 🚀",
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      console.log('Profile data received:', data.profile);
      console.log('Normalized profile:', normalizedProfile);
      
      setProfile(normalizedProfile);
      setCurrentSprite(getSpriteDescriptionByUsername(normalizedProfile.username)); // 아이디 기반 스프라이트 선택
      
      if (data.message) {
        console.log(data.message);
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      alert('Failed to fetch profile. Please check the username.');
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
    if (!session?.user?.username) {
      console.log('No session or username found:', session);
      return;
    }
    
    console.log('Session data:', session);
    
    setIsLoading(true);
    try {
      console.log('Calling analyze-connected-profile API...');
      const response = await fetch('/api/analyze-connected-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to analyze connected profile');
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      console.log('Connected Profile from API:', data.profile);
      console.log('Connected ProfileImage field:', data.profile?.profileImage);
      console.log('Connected Profile_image_url field:', data.profile?.profile_image_url);
      
      // 이미지 URL을 고해상도로 변환하는 함수
      const getHighQualityImageUrl = (imageUrl: string) => {
        if (!imageUrl) return imageUrl;
        // Twitter 이미지 URL에서 _normal을 _400x400으로 변경하여 고해상도 이미지 가져오기
        return imageUrl.replace('_normal', '_400x400');
      };
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username,
        displayName: data.profile.name || data.profile.displayName,
        profileImage: getHighQualityImageUrl(data.profile.profileImage || data.profile.profile_image_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.profile.username}&backgroundColor=50fed6`,
        bio: data.profile.description,
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      console.log('Normalized profile:', normalizedProfile);
      setProfile(normalizedProfile);
      setCurrentSprite(getSpriteDescriptionByUsername(normalizedProfile.username)); // 아이디 기반 스프라이트 선택
    } catch (error) {
      console.error('Connected profile analysis failed:', error);
      // Fallback to basic profile fetch
      console.log('Falling back to basic profile fetch...');
      await fetchTwitterProfile(session.user.username);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return (
    <div className="max-w-4xl mx-auto">
      {/* Twitter Connection Section - 연결되지 않았을 때만 표시 */}
      {!session && (
        <div className="mb-8 text-center">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 border border-emerald-200/30 shadow-2xl">
            <h3 className="text-black text-2xl font-bold mb-4">
              Connect X Account
            </h3>
            <p className="text-black/80 mb-8 text-lg">
              Connect your X account to generate your IRYS card
            </p>
            <div className="space-y-4">
              {hasTwitterCredentials ? (
                <button
                  onClick={() => signIn('twitter')}
                  className="px-10 py-4 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-3 mx-auto shadow-lg"
                >
                  <span>𝕏</span>
                  Connect X Account
                </button>
              ) : (
                <div className="bg-amber-100 border border-amber-200 rounded-xl p-6">
                  <div className="text-center">
                    <span className="text-amber-600 text-2xl">⚠️</span>
                    <p className="text-amber-800 mt-2">Twitter OAuth is not configured.</p>
                    <p className="text-amber-700 text-sm mt-1">
                      You can still create cards by entering a username manually.
                    </p>
                  </div>
                </div>
              )}
              <div className="text-black/60 text-sm">or</div>
              
              <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="Enter username directly (e.g., elonmusk)"
                  className="flex-1 px-4 py-2 bg-white/50 border border-emerald-200 rounded-lg text-black placeholder-black/50 focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputUsername.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Generate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 연결된 사용자의 경우 간단한 입력 폼만 표시 */}
      {session && (
        <div className="mb-8 text-center">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-200/30 shadow-2xl">
            <div className="bg-emerald-100 border border-emerald-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-emerald-600">✅</span>
                <span className="text-emerald-800">Connected as @{session.user?.username}</span>
                <button
                  onClick={() => signOut()}
                  className="text-emerald-600 hover:text-emerald-800 text-sm ml-2"
                >
                  (Disconnect)
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="Enter another username"
                  className="flex-1 px-4 py-2 bg-white/50 border border-emerald-200 rounded-lg text-black placeholder-black/50 focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputUsername.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Generate'}
                </button>
              </form>
              
              <button
                onClick={handleConnectedUserProfile}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    Analyzing profile...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Card with My Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* IRYS Logo */}
      <div className="text-center mb-6">
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
      
      {/* Card Preview */}
      <div className="flex flex-col items-center">
        <div 
          ref={cardRef}
          className="w-80 h-[500px] bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border-2 border-emerald-200/50 hover:border-emerald-300/70 transition-all duration-300 hover:shadow-emerald-200/50"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.1s ease-out',
            background: 'white',
            boxShadow: `0 ${25 + Math.abs(cardRotation.x) * 2}px ${50 + Math.abs(cardRotation.y) * 2}px -12px rgba(0, 0, 0, ${0.25 + Math.abs(cardRotation.x + cardRotation.y) * 0.01}), 0 0 0 1px rgba(255, 255, 255, 0.1)`
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
            <h3 className="text-xl font-bold text-black">{profile.displayName}</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200/50">
              <span className="text-white text-lg">✨</span>
            </div>
          </div>

          {/* Profile Image */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="relative">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-emerald-200/50 bg-gradient-to-br from-emerald-400 to-emerald-600 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                  <Image
                    src={profile.profileImage}
                    alt={profile.displayName}
                    width={256}
                    height={256}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={(e) => {
                      console.log('Image loading error:', profile.profileImage);
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}&backgroundColor=50fed6`;
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', profile.profileImage);
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
            <div className="bg-emerald-50/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50">
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔥</span>
                </div>
                <div className="text-center">
                  {profile.verified ? (
                    <span className="text-black font-medium">Verified User</span>
                  ) : (
                    <div>
                      <div className="text-black font-bold text-lg mb-1">
                        {currentSprite.name}
                      </div>
                      <div className="text-black/70 text-sm">
                        {currentSprite.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 애니메이션 점들 */}

          {/* Decorative sparkles */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-300/40 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-emerald-200/30 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-8 w-1.5 h-1.5 bg-emerald-300/35 rounded-full animate-pulse delay-150"></div>
          <div className="absolute top-1/3 left-4 w-1 h-1 bg-purple-300/40 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-2/3 right-6 w-1 h-1 bg-blue-300/40 rounded-full animate-pulse delay-700"></div>
        </div>
      </div>
    </div>
  );
}
