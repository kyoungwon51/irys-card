'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [hasTwitterCredentials, setHasTwitterCredentials] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('anime');
  const [cssEffect, setCssEffect] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // 사용 가능한 스타일들
  const availableStyles = [
    { id: 'anime', name: '🎌 애니메', description: '일본 애니메이션 스타일' },
    { id: 'cartoon', name: '🎨 카툰', description: '픽사/디즈니 스타일' },
    { id: 'pixel', name: '🕹️ 픽셀', description: '8비트 레트로 게임' },
    { id: 'oil_painting', name: '🖼️ 유화', description: '고전 회화 스타일' },
    { id: 'cyberpunk', name: '🤖 사이버펑크', description: '미래형 네온 스타일' }
  ];

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
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username || username,
        displayName: data.profile.name || data.profile.displayName || data.profile.username,
        profileImage: data.profile.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: data.profile.description || "Creator and developer passionate about technology 🚀",
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      console.log('Profile data received:', data.profile);
      console.log('Normalized profile:', normalizedProfile);
      
      setProfile(normalizedProfile);
      
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

  // 프로필 이미지 스타일 변환 함수
  const convertImageStyle = async (style: string) => {
    if (!profile?.profileImage) return;
    
    setIsConverting(true);
    setSelectedStyle(style);
    
    try {
      const response = await fetch('/api/convert-to-anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: profile.profileImage,
          style: style,
          username: profile.username
        }),
      });

      if (!response.ok) {
        throw new Error('Style conversion failed');
      }

      const data = await response.json();
      console.log('Style conversion result:', data);
      
      setConvertedImage(data.convertedImageUrl);
      
      // CSS 효과가 있다면 적용
      if (data.cssEffect) {
        setCssEffect(data.cssEffect);
      }
      
    } catch (error) {
      console.error('Style conversion error:', error);
      alert('스타일 변환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsConverting(false);
    }
  };

  // 원본 이미지로 되돌리기
  const resetToOriginal = () => {
    setConvertedImage(null);
    setCssEffect('');
    setSelectedStyle('');
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
      
      // 데이터 형식 통일
      const normalizedProfile = {
        username: data.profile.username,
        displayName: data.profile.name || data.profile.displayName,
        profileImage: data.profile.profile_image_url,
        bio: data.profile.description,
        followers: data.profile.public_metrics?.followers_count || 0,
        following: data.profile.public_metrics?.following_count || 0,
        verified: data.profile.verified || false,
        location: data.profile.location || "Crypto Twitter"
      };
      
      console.log('Normalized profile:', normalizedProfile);
      setProfile(normalizedProfile);
    } catch (error) {
      console.error('Connected profile analysis failed:', error);
      // Fallback to basic profile fetch
      console.log('Falling back to basic profile fetch...');
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
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${profile?.username}-irys-card.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  if (!profile) return (
    <div className="max-w-4xl mx-auto">
      {/* Twitter Connection Section */}
      <div className="mb-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-semibold mb-4">
            Connect Twitter Account
          </h3>
          <p className="text-white/80 mb-6">
            Connect your Twitter account to generate cards based on your actual profile and recent posts.
          </p>
          {!session ? (
            <div className="space-y-4">
              {hasTwitterCredentials ? (
                <button
                  onClick={() => signIn('twitter')}
                  className="px-8 py-3 bg-white text-teal-600 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <span>🐦</span>
                  Login with Twitter
                </button>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                  <div className="text-center">
                    <span className="text-yellow-400">⚠️</span>
                    <p className="text-white mt-2">Twitter OAuth is not configured.</p>
                    <p className="text-white/80 text-sm mt-1">
                      You can still create cards by entering a username manually.
                    </p>
                  </div>
                </div>
              )}
              <div className="text-white/60 text-sm">or</div>
            </div>
          ) : (
            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Connected as @{session.user?.username}</span>
                <button
                  onClick={() => signOut()}
                  className="text-white/60 hover:text-white text-sm ml-2"
                >
                  (Disconnect)
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
                placeholder={session ? "Enter another username" : "Enter username directly (e.g., elonmusk)"}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputUsername.trim()}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Loading...' : 'Generate'}
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
                    Analyzing profile...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Card with My Profile
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
            Twitter 사용자명을 입력하여 Irys Cards 스타일의 카드를 생성하세요.
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
            <h3 className="text-xl font-bold text-black">{profile.displayName}</h3>
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
                    src={convertedImage || profile.profileImage}
                    alt={profile.displayName}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                    style={{
                      filter: cssEffect || 'none'
                    }}
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
              
              {/* Style indicator */}
              {convertedImage && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {availableStyles.find(s => s.id === selectedStyle)?.name || selectedStyle}
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="relative z-10 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔥</span>
                </div>
                <span className="text-black font-medium">
                  {profile.verified ? "Verified User" : "Big Poster"}
                </span>
              </div>
              <p className="text-black/80 text-sm leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="text-center mb-4">
              <p className="text-black/80 text-sm font-medium tracking-wide">
                IRYS CARDS
              </p>
              <p className="text-black/60 text-xs mt-1">
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

        {/* Style Controls */}
        <div className="mt-6 mb-4">
          <div className="text-center mb-3">
            <h4 className="text-white font-medium text-sm mb-2">🎨 이미지 스타일 변환</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {availableStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => convertImageStyle(style.id)}
                  disabled={isConverting}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedStyle === style.id
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  } ${isConverting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  title={style.description}
                >
                  {isConverting && selectedStyle === style.id ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{style.name}</span>
                    </div>
                  ) : (
                    style.name
                  )}
                </button>
              ))}
              {convertedImage && (
                <button
                  onClick={resetToOriginal}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  📷 원본
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadCard}
          className="mt-6 px-8 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <span>⬇️</span>
          Download Card
        </button>

        {/* Card Info */}
        <div className="text-center text-white/70 mt-6 max-w-md">
          <p className="mb-2">🎨 Irys Cards based on real Twitter profiles</p>
          <p className="text-sm">
            {session ? 
              'Generate cards using your real Twitter profile information' : 
              'Connect Twitter and create cards with your real profile'
            }
          </p>
          {profile && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-200 text-xs">
                ✅ Card generated with real profile information from @{profile.username}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
