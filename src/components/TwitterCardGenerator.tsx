'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import html2canvas from 'html2canvas';

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

// 사용자명 기반 글씨체 선택 함수
const getFontStyleByUsername = (username: string) => {
  if (!username) return "font-sans";
  
  const firstChar = username.charCodeAt(0);
  const fontStyles = [
    "font-sans", // 기본 산세리프
    "font-serif", // 세리프 (우아한 느낌)
    "font-mono", // 모노스페이스 (개발자 느낌)
    "font-sans tracking-widest text-lg", // 넓은 자간 (모던)
    "font-serif italic", // 이탤릭 세리프 (예술적)
    "font-sans font-light tracking-wide", // 얇은 글꼴 (미니멀)
    "font-sans font-black tracking-tight", // 두꺼운 글꼴 (임팩트)
    "font-mono font-bold", // 굵은 모노스페이스 (테크)
    "font-serif font-semibold", // 세미볼드 세리프 (클래식)
    "font-sans uppercase tracking-wider text-sm", // 대문자 (강렬함)
  ];
  
  return fontStyles[firstChar % fontStyles.length];
};

// 사용자 아이디 기반 스프라이트 설명 선택 함수
const getSpriteDescriptionByUsername = (username: string) => {
  if (!username || username.length < 2) {
    return { sprite: spriteDescriptions[0], index: 0 }; // 기본값
  }
  
  // 첫 번째와 두 번째 문자의 유니코드 값 계산
  const firstCharCode = username.charCodeAt(0);
  const secondCharCode = username.charCodeAt(1);
  
  // (첫번째문자 유니코드 + 두번째문자 유니코드) % 20
  const index = (firstCharCode + secondCharCode) % 20;
  
  return { sprite: spriteDescriptions[index], index: index };
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
  const [currentSprite, setCurrentSprite] = useState(() => {
    const initial = getRandomSpriteDescription();
    return { sprite: initial, index: 0 };
  });
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isUserNumberLoading, setIsUserNumberLoading] = useState(false);
  const [userFontStyle, setUserFontStyle] = useState<string>("font-sans");
  const [nicknameFontSize, setNicknameFontSize] = useState<string>("text-xl");
  
  // 마우스/터치 움직임 효과를 위한 state
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // 홀로그램 효과를 위한 state
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [cardOpacity, setCardOpacity] = useState(0);
  const [pointerFromCenter, setPointerFromCenter] = useState(0);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLHeadingElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 닉네임 크기 조정 함수
  const adjustNicknameSize = () => {
    if (!nicknameRef.current) return;
    
    const element = nicknameRef.current;
    // 임시로 큰 크기로 설정하여 실제 높이 측정
    element.style.fontSize = '1.25rem'; // text-xl
    element.style.lineHeight = '1.75rem';
    
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    const height = element.scrollHeight;
    const lines = Math.round(height / lineHeight);
    
    if (lines > 2) {
      // 3줄 이상이면 작은 크기로 조정
      setNicknameFontSize("text-base");
    } else {
      setNicknameFontSize("text-xl");
    }
  };

  // 공통 위치 계산 함수
  const calculateRotation = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0, y: 0 };
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = clientX - centerX;
    const mouseY = clientY - centerY;
    
    // 부드러운 회전 계산
    const rotateX = Math.max(-10, Math.min(10, (mouseY * -5) / (rect.height / 2)));
    const rotateY = Math.max(-10, Math.min(10, (mouseX * 5) / (rect.width / 2)));
    
    return { x: rotateX, y: rotateY };
  };

  // 프로필이 변경될 때마다 닉네임 크기 조정
  useEffect(() => {
    if (profile?.displayName) {
      // DOM 업데이트 후 크기 조정을 위해 setTimeout 사용
      setTimeout(adjustNicknameSize, 0);
    }
  }, [profile?.displayName]);

  // 최적화된 마우스 움직임 핸들러 (홀로그램 효과 포함)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const rotation = calculateRotation(e.clientX, e.clientY);
      setCardRotation(rotation);
      
      // 홀로그램 효과를 위한 마우스 위치 계산
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // 중심점으로부터의 거리 계산
      const centerDistance = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2)) / 50;
      const clampedDistance = Math.min(centerDistance, 1);
      
      setMousePosition({ x, y });
      setCardOpacity(0.8);
      setPointerFromCenter(clampedDistance);
      setBackgroundPosition({ 
        x: 50 + (x - 50) * 0.5, 
        y: 50 + (y - 50) * 0.5 
      });
    });
  };

  // 터치 움직임 핸들러 (홀로그램 효과 포함)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // 스크롤 방지
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const touch = e.touches[0];
    if (touch) {
      animationFrameRef.current = requestAnimationFrame(() => {
        const rotation = calculateRotation(touch.clientX, touch.clientY);
        setCardRotation(rotation);
        
        // 홀로그램 효과를 위한 터치 위치 계산
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;
        
        // 중심점으로부터의 거리 계산
        const centerDistance = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2)) / 50;
        const clampedDistance = Math.min(centerDistance, 1);
        
        setMousePosition({ x, y });
        setCardOpacity(0.8);
        setPointerFromCenter(clampedDistance);
        setBackgroundPosition({ 
          x: 50 + (x - 50) * 0.5, 
          y: 50 + (y - 50) * 0.5 
        });
      });
    }
  };
  
  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 부드럽게 원위치로 복귀
    animationFrameRef.current = requestAnimationFrame(() => {
      setCardRotation({ x: 0, y: 0 });
      setMousePosition({ x: 50, y: 50 });
      setCardOpacity(0);
      setPointerFromCenter(0);
      setBackgroundPosition({ x: 50, y: 50 });
    });
  };

  // 터치 시작
  const handleTouchStart = () => {
    setIsHovering(true);
  };

  // 터치 종료 - 제자리 복귀
  const handleTouchEnd = () => {
    setIsHovering(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // 부드럽게 원위치로 복귀
    animationFrameRef.current = requestAnimationFrame(() => {
      setCardRotation({ x: 0, y: 0 });
      setMousePosition({ x: 50, y: 50 });
      setCardOpacity(0);
      setPointerFromCenter(0);
      setBackgroundPosition({ x: 50, y: 50 });
    });
  };

  // 사용자 번호 관리 함수들 - 데이터베이스 API 사용
  const getUserNumber = async (profile: TwitterProfile): Promise<number> => {
    try {
      console.log('=== getUserNumber called for:', profile.username, '===');
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profile.username,
          displayName: profile.displayName,
          profileImage: profile.profileImage,
          bio: profile.bio,
          followers: profile.followers,
          following: profile.following,
          verified: profile.verified,
          location: profile.location
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(data.isNewUser ? '🆕 New user registered!' : '✅ Existing user found');
        console.log('User number:', data.userNumber);
        return data.userNumber;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Error in getUserNumber:', error);
      // 에러 시 기본값 반환
      return 1;
    }
  };

  // 데이터베이스 통계 조회 함수
  const checkDatabaseStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        console.log('=== DATABASE STATS ===');
        console.log('Total users:', data.stats.totalUsers);
        console.log('Current counter:', data.stats.currentCounter);
        console.log('Recent users:', data.stats.recentUsers);
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
    }
  };

  // 카드를 이미지로 다운로드하는 함수
  const downloadCardAsImage = async () => {
    if (!cardRef.current || !profile) {
      alert('Card is not ready. Please wait for the card to load completely.');
      return;
    }

    try {
      console.log('Starting card capture...');
      
      // 잠시 호버 효과를 제거하고 카드를 평평하게 만듦
      const originalTransform = cardRef.current.style.transform;
      const originalStyle = cardRef.current.style.cssText;
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      
      // CSS 색상 호환성을 위한 임시 스타일 추가
      const tempStyle = document.createElement('style');
      tempStyle.id = 'temp-download-style';
      tempStyle.textContent = `
        /* html2canvas 호환성을 위한 색상 오버라이드 */
        .bg-gradient-to-r, .bg-gradient-to-br, .bg-gradient-to-bl {
          background: linear-gradient(to right, #10b981, #059669) !important;
        }
        .from-emerald-500 {
          --tw-gradient-from: #10b981 !important;
        }
        .to-emerald-600 {
          --tw-gradient-to: #059669 !important;
        }
        .from-emerald-600 {
          --tw-gradient-from: #059669 !important;
        }
        .to-emerald-700 {
          --tw-gradient-to: #047857 !important;
        }
        .from-slate-700 {
          --tw-gradient-from: #334155 !important;
        }
        .to-slate-800 {
          --tw-gradient-to: #1e293b !important;
        }
        .text-emerald-600 {
          color: #059669 !important;
        }
        .text-emerald-800 {
          color: #065f46 !important;
        }
        .border-emerald-200 {
          border-color: #a7f3d0 !important;
        }
        .bg-emerald-50 {
          background-color: #ecfdf5 !important;
        }
        .text-gray-800 {
          color: #1f2937 !important;
        }
        .text-black {
          color: #000000 !important;
        }
        .text-white {
          color: #ffffff !important;
        }
        .bg-white {
          background-color: #ffffff !important;
        }
        .border-gray-300 {
          border-color: #d1d5db !important;
        }
        .border-slate-600 {
          border-color: #475569 !important;
        }
        /* 모든 색상 함수를 기본 hex/rgb로 강제 변환 */
        * {
          color-scheme: normal !important;
          accent-color: #10b981 !important;
        }
        /* 그라데이션 배경 완전 오버라이드 */
        [style*="linear-gradient"] {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%) !important;
        }
        /* 특정 카드 배경 스타일 오버라이드 */
        .w-80.h-\\[500px\\] {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%) !important;
        }
        /* 모든 CSS 변수를 고정값으로 대체 */
        :root {
          --tw-gradient-from: #10b981 !important;
          --tw-gradient-to: #059669 !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        /* backdrop-blur 효과 제거 (호환성 문제 방지) */
        .backdrop-blur-lg, .backdrop-blur-sm {
          backdrop-filter: none !important;
          background: rgba(255, 255, 255, 0.8) !important;
        }
        /* 모든 CSS 함수 제거 */
        [style*="oklab"], [style*="oklch"], [style*="lch"], [style*="lab"] {
          color: #000000 !important;
          background: #ffffff !important;
        }
      `;
      document.head.appendChild(tempStyle);
      
      // 카드의 동적 스타일을 고정값으로 임시 변경
      cardRef.current.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%)';
      cardRef.current.style.boxShadow = '0px 25px 40px rgba(0, 0, 0, 0.15), 0px 35px 60px rgba(0, 0, 0, 0.1)';
      
      // 모든 자식 요소의 CSS 변수도 강제로 오버라이드
      const allElements = cardRef.current.querySelectorAll('*');
      const originalStyles: { element: Element; style: string }[] = [];
      
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        originalStyles.push({ element, style: htmlElement.style.cssText });
        
        // 문제가 될 수 있는 CSS 속성들을 안전한 값으로 대체
        if (htmlElement.style.background?.includes('oklab') || 
            htmlElement.style.background?.includes('oklch') ||
            htmlElement.style.color?.includes('oklab') ||
            htmlElement.style.color?.includes('oklch')) {
          htmlElement.style.background = '#ffffff';
          htmlElement.style.color = '#000000';
        }
      });
      
      // 충분한 지연 시간으로 모든 이미지와 애니메이션이 완료되도록 기다림
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Capturing card with html2canvas...');
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true, // 디버깅을 위해 로깅 활성화
        width: 320,
        height: 500,
        imageTimeout: 30000, // 30초로 증가
        removeContainer: true,
        foreignObjectRendering: false, // SVG 문제 방지
        ignoreElements: (element: HTMLElement) => {
          // 문제가 될 수 있는 요소들 무시
          return element.tagName === 'SCRIPT' || 
                 element.tagName === 'STYLE' ||
                 element.classList?.contains('ignore-capture');
        }
      } as Record<string, unknown>);

      console.log('Canvas captured successfully:', canvas.width, 'x', canvas.height);

      // 임시 스타일 제거
      const tempStyleElement = document.getElementById('temp-download-style');
      if (tempStyleElement) {
        tempStyleElement.remove();
      }

      // 원본 스타일 복원
      cardRef.current.style.cssText = originalStyle;
      originalStyles.forEach(({ element, style }) => {
        (element as HTMLElement).style.cssText = style;
      });

      // Twitter 프로필 이미지 최적 크기로 조정 (400x400)
      const targetSize = 400;
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      finalCanvas.width = targetSize;
      finalCanvas.height = targetSize;
      
      // 카드를 중앙에 배치하고 비율 유지하면서 최대한 크게
      const aspectRatio = canvas.width / canvas.height;
      let drawWidth = targetSize;
      let drawHeight = targetSize / aspectRatio;
      
      if (drawHeight > targetSize) {
        drawHeight = targetSize;
        drawWidth = targetSize * aspectRatio;
      }
      
      const x = (targetSize - drawWidth) / 2;
      const y = (targetSize - drawHeight) / 2;
      
      // 배경을 투명하게 유지
      ctx.clearRect(0, 0, targetSize, targetSize);
      
      // 카드 그리기
      ctx.drawImage(canvas, x, y, drawWidth, drawHeight);

      console.log('Final canvas prepared, starting download...');

      // 다운로드 링크 생성
      try {
        const dataURL = finalCanvas.toDataURL('image/png', 1.0);
        
        if (!dataURL || dataURL === 'data:,') {
          throw new Error('Failed to generate image data');
        }
        
        const link = document.createElement('a');
        link.download = `irys-card-${profile.username}-pfp.png`;
        link.href = dataURL;
        
        // 다운로드 실행
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated successfully');
      } catch (downloadError) {
        throw new Error(`Download failed: ${downloadError}`);
      }

      // 원래 transform 복원
      cardRef.current.style.transform = originalTransform;
      
      console.log('Card image downloaded successfully');
      
    } catch (error) {
      console.error('Error during card image download:', error);
      
      // 임시 스타일 제거 (에러 시에도)
      const tempStyleElement = document.getElementById('temp-download-style');
      if (tempStyleElement) {
        tempStyleElement.remove();
      }
      
      // 원래 transform 복원 (에러 시에도)
      if (cardRef.current) {
        // transform을 기본값으로 복원
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      }
      
      // 더 구체적인 에러 메시지
      let errorMessage = 'Failed to download image. ';
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage += 'Image loading blocked by CORS policy. ';
        } else if (error.message.includes('timeout')) {
          errorMessage += 'Image loading timed out. ';
        } else if (error.message.includes('context')) {
          errorMessage += 'Canvas rendering failed. ';
        } else if (error.message.includes('oklab') || error.message.includes('color function')) {
          errorMessage += 'CSS color compatibility issue detected. ';
        } else {
          errorMessage += `Error: ${error.message}. `;
        }
      }
      errorMessage += 'Please try again.';
      
      alert(errorMessage);
    }
  };

  // 컴포넌트 마운트 시 데이터베이스 상태 확인
  useEffect(() => {
    checkDatabaseStats();
  }, []);

  // userNumber 변경 추적
  useEffect(() => {
    console.log('🎯 userNumber state updated to:', userNumber);
  }, [userNumber]);

  // cleanup 함수
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
      setUserFontStyle(getFontStyleByUsername(normalizedProfile.username)); // 아이디 기반 글씨체 선택
      
      console.log('🔢 About to get user number for:', normalizedProfile.username);
      setIsUserNumberLoading(true);
      const userNum = await getUserNumber(normalizedProfile);
      console.log('🔢 Got user number:', userNum, 'for user:', normalizedProfile.username);
      console.log('🔢 Setting userNumber state to:', userNum);
      setUserNumber(userNum); // 사용자 번호 설정
      setIsUserNumberLoading(false);
      
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
      setUserFontStyle(getFontStyleByUsername(normalizedProfile.username)); // 아이디 기반 글씨체 선택
      
      console.log('🔢 About to get user number for:', normalizedProfile.username);
      setIsUserNumberLoading(true);
      const userNum = await getUserNumber(normalizedProfile);
      console.log('🔢 Got user number:', userNum, 'for user:', normalizedProfile.username);
      console.log('🔢 Setting userNumber state to:', userNum);
      setUserNumber(userNum); // 사용자 번호 설정
      setIsUserNumberLoading(false);
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
    <div className="max-w-4xl mx-auto pt-12">
      {/* IRYS Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <Image 
            src="/iryslogo.png" 
            alt="IRYS" 
            width={300}
            height={-15}
            className="w-72 h-auto"
          />
        </div>
      </div>
      
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
    <div className="max-w-4xl mx-auto pt-12">
      {/* IRYS Logo */}
      <div className="text-center mb-8">
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
        {/* Shadow container */}
        <div className="relative">
          <div 
            ref={cardRef}
            className="w-80 h-[500px] rounded-3xl p-6 relative overflow-hidden border border-gray-300/30 transition-all duration-200"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `perspective(1000px) rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              transition: isHovering 
                ? 'transform 0.008s linear, box-shadow 0.025s ease-out' 
                : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.1s ease-out',
              background: `
                linear-gradient(135deg, 
                  #f8fafc 0%, 
                  #e2e8f0 15%, 
                  #cbd5e1 30%, 
                  #94a3b8 45%, 
                  #64748b 60%, 
                  #475569 75%, 
                  #334155 90%, 
                  #1e293b 100%
                ),
                radial-gradient(circle at 30% 70%, 
                  rgba(139, 92, 246, 0.1) 0%, 
                  transparent 50%
                ),
                radial-gradient(circle at 70% 30%, 
                  rgba(59, 130, 246, 0.1) 0%, 
                  transparent 50%
                )
              `,
              boxShadow: `
                ${cardRotation.y * 2}px ${25 + cardRotation.x * 2}px ${40 + Math.abs(cardRotation.x + cardRotation.y) * 3}px rgba(0, 0, 0, 0.15),
                ${cardRotation.y * 4}px ${35 + cardRotation.x * 3}px ${60 + Math.abs(cardRotation.x + cardRotation.y) * 4}px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.7),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              `
            }}
          >
          {/* Holographic Shine Layer */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cardOpacity * 0.9,
              background: `
                repeating-linear-gradient(
                  ${110 + backgroundPosition.x * 1.2}deg,
                  hsl(300, 70%, 65%) 0%,
                  hsl(260, 70%, 75%) 8%,
                  hsl(200, 70%, 80%) 16%,
                  hsl(150, 70%, 75%) 24%,
                  hsl(100, 70%, 70%) 32%,
                  hsl(50, 70%, 80%) 40%,
                  hsl(0, 70%, 75%) 48%,
                  hsl(300, 70%, 65%) 56%
                ),
                repeating-linear-gradient(
                  ${-45 + backgroundPosition.y * 0.8}deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.1) 2%,
                  transparent 4%,
                  rgba(255, 255, 255, 0.15) 6%,
                  transparent 8%
                ),
                radial-gradient(
                  farthest-corner circle at ${mousePosition.x}% ${mousePosition.y}%,
                  rgba(255, 255, 255, 0.9) 0%,
                  rgba(255, 255, 255, 0.3) 30%,
                  transparent 80%
                )
              `,
              backgroundSize: '300% 300%, 20px 20px, 200% 200%',
              backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%, ${backgroundPosition.x * 0.5}px ${backgroundPosition.y * 0.5}px, center`,
              mixBlendMode: 'color-dodge',
              filter: `brightness(${1.1 + pointerFromCenter * 0.4}) contrast(2.8) saturate(1.2) hue-rotate(${mousePosition.x * 0.5}deg)`,
              transition: isHovering ? 'filter 0.1s ease' : 'opacity 0.4s ease, background-position 0.4s ease, filter 0.4s ease'
            }}
          ></div>

          {/* Holographic Glare Layer */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cardOpacity * 0.8,
              background: `
                radial-gradient(
                  farthest-corner circle at ${mousePosition.x}% ${mousePosition.y}%,
                  rgba(255, 255, 255, 0.9) 8%,
                  rgba(255, 255, 255, 0.4) 25%,
                  rgba(0, 0, 0, 0.3) 90%
                ),
                conic-gradient(
                  from ${backgroundPosition.x * 2}deg at ${mousePosition.x}% ${mousePosition.y}%,
                  transparent 0deg,
                  rgba(255, 100, 255, 0.3) 60deg,
                  transparent 120deg,
                  rgba(100, 255, 255, 0.3) 180deg,
                  transparent 240deg,
                  rgba(255, 255, 100, 0.3) 300deg,
                  transparent 360deg
                )
              `,
              mixBlendMode: 'overlay',
              transition: isHovering ? 'none' : 'opacity 0.4s ease'
            }}
          ></div>

          {/* Prismatic Refraction Effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cardOpacity * 0.5,
              background: `
                linear-gradient(
                  ${45 + mousePosition.x * 0.5}deg,
                  rgba(255, 0, 150, 0.4) 0%,
                  transparent 20%,
                  rgba(0, 255, 200, 0.4) 40%,
                  transparent 60%,
                  rgba(255, 255, 0, 0.4) 80%,
                  transparent 100%
                )
              `,
              backgroundSize: '150% 150%',
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              mixBlendMode: 'screen',
              filter: `blur(${Math.max(0, 2 - pointerFromCenter * 2)}px)`,
              transition: isHovering ? 'none' : 'opacity 0.4s ease, background-position 0.4s ease'
            }}
          ></div>

          {/* Dynamic Rainbow Spectrum */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cardOpacity * 0.6,
              background: `
                conic-gradient(
                  from ${backgroundPosition.x * 3}deg at ${mousePosition.x}% ${mousePosition.y}%,
                  hsl(0, 80%, 70%) 0deg,
                  hsl(30, 80%, 70%) 30deg,
                  hsl(60, 80%, 70%) 60deg,
                  hsl(120, 80%, 70%) 90deg,
                  hsl(180, 80%, 70%) 120deg,
                  hsl(240, 80%, 70%) 150deg,
                  hsl(300, 80%, 70%) 180deg,
                  hsl(0, 80%, 70%) 210deg,
                  hsl(60, 80%, 70%) 240deg,
                  hsl(120, 80%, 70%) 270deg,
                  hsl(240, 80%, 70%) 300deg,
                  hsl(300, 80%, 70%) 330deg,
                  hsl(0, 80%, 70%) 360deg
                )
              `,
              backgroundSize: '400% 400%',
              mixBlendMode: 'color-dodge',
              filter: `blur(${3 - pointerFromCenter * 2}px) saturate(1.5)`,
              transition: isHovering ? 'filter 0.1s ease' : 'opacity 0.4s ease, filter 0.4s ease'
            }}
          ></div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 border border-gray-300/30 rounded-full"></div>
            <div className="absolute top-20 right-8 w-16 h-16 border border-gray-400/20 rounded-full"></div>
            <div className="absolute bottom-20 left-6 w-12 h-12 border border-gray-500/15 rounded-full"></div>
            <div className="absolute bottom-32 right-12 w-8 h-8 border border-gray-600/25 rounded-full"></div>
          </div>

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <h3 
              ref={nicknameRef}
              className={`${nicknameFontSize} font-bold text-gray-800 leading-tight`} 
              style={{ 
                fontFamily: 'Noto Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                maxWidth: '200px',
                wordBreak: 'break-word',
                hyphens: 'auto'
              }}
            >
              {profile.displayName}
            </h3>
            {userNumber !== null && !isUserNumberLoading && (
              <div className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg border border-slate-600/30">
                <span className="text-white font-bold text-lg tracking-wider text-center block min-w-[3rem] italic" style={{ fontFamily: 'Noto Sans, monospace' }}>
                  #{userNumber}
                </span>
              </div>
            )}
            {isUserNumberLoading && (
              <div className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg border border-slate-600/30">
                <span className="text-white font-bold text-lg tracking-wider text-center block min-w-[3rem] italic" style={{ fontFamily: 'Noto Sans, monospace' }}>
                  ...
                </span>
              </div>
            )}
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
            </div>
          </div>

          {/* Bio Section */}
          <div className="relative z-10 mb-6">
            <div className="bg-emerald-50/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50">
              <div className="flex items-center">
                {/* 스프라이트 이미지 */}
                <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                  <Image
                    src={`/${currentSprite.index + 1}.png`}
                    alt={currentSprite.sprite.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={(e) => {
                      console.log('Sprite image loading error:', `/${currentSprite.index + 1}.png`);
                      // 에러 시 기본 이미지나 빈 div로 대체할 수 있습니다
                    }}
                  />
                </div>
                
                <div className="text-left flex-1">
                  {profile.verified ? (
                    <span className="text-black font-medium">Verified User</span>
                  ) : (
                    <div>
                      <div className="text-black font-bold text-lg mb-1">
                        {currentSprite.sprite.name}
                      </div>
                      <div className="text-black/70 text-sm">
                        {currentSprite.sprite.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Holographic Light Points */}
          <div 
            className="absolute w-2 h-2 rounded-full transition-all duration-200"
            style={{
              top: `${20 + cardRotation.x + pointerFromCenter * 10}%`,
              right: `${15 + cardRotation.y + mousePosition.x * 0.1}%`,
              opacity: cardOpacity * 0.9,
              background: `radial-gradient(circle, 
                rgba(255, 255, 255, 0.9) 0%, 
                rgba(100, 255, 255, 0.6) 50%, 
                transparent 100%
              )`,
              boxShadow: `0 0 15px rgba(100, 255, 255, ${cardOpacity * 0.8}), 
                         0 0 25px rgba(255, 255, 255, ${cardOpacity * 0.4})`,
              transform: `scale(${1 + pointerFromCenter * 0.5}) rotate(${backgroundPosition.x}deg)`
            }}
          ></div>
          <div 
            className="absolute w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              bottom: `${25 + cardRotation.x + pointerFromCenter * 15}%`,
              left: `${20 + cardRotation.y + mousePosition.y * 0.1}%`,
              opacity: cardOpacity * 0.7,
              background: `radial-gradient(circle, 
                rgba(255, 200, 255, 0.9) 0%, 
                rgba(255, 100, 200, 0.5) 50%, 
                transparent 100%
              )`,
              boxShadow: `0 0 12px rgba(255, 100, 200, ${cardOpacity * 0.6}), 
                         0 0 20px rgba(255, 200, 255, ${cardOpacity * 0.3})`,
              transform: `scale(${1 + pointerFromCenter * 0.3}) rotate(${-backgroundPosition.y}deg)`
            }}
          ></div>
          <div 
            className="absolute w-1 h-1 rounded-full transition-all duration-150"
            style={{
              top: `${60 + cardRotation.y + pointerFromCenter * 8}%`,
              right: `${40 + cardRotation.x + mousePosition.x * 0.08}%`,
              opacity: cardOpacity * 0.8,
              background: `radial-gradient(circle, 
                rgba(200, 255, 100, 0.9) 0%, 
                rgba(100, 255, 150, 0.6) 50%, 
                transparent 100%
              )`,
              boxShadow: `0 0 10px rgba(100, 255, 150, ${cardOpacity * 0.7}), 
                         0 0 18px rgba(200, 255, 100, ${cardOpacity * 0.3})`,
              transform: `scale(${1 + pointerFromCenter * 0.4}) rotate(${backgroundPosition.x * 1.5}deg)`
            }}
          ></div>
          </div>
        </div>
        
        {/* Download Button */}
        {profile && (
          <div className="mt-6">
            <button
              onClick={downloadCardAsImage}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path 
                  d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" 
                  fill="currentColor"
                />
                <path 
                  d="M5 20V18H19V20H5Z" 
                  fill="currentColor"
                />
              </svg>
              Download PFP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
